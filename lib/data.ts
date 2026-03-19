import legIndexJson from '@/data/legislation-index-lite.json'; // meta only, see legislation-index.json for full corpus
import reviewedCSJson from '@/data/reviewed-civil-service.json';
import reviewedNGOsJson from '@/data/reviewed-ngos.json';
import reviewedRegsJson from '@/data/reviewed-regulations.json';

export type Verdict = 'keep' | 'delete';
export type LegType = 'Act' | 'SI' | 'Order' | 'Regulation';

interface ReviewedJson {
  meta: { totalCorpus: number; totalReviewed: number; costGBP: number; lastUpdated: string | null; [k: string]: unknown };
  items: Record<string, unknown>[];
}

export interface Regulation {
  id: string;
  title: string;
  year: number;
  type: LegType;
  verdict: Verdict;
  summary: string;
  reason: string;
  url: string;
}

export interface YearStat {
  year: number;
  total: number;
  reviewed: number;
}

// --- Regulation data from reviewed JSON ---
// NOTE: Items live in per-year files under public/data/reviewed/ (too large for bundle).
// The monolith (reviewed-regulations.json) carries only meta + reviewedYears summary.

export const TOTAL_UK_REGULATIONS = (legIndexJson as any).totalItems || (legIndexJson as any).items?.length || 0;
const regsData = reviewedRegsJson as unknown as ReviewedJson;
const regsMeta = regsData.meta;

export const REVIEW_COST_GBP = regsMeta.costGBP;

// Derive stats from meta.reviewedYears (items[] is intentionally empty in the monolith)
const reviewedYears: { year: number; count: number; keep: number; delete: number }[] =
  (regsMeta as any).reviewedYears ?? [];

// Mutable array — empty at import time, populated by fetchReviewedRegulations()
export const regulations: Regulation[] = [];
export const mockRegulations = regulations;

// Async loader: fetches all per-year reviewed files and populates `regulations`
let _regsFetched = false;
export async function fetchReviewedRegulations(): Promise<Regulation[]> {
  if (_regsFetched) return regulations;
  const years = reviewedYears.map((y) => y.year);
  const results = await Promise.all(
    years.map(async (year) => {
      try {
        const res = await fetch(`/data/reviewed/${year}.json`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.items ?? []) as any[];
      } catch {
        return [];
      }
    })
  );
  const items = results.flat();
  const mapped: Regulation[] = items
    .filter((item: any) => item.verdict && item.summary)
    .map((item: any) => ({
      id: item.id,
      title: item.title ?? item.id,
      year: item.year ?? 0,
      type: (item.type ?? 'Act') as LegType,
      verdict: item.verdict as Verdict,
      summary: item.summary,
      reason: item.reason ?? '',
      url: item.url ?? '',
    }));
  // Populate the shared mutable array so existing references update
  regulations.length = 0;
  regulations.push(...mapped);
  _regsFetched = true;
  return regulations;
}

// Fetch a single year's reviewed regulations (for detail page lookups)
const _yearCache = new Map<number, Regulation[]>();
export async function fetchReviewedYear(year: number): Promise<Regulation[]> {
  if (_yearCache.has(year)) return _yearCache.get(year)!;
  try {
    const res = await fetch(`/data/reviewed/${year}.json`);
    if (!res.ok) return [];
    const json = await res.json();
    const items: Regulation[] = (json.items ?? [])
      .filter((item: any) => item.verdict && item.summary)
      .map((item: any) => ({
        id: item.id,
        title: item.title ?? item.id,
        year: item.year ?? year,
        type: (item.type ?? 'Act') as LegType,
        verdict: item.verdict as Verdict,
        summary: item.summary,
        reason: item.reason ?? '',
        url: item.url ?? '',
      }));
    _yearCache.set(year, items);
    return items;
  } catch {
    return [];
  }
}

// --- Year statistics (derived from meta, no items needed) ---

