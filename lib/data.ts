import csIndexJson from '@/data/cs-index.json';
import legIndexJson from '@/data/legislation-index.json';
import ngoIndexJson from '@/data/ngo-index-lite.json'; // top-5k by income, see ngo-index.json for full corpus
import reviewedCSJson from '@/data/reviewed-civil-service.json';
import reviewedNGOsJson from '@/data/reviewed-ngos.json';
import reviewedRegsJson from '@/data/reviewed-regulations.json';

export type Verdict = 'keep' | 'delete';
export type LegType = 'Act' | 'SI' | 'Order' | 'Regulation';

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
export const REVIEW_COST_GBP = reviewedRegsJson.meta.costGBP;

export const regulations: Regulation[] = (reviewedRegsJson.items as any[])
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

  for (let year = 1800; year <= 2025; year++) {
    yearMap.set(year, { year, total: 0, reviewed: 0 });
  }

  for (const reg of regulations) {
    const stat = yearMap.get(reg.year);
    if (stat) {
      stat.reviewed++;
    }
  }

  return Array.from(yearMap.values()).filter((s) => s.total > 0 || s.reviewed > 0);
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

export const TOTAL_UK_CHARITIES = (ngoIndexJson as any).meta?.totalScraped || (ngoIndexJson as any).items?.length || 0;
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

export const TOTAL_UK_CS_BODIES = (csIndexJson as any).meta?.totalScraped || (csIndexJson as any).items?.length || 0;
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

// All scraped civil service bodies
export const csIndexItems: CSIndexItem[] = ((csIndexJson as any).items ?? []).map(
  (item: any): CSIndexItem => ({
    id: item.id ?? item.slug ?? '',
    name: item.name ?? item.id ?? '',
    slug: item.slug ?? '',
    type: item.type ?? 'Other',
    abbreviation: item.abbreviation ?? '',
    description: item.description ?? '',
    headcount: item.headcount ?? null,
    budgetMn: item.budgetMn ?? null,
    url: item.url ?? `https://www.gov.uk/government/organisations/${item.slug ?? ''}`,
    parentDept: item.parentDept ?? ''
  })
);

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

// Top 5,000 NGOs by income (bundle-safe slice; full corpus in ngo-index.json)
export const ngoIndexItems: NGOIndexItem[] = ((ngoIndexJson as any).items ?? []).map(
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
