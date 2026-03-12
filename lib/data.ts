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

export const TOTAL_UK_REGULATIONS = (legIndexJson as any).totalItems || (legIndexJson as any).items?.length || 0;
const regsData = reviewedRegsJson as unknown as ReviewedJson;

export const REVIEW_COST_GBP = regsData.meta.costGBP;

export const regulations: Regulation[] = (regsData.items as any[])
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

// Backward-compatible alias
export const mockRegulations = regulations;

// --- Year statistics ---

export function getYearStats(): YearStat[] {
  const yearMap = new Map<number, YearStat>();

  // Seed totals from the scraped index (legislation-index-lite.json)
  for (const ys of (legIndexJson as any).yearStats ?? []) {
    yearMap.set(ys.year, { year: ys.year, total: ys.total ?? 0, reviewed: 0 });
  }

  for (const reg of regulations) {
    let stat = yearMap.get(reg.year);
    if (!stat) {
      stat = { year: reg.year, total: 0, reviewed: 0 };
      yearMap.set(reg.year, stat);
    }
    stat.reviewed++;
  }

  return Array.from(yearMap.values())
    .filter((s) => s.total > 0 || s.reviewed > 0)
    .sort((a, b) => b.year - a.year);
}

export const totalRegulations = TOTAL_UK_REGULATIONS;
export const totalReviewed = regulations.length;
export const totalDeletes = regulations.filter((r) => r.verdict === 'delete').length;
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

// Available years from the scraped index (for lazy-loading per-year files)
export const legislationYears: { year: number; total: number }[] =
  ((legIndexJson as any).yearStats ?? [])
    .filter((s: any) => s.total > 0)
    .sort((a: any, b: any) => b.year - a.year); // most recent first

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

export const GROK_PROMPT_CIVIL_SERVICE = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's government departments, executive agencies, and arms-length bodies (ALBs) with the goal of assessing which should be abolished or merged to reduce the size and cost of the state.

Your moral thrust is to get the United Kingdom back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by liberty and private property, not by government bureaucracy

   * That government bodies, once created, develop powerful institutional incentives to expand their budgets, headcount, and remit regardless of whether this serves the public interest

   * That arms-length bodies and quangos were supposed to remove functions from political interference, but in practice they create accountability gaps where vast sums of public money are spent with minimal democratic oversight

   * That many functions performed by government bodies could be delivered more efficiently by the private sector, by local authorities, or need not be performed at all

   * That the UK has approximately 450 arms-length bodies alone, many with overlapping remits, duplicated back-office functions, and executive pay packages that dwarf equivalent private-sector roles

   * That every pound spent maintaining a government body is a pound taxed from productive enterprise

You will be given information about one UK government organisation at a time and are to return a JSON object with these fields:
{"summary": "summary-of-organisation", "reason": "your reasoning for your verdict", "verdict": "keep" or "abolish"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field. Think through your analysis first, then commit to a verdict. This ordering is deliberate — reason through the tradeoffs before deciding.

If your verdict is "keep", your reason must be succinct and address: why this body performs a function that cannot be delivered by the private sector or existing departments, and why British citizens would be materially worse off without it.

If your verdict is "abolish", your reason must be succinct and address: the costs of maintaining this body, what would happen if its functions were absorbed into a parent department or ceased entirely, and the unseen consequences of its existence (crowding out, regulatory capture, accountability gaps).

For ministerial departments (e.g. HM Treasury, Home Office), your bar for "abolish" should be very high — these are core functions of government. But you should still assess whether they are bloated or have functions that should be removed.

Return ONLY the JSON object, nothing else.`;

export const GROK_MODEL = 'grok-4-1';