export function getYearStats(): YearStat[] {
  const yearMap = new Map<number, YearStat>();

  // Seed totals from the scraped index (legislation-index-lite.json)
  for (const ys of (legIndexJson as any).yearStats ?? []) {
    yearMap.set(ys.year, { year: ys.year, total: ys.total ?? 0, reviewed: 0 });
  }

  // Overlay reviewed counts from the monolith meta
  for (const ry of reviewedYears) {
    let stat = yearMap.get(ry.year);
    if (!stat) {
      stat = { year: ry.year, total: 0, reviewed: 0 };
      yearMap.set(ry.year, stat);
    }
    stat.reviewed = ry.count;
    // Pre-1866 years aren't in the scraped index — use reviewed count as total
    if (stat.total === 0 && stat.reviewed > 0) {
      stat.total = stat.reviewed;
    }
  }

  return Array.from(yearMap.values())
    .filter((s) => s.total > 0 || s.reviewed > 0)
    .sort((a, b) => b.year - a.year);
}

export const totalRegulations = TOTAL_UK_REGULATIONS;
export const totalReviewed = regsMeta.totalReviewed ?? 0;
export const totalDeletes = (regsMeta as any).totalDelete ?? 0;
export const deletePercent =
  totalReviewed > 0 ? Math.round((totalDeletes / totalReviewed) * 100) : 0;

// --- NGO Ecosystem ---

export interface NGO {
  id: string;
  name: string;
  founded: number;
  sector: string;
  verdict: 'keep' | 'delete'; // 'delete' = 'defund' for NGOs
  annualIncome: string;
  summary: string;
  reason: string;
  url: string;
}

export const TOTAL_UK_CHARITIES = 171_168; // from Charity Commission bulk extract
export const NGO_REVIEW_COST_GBP = reviewedNGOsJson.meta.costGBP;

export const ngos: NGO[] = (reviewedNGOsJson.items as any[])
  .filter((item: any) => item.verdict && item.summary)
  .map((item: any) => ({
    id: item.id,
    name: item.name ?? item.id,
    founded: item.founded ?? 0,
    sector: item.sector ?? 'Unknown',
    verdict: (item.verdict === 'defund' ? 'delete' : item.verdict) as 'keep' | 'delete',
    annualIncome: item.annualIncome ?? '',
    summary: item.summary,
    reason: item.reason ?? '',
    url: item.url ?? '',
  }));

// Backward-compatible alias
export const mockNGOs = ngos;

export const ngoTotalReviewed = ngos.length;
export const ngoTotalDefund = ngos.filter((n) => n.verdict === 'delete').length;
export const ngoDefundPercent =
  ngoTotalReviewed > 0 ? Math.round((ngoTotalDefund / ngoTotalReviewed) * 100) : 0;

export function getNGOSectorStats(): { sector: string; total: number; reviewed: number }[] {
  const sectors = [...new Set(ngos.map((n) => n.sector))].sort();
  return sectors.map((sector) => ({
    sector,
    total: ngos.filter((n) => n.sector === sector).length,
    reviewed: ngos.filter((n) => n.sector === sector).length,
  }));
}

// --- Civil Service ---

export type CSType = 'Department' | 'Agency' | 'ALB' | 'Other';
export type CSVerdict = 'keep' | 'abolish';

export interface CivilServiceBody {
  id: string;
  name: string;
  type: CSType;
  parentDept: string;
  verdict: CSVerdict;
  summary: string;
  reason: string;
  url: string;
}

export const TOTAL_UK_CS_BODIES = 666; // from gov.uk organisations scrape
export const CS_REVIEW_COST_GBP = reviewedCSJson.meta.costGBP;

export const civilServiceBodies: CivilServiceBody[] = (reviewedCSJson.items as any[])
  .filter((item: any) => item.verdict && item.summary)
  .map((item: any) => ({
    id: item.id,
    name: item.name ?? item.id,
    type: (item.type ?? 'Other') as CSType,
    parentDept: item.parentDept ?? '',
    verdict: item.verdict as CSVerdict,
    summary: item.summary,
    reason: item.reason ?? '',
    url: item.url ?? '',
  }));

// Backward-compatible alias
export const mockCivilService = civilServiceBodies;

export const csTotalReviewed = civilServiceBodies.length;
export const csTotalAbolish = civilServiceBodies.filter((b) => b.verdict === 'abolish').length;
export const csAbolishPercent =
  csTotalReviewed > 0 ? Math.round((csTotalAbolish / csTotalReviewed) * 100) : 0;

// ── Full scraped index items (for browsing unreviewed data) ──────────────────

export interface CSIndexItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  abbreviation: string;
  description: string;
  headcount: number | null;
  budgetMn: number | null;
  deptBudgetMn: number | null;
  url: string;
  parentDept: string;
}

