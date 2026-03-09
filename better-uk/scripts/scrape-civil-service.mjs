#!/usr/bin/env node
/**
 * scrape-civil-service.mjs
 *
 * Scrapes UK government organisations from the gov.uk API.
 * Collects departments, agencies, ALBs (arms-length bodies), and other
 * public bodies, then writes them to data/cs-index.json for the review
 * script (review-civil-service.mjs) to process.
 *
 * Usage:
 *   node scripts/scrape-civil-service.mjs
 *
 * Data source:
 *   https://www.gov.uk/api/organisations
 *   This is a public JSON API that lists all government organisations.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const INDEX_PATH = resolve(DATA_DIR, 'cs-index.json');

// ─── Configuration ────────────────────────────────────────────────────────────

const DELAY_MS = 300;
const GOV_UK_API = 'https://www.gov.uk/api/organisations';

// Map gov.uk organisation formats to our types
const ORG_TYPE_MAP = {
  'Ministerial department': 'Department',
  'Non-ministerial department': 'Department',
  'Executive agency': 'Agency',
  'Executive non-departmental public body': 'ALB',
  'Advisory non-departmental public body': 'ALB',
  'Tribunal': 'ALB',
  'Executive office': 'Agency',
  'Special health authority': 'ALB',
  'Public corporation': 'ALB',
  'Independent monitoring body': 'ALB',
  'Court': 'Other',
  'Devolved government': 'Other',
  'Devolved administration': 'Other',
  'Sub organisation': 'Other',
  'Civil service': 'Agency',
  'Ad hoc advisory group': 'ALB',
  'Other': 'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function slugToId(slug) {
  return 'GOV-' + slug.toUpperCase().replace(/-/g, '_').slice(0, 50);
}

function formatTitle(title) {
  return title?.trim() || 'Unknown Organisation';
}

function mapOrgType(format) {
  if (!format) return 'Other';
  return ORG_TYPE_MAP[format] || 'Other';
}

// ─── Gov.uk API ───────────────────────────────────────────────────────────────

async function fetchOrganisationsPage(page) {
  const url = `${GOV_UK_API}?page=${page}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'better-uk-scraper/1.0 (research project)',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.log(`    Rate limited, waiting 5s...`);
      await sleep(5000);
      return fetchOrganisationsPage(page);
    }
    throw new Error(`HTTP ${response.status} for page ${page}`);
  }

  return response.json();
}

async function fetchOrgDetail(slug) {
  const url = `https://www.gov.uk/api/organisations/${slug}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'better-uk-scraper/1.0 (research project)',
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function extractHeadcount(bodyText) {
  if (!bodyText) return null;
  // Look for patterns like "X,XXX staff", "X,XXX employees", "employs X,XXX", "workforce of X,XXX"
  const patterns = [
    /(\d[\d,]+)\s*(?:staff|employees|people|civil servants)/i,
    /employs?\s+(\d[\d,]+)/i,
    /workforce\s+of\s+(\d[\d,]+)/i,
    /(\d[\d,]+)\s*(?:full[- ]time|FTE)/i,
  ];
  for (const pat of patterns) {
    const m = bodyText.match(pat);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  return null;
}

function normaliseOrg(raw) {
  const title = raw.title || '';
  const slug = raw.details?.slug || '';
  const format = raw.format || '';
  const status = raw.details?.govuk_status || 'live';
  const abbreviation = raw.details?.abbreviation || '';

  // Parent org: the list endpoint only gives id (URL) + web_url, no title
  // We'll extract the slug and resolve the name during enrichment
  const parentOrgs = raw.parent_organisations || [];
  const parentSlug = parentOrgs[0]?.id
    ? parentOrgs[0].id.replace(/.*\/organisations\//, '')
    : '';

  if (!title || !slug) return null;

  return {
    id: slugToId(slug),
    name: formatTitle(title),
    slug,
    type: mapOrgType(format),
    format,
    parentDept: '',  // resolved during enrichment
    parentSlug,
    status,
    url: `https://www.gov.uk/government/organisations/${slug}`,
    description: '',
    abbreviation,
    headcount: null,
    about: '',
    childOrgCount: (raw.child_organisations || []).length,
  };
}

async function fetchAboutPage(slug) {
  const url = `https://www.gov.uk/government/organisations/${slug}/about`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'better-uk-scraper/1.0 (research project)' },
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Extract the govspeak content (the main about body)
    const govspeakMatch = html.match(/<div class="govspeak">(.*?)<\/div>/s);
    if (govspeakMatch) {
      return govspeakMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchMetaDescription(slug) {
  const url = `https://www.gov.uk/government/organisations/${slug}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'better-uk-scraper/1.0 (research project)' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const m = html.match(/<meta name="description" content="([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// ─── Main scraping logic ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const freshStart = args.includes('--fresh');

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Civil Service Scraper                 ║`);
  console.log(`║  gov.uk → data/cs-index.json                         ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  // Load existing index for incremental scraping
  const seen = new Map();
  if (!freshStart && existsSync(INDEX_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
      for (const item of existing.items ?? []) {
        seen.set(item.id, item);
      }
      console.log(`  Loaded ${seen.size} existing organisations`);
    } catch {
      console.log('  No valid existing index, starting fresh');
    }
  }

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    console.log(`  Fetching page ${page}${totalPages > 1 ? ` of ${totalPages}` : ''}...`);

    try {
      const data = await fetchOrganisationsPage(page);

      // gov.uk returns { results: [...], total: N, pages: N, ... }
      const results = data.results || [];
      totalPages = data.pages || data.total_pages || 1;

      for (const raw of results) {
        const item = normaliseOrg(raw);
        if (item && !seen.has(item.id)) {
          seen.set(item.id, item);
        }
      }

      console.log(`    Page ${page}: ${results.length} orgs (${seen.size} unique total)`);

      if (results.length === 0) break;

      page++;
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  Error on page ${page}: ${err.message}`);
      break;
    }
  }

  // Enrich each org with about text, description, headcount, parent name
  console.log(`\n  Enriching ${seen.size} organisations (about pages + API detail)...`);
  let enriched = 0;

  // Build a slug->name map so we can resolve parent names
  const slugToName = new Map();
  for (const [, item] of seen) {
    slugToName.set(item.slug, item.name);
  }

  for (const [id, item] of seen) {
    // Resolve parent department name from our slug map
    if (item.parentSlug && !item.parentDept) {
      item.parentDept = slugToName.get(item.parentSlug) || '';
    }

    // Fetch meta description from org main page
    if (!item.description) {
      const desc = await fetchMetaDescription(item.slug);
      if (desc) item.description = desc;
      await sleep(DELAY_MS);
    }

    // Fetch the /about page for rich body text
    const aboutText = await fetchAboutPage(item.slug);
    if (aboutText) {
      item.about = aboutText.slice(0, 3000);
      const hc = extractHeadcount(aboutText);
      if (hc) item.headcount = hc;
    }
    await sleep(DELAY_MS);

    // Also check API detail for child orgs and abbreviation
    const detail = await fetchOrgDetail(item.slug);
    if (detail) {
      const children = detail.child_organisations || [];
      if (children.length > 0) item.childOrgCount = children.length;
      if (!item.abbreviation && detail.details?.abbreviation) {
        item.abbreviation = detail.details.abbreviation;
      }
      // Resolve parent name from detail if we still don't have it
      if (!item.parentDept && detail.parent_organisations?.[0]?.title) {
        item.parentDept = detail.parent_organisations[0].title;
      }
    }
    await sleep(DELAY_MS);

    enriched++;
    process.stdout.write(`    Enriched ${enriched}/${seen.size} orgs\r`);
  }

  console.log(`    Enriched ${enriched} organisations with detail              `);

  // Remove the temporary parentSlug field
  for (const [, item] of seen) {
    delete item.parentSlug;
  }

  // Build output
  const items = Array.from(seen.values())
    .filter(item => item.status === 'live' || item.status === 'joining')
    .sort((a, b) => {
      // Sort: Departments first, then Agencies, then ALBs, then Other
      const order = { Department: 0, Agency: 1, ALB: 2, Other: 3 };
      const diff = (order[a.type] ?? 3) - (order[b.type] ?? 3);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

  const output = {
    items,
    meta: {
      totalScraped: items.length,
      departments: items.filter(i => i.type === 'Department').length,
      agencies: items.filter(i => i.type === 'Agency').length,
      albs: items.filter(i => i.type === 'ALB').length,
      other: items.filter(i => i.type === 'Other').length,
      scrapedAt: new Date().toISOString(),
      source: 'gov.uk Organisations API',
    },
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(output, null, 2));

  console.log(`\n  ✓ Wrote ${items.length} organisations to data/cs-index.json`);
  console.log(`    ${output.meta.departments} departments, ${output.meta.agencies} agencies, ${output.meta.albs} ALBs, ${output.meta.other} other\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
