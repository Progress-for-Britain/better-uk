#!/usr/bin/env node
/**
 * scrape-legislation.mjs
 *
 * Scrapes UK legislation metadata from legislation.gov.uk's Atom feed API.
 * Collects all legislation IDs, titles, years, and types, then writes them
 * to data/legislation-index.json for the review script to process.
 *
 * Usage:
 *   node scripts/scrape-legislation.mjs [--from 1800] [--to 2025] [--type all|ukpga|uksi]
 *
 * The legislation.gov.uk site serves Atom XML feeds at:
 *   https://www.legislation.gov.uk/{type}/data.feed?page={n}
 *   https://www.legislation.gov.uk/{type}/{year}/data.feed?page={n}
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const INDEX_PATH = resolve(DATA_DIR, 'legislation-index.json');

// ─── Configuration ────────────────────────────────────────────────────────────

const LEG_TYPES = [
  { slug: 'ukpga', label: 'Act' },         // UK Public General Acts
  { slug: 'uksi', label: 'SI' },            // UK Statutory Instruments
  { slug: 'ukla', label: 'Act' },           // UK Local Acts
  { slug: 'asp', label: 'Act' },            // Acts of Scottish Parliament
  { slug: 'asc', label: 'Act' },            // Acts of Senedd Cymru
  { slug: 'nia', label: 'Act' },            // Northern Ireland Acts
  { slug: 'ssi', label: 'SI' },             // Scottish Statutory Instruments
  { slug: 'wsi', label: 'SI' },             // Welsh Statutory Instruments
  { slug: 'nisr', label: 'SI' },            // NI Statutory Rules
  { slug: 'ukci', label: 'Order' },         // UK Church Instruments
  { slug: 'ukmo', label: 'Order' },         // UK Ministerial Orders
  { slug: 'nisi', label: 'Order' },         // Orders in Council (NI)
];

const DELAY_MS = 300; // Rate limit between requests

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Parse a very simple Atom XML feed without requiring an XML library.
 * Extracts <entry> blocks and pulls out <id>, <title>, <updated>.
 */
function parseAtomEntries(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const id = block.match(/<id>([^<]+)<\/id>/)?.[1]?.trim() ?? '';
    const title = block.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]?.trim() ?? '';
    const updated = block.match(/<updated>([^<]+)<\/updated>/)?.[1]?.trim() ?? '';
    if (id) {
      entries.push({ id, title, updated });
    }
  }
  return entries;
}

/**
 * Extract next page URL from Atom <link rel="next">
 */
function parseNextLink(xml) {
  const match = xml.match(/<link[^>]+rel="next"[^>]+href="([^"]+)"/);
  if (match) return match[1].replace(/&amp;/g, '&');
  // Also try the other attr order
  const match2 = xml.match(/<link[^>]+href="([^"]+)"[^>]+rel="next"/);
  if (match2) return match2[1].replace(/&amp;/g, '&');
  return null;
}

/**
 * Extract total results from <openSearch:totalResults>
 */