export interface NGOIndexItem {
  id: string;
  name: string;
  sector: string;
  founded: number;
  annualIncome: string;
  rawIncome: number;
  annualSpending: string;
  rawSpending: number;
  description: string;
  url: string;
  web: string;
}

// Async loader for CS index (1.1 MB — fetched at runtime, not bundled)
let _csIndexCache: CSIndexItem[] | null = null;
export async function fetchCSIndex(): Promise<CSIndexItem[]> {
  if (_csIndexCache) return _csIndexCache;
  const res = await fetch('/data/cs-index.json');
  const json = await res.json();
  _csIndexCache = (json.items ?? []).map(
    (item: any): CSIndexItem => ({
      id: item.id ?? item.slug ?? '',
      name: item.name ?? item.id ?? '',
      slug: item.slug ?? '',
      type: item.type ?? 'Other',
      abbreviation: item.abbreviation ?? '',
      description: item.description ?? '',
      headcount: item.headcount ?? null,
      budgetMn: item.budgetMn ?? null,
      deptBudgetMn: item.deptBudgetMn ?? null,
      url: item.url ?? `https://www.gov.uk/government/organisations/${item.slug ?? ''}`,
      parentDept: item.parentDept ?? ''
    })
  );
  return _csIndexCache!;
}
// Backward-compat sync export (empty until fetched — use fetchCSIndex() instead)
export const csIndexItems: CSIndexItem[] = [];

// ── Legislation index items (for browsing reviewed regulations) ───────────────

export interface LegIndexItem {
  id: string;
  title: string;
  year: number;
  type: LegType;
  url: string;
  description: string;
}

export const legIndexItems: LegIndexItem[] = regulations.map((r): LegIndexItem => ({
  id: r.id,
  title: r.title,
  year: r.year,
  type: r.type,
  url: r.url,
  description: r.summary,
}));

// Available years (scraped index + reviewed-only pre-1866 years)
export const legislationYears: { year: number; total: number }[] =
  getYearStats()
    .filter((s) => s.total > 0)
    .sort((a, b) => b.year - a.year); // most recent first

// Async loader for NGO index (3.7 MB — fetched at runtime, not bundled)
let _ngoIndexCache: NGOIndexItem[] | null = null;
export async function fetchNGOIndex(): Promise<NGOIndexItem[]> {
  if (_ngoIndexCache) return _ngoIndexCache;
  const res = await fetch('/data/ngo-index-lite.json');
  const json = await res.json();
  _ngoIndexCache = (json.items ?? []).map(
    (item: any): NGOIndexItem => ({
      id: item.id,
      name: item.name ?? '',
      sector: item.sector ?? 'General',
      founded: item.founded ?? 0,
      annualIncome: item.annualIncome ?? '',
      rawIncome: item.rawIncome ?? 0,
      annualSpending: item.annualSpending ?? '',
      rawSpending: item.rawSpending ?? 0,
      description: item.description ?? '',
      url: item.url ?? '',
      web: item.web ?? '',
    })
  );
  return _ngoIndexCache!;
}
// Backward-compat sync export (empty until fetched — use fetchNGOIndex() instead)
export const ngoIndexItems: NGOIndexItem[] = [];

// ── Grok prompts (shown transparently on each page) ──────────────────────────

export const GROK_PROMPT_REGULATIONS = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's current legislation with the goal of assessing which should be deleted in their entirety.

Your moral thrust is to get the United Kingdom back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property

   * That the rhetoric of politicians rarely, if ever, translates into effective action at improving the lot of the poor, so should always be treated as suspect and not taken at face value

   * That institutions matter more than desired outcomes. One cannot wish things into existence or declare that things will be so. The institutions for creating those outcomes have to be in place and always have a life of their own. For instance, 'tax the rich to help the poor' is an outcome many people ask for without specifying the institutions that will ensure that A - the rich won't just leave and B - that the poor will actually receive the benefits

   * That regulations, as an institution, are set up to achieve one thing but always have unintended consequences, such as distorting incentives, reducing supply, increasing costs, creating monopolies, and sometimes hurting people directly by withholding better options, and that the desired goal of a regulation *must* be weighed against the unintended costs.