function parseTotalResults(xml) {
  const match = xml.match(/<(?:openSearch:)?totalResults>(\d+)<\//);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Derive a short legislation ID from the full URI.
 * e.g. "http://www.legislation.gov.uk/id/ukpga/2006/46" → "UKPGA-2006-c46"
 */
function uriToId(uri, legSlug) {
  const match = uri.match(/\/id\/([^/]+)\/(\d{4})\/(\d+)/);
  if (!match) return uri;
  const [, type, year, num] = match;
  const prefix = type.toUpperCase();
  const numPrefix = ['ukpga', 'asp', 'asc', 'nia', 'ukla'].includes(type) ? 'c' : '';
  return `${prefix}-${year}-${numPrefix}${num}`;
}

/**
 * Extract year from legislation URI or updated date
 */
function extractYear(uri, updated) {
  const match = uri.match(/\/(\d{4})\//);
  if (match) return parseInt(match[1], 10);
  if (updated) {
    const yearMatch = updated.match(/^(\d{4})/);
    if (yearMatch) return parseInt(yearMatch[1], 10);
  }
  return null;
}

// ─── Main scraping logic ──────────────────────────────────────────────────────

async function fetchFeedPage(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/atom+xml, application/xml, text/xml',
      'User-Agent': 'better-uk-scraper/1.0 (research project)',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function scrapeType(legType, fromYear, toYear) {
  const items = [];
  let totalExpected = null;

  console.log(`\n  Scraping ${legType.slug.toUpperCase()} (${legType.label})...`);

  for (let year = fromYear; year <= toYear; year++) {
    let page = 1;
    let url = `https://www.legislation.gov.uk/${legType.slug}/${year}/data.feed?page=${page}`;
    let yearCount = 0;

    while (url) {
      try {
        const xml = await fetchFeedPage(url);
        const entries = parseAtomEntries(xml);

        if (page === 1 && totalExpected === null) {
          totalExpected = parseTotalResults(xml);
        }

        if (entries.length === 0) break;

        for (const entry of entries) {
          const legYear = extractYear(entry.id, entry.updated) ?? year;
          items.push({
            id: uriToId(entry.id, legType.slug),
            title: entry.title,
            year: legYear,
            type: legType.label,
            url: entry.id.replace('/id/', '/'),
            source: legType.slug,
          });
          yearCount++;
        }

        url = parseNextLink(xml);
        page++;
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`    Error fetching ${url}: ${err.message}`);
        break;
      }
    }

    if (yearCount > 0) {
      process.stdout.write(`    ${year}: ${yearCount} items\r`);
    }
  }

  console.log(`  ${legType.slug.toUpperCase()}: ${items.length} total items scraped`);
  return items;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  const typeIdx = args.indexOf('--type');
  const freshStart = args.includes('--fresh');
  const fromYear = fromIdx !== -1 ? parseInt(args[fromIdx + 1]) || 1800 : 1800;
  const toYear = toIdx !== -1 ? parseInt(args[toIdx + 1]) || 2025 : 2025;
  const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : 'all';

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Legislation Scraper            ║`);
  console.log(`║  legislation.gov.uk → data/legislation-index  ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`\n  Range: ${fromYear}–${toYear}`);
  console.log(`  Types: ${typeFilter}`);
  if (freshStart) console.log(`  Mode: FRESH (ignoring existing index)`);

  // Load existing index if present (for incremental scraping)
  let existingIndex = {};
  if (!freshStart && existsSync(INDEX_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
      for (const item of existing.items ?? []) {
        existingIndex[item.id] = item;
      }
      console.log(`  Loaded ${Object.keys(existingIndex).length} existing items`);
    } catch {
      console.log('  No valid existing index found, starting fresh');
    }
  }

  const typesToScrape = typeFilter === 'all'
    ? LEG_TYPES
    : LEG_TYPES.filter(t => t.slug === typeFilter);

  if (typesToScrape.length === 0) {
    console.error(`  Unknown type: ${typeFilter}`);
    console.error(`  Available: ${LEG_TYPES.map(t => t.slug).join(', ')}`);
    process.exit(1);
  }

  let allItems = [];
  for (const legType of typesToScrape) {
    const items = await scrapeType(legType, fromYear, toYear);
    allItems.push(...items);
  }

  // Merge with existing, deduplicating by ID
  for (const item of allItems) {
    existingIndex[item.id] = item;
  }

  const mergedItems = Object.values(existingIndex);

  // Compute year stats
  const yearMap = {};
  for (const item of mergedItems) {
    if (!yearMap[item.year]) {
      yearMap[item.year] = { year: item.year, total: 0 };
    }
    yearMap[item.year].total++;
  }
  const yearStats = Object.values(yearMap).sort((a, b) => a.year - b.year);

  const output = {
    scrapedAt: new Date().toISOString(),
    totalItems: mergedItems.length,
    yearRange: { from: fromYear, to: toYear },
    yearStats,
    items: mergedItems.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id)),
  };

  writeFileSync(INDEX_PATH, JSON.stringify(output, null, 2));
  console.log(`\n  ✓ Written ${mergedItems.length} items to data/legislation-index.json`);
  console.log(`  Year range: ${yearStats[0]?.year}–${yearStats[yearStats.length - 1]?.year}`);
  console.log();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