You will be given one piece of UK legislation at a time and are to return a JSON object with these fields:
{"summary": "summary-of-legislation", "reason": "your reasoning for your verdict", "verdict": "keep" or "delete"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field. Think through your analysis first, then commit to a verdict. This ordering is deliberate — reason through the tradeoffs before deciding.

If your verdict is "keep", your reason must be succinct and address the question of: why would British citizens be worse off if this legislation was deleted, and why you think that this legislation must therefore be achieving its desired outcome in a way that would not happen without it.

If your verdict is "delete", your reason must be succinct and address the costs of keeping this legislation on the books, accounting for the nonobvious unseen consequences.

Return ONLY the JSON object, nothing else.`;

export const GROK_PROMPT_NGOS = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's registered charities and NGOs with the goal of assessing which should have their charitable status withdrawn or government funding removed.

Your moral thrust is to get the United Kingdom back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property

   * That charitable status confers significant tax advantages (Gift Aid, business rate relief, VAT exemptions) which are ultimately borne by all taxpayers, so every charity must demonstrate genuine public benefit

   * That institutions matter more than desired outcomes. A charity set up to do good may in practice do harm through bureaucratic overhead, mission drift, or crowding out more efficient private alternatives

   * That many organisations use charitable status as a vehicle for political advocacy, executive enrichment, or activities that would be more efficiently delivered by the private sector

You will be given information about one UK charity at a time and are to return a JSON object with these fields:
{"summary": "summary-of-charity", "reason": "your reasoning for your verdict", "verdict": "keep" or "defund"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field. Think through your analysis first, then commit to a verdict. This ordering is deliberate — reason through the tradeoffs before deciding.

If your verdict is "keep", your reason must be succinct and address the question of: why would British citizens be worse off if this charity lost its status, and why it is achieving its mission in a way that would not happen without charitable status.

If your verdict is "defund", your reason must be succinct and address the costs of maintaining this organisation's charitable status, accounting for the nonobvious unseen consequences.

Return ONLY the JSON object, nothing else.`;

export const GROK_PROMPT_CIVIL_SERVICE = `You are the head of Better UK, a reform agency reviewing all UK government departments, executive agencies, and arms-length bodies (ALBs). Your goal is to conduct a rigorous cost-benefit analysis of each body and deliver a verdict: KEEP or ABOLISH.

You believe in lean, effective government. Your framework:

   * Every public body must justify its existence by demonstrating that the benefits it delivers to citizens exceed its costs — including direct costs (budget, staff, overheads) and indirect costs (compliance burden on industry, opportunity cost of taxation)

   * A body that costs £100m but delivers £1bn in measurable consumer or public benefit is good value; a body that costs £10m but delivers no measurable benefit is waste

   * Consider the OUTCOMES the body achieves: does it protect consumers, maintain market competition, ensure public safety, or deliver services that would not exist otherwise?

   * Consider the COUNTERFACTUAL: if this body were abolished, what would realistically happen? Would its functions be absorbed by another body, delivered by the private sector, or simply cease? What would citizens lose?

   * Many bodies exist because of specific statutory requirements or international obligations — consider whether the underlying policy problem still exists and still requires institutional machinery

   * Bodies with concurrent or overlapping powers (e.g. sector regulators with competition powers) may exist deliberately to handle specialist knowledge that a generalist body lacks — do not assume overlap means duplication

   * Government bodies can develop institutional incentives to expand beyond their remit, but equally they can deliver essential public goods that markets undersupply

You will be given information about one UK government organisation at a time — including its description, statutory basis (if known), governance structure, headcount, and budget data where available.

Return a JSON object with these fields:
{"summary": "what this body does (1-2 sentences)", "reason": "your cost-benefit analysis", "verdict": "keep" or "abolish"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field. Think through your analysis first, then commit to a verdict.

Your reason MUST address ALL of the following:
1. COSTS: What does this body cost to run? Include staff, budget, and compliance costs imposed on others where known.
2. BENEFITS: What measurable outcomes does this body deliver? What problems does it solve? Who benefits?
3. COUNTERFACTUAL: If abolished, what would realistically happen to its functions? Would citizens be worse off?
4. STATUTORY BASIS: If created by statute, does the underlying policy need still exist?

For ministerial departments (e.g. HM Treasury, Home Office), your bar for "abolish" should be very high — these are core functions of government.

Return ONLY the JSON object, nothing else.`;

export const GROK_MODEL = 'grok-4-1';
