#!/usr/bin/env node
/**
 * Rebuild legislation-index.json and legislation-index-lite.json from per-year files
 * in public/data/legislation/. No network requests — just reads existing files and
 * recomputes yearStats + totalItems.
 *
 * Usage: node scripts/rebuild-index.mjs
 *    or: npm run rebuild:index
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const YEAR_DIR = resolve(__dirname, '..', 'public', 'data', 'legislation');
const INDEX_PATH = resolve(__dirname, '..', 'data', 'legislation-index.json');
const LITE_INDEX_PATH = resolve(__dirname, '..', 'data', 'legislation-index-lite.json');

const yearFiles = readdirSync(YEAR_DIR)
  .filter(f => /^\d{4}\.json$/.test(f))
  .sort();

let totalItems = 0;
const yearStats = [];
const allItems = [];

for (const file of yearFiles) {
  const data = JSON.parse(readFileSync(resolve(YEAR_DIR, file), 'utf8'));
  const year = data.year ?? parseInt(file);
  const items = data.items ?? [];
  const count = items.length;
  totalItems += count;
  yearStats.push({ year, total: count });
  allItems.push(...items);
}

yearStats.sort((a, b) => a.year - b.year);

const liteOutput = {
  scrapedAt: new Date().toISOString(),
  totalItems,
  yearRange: {
    from: yearStats[0]?.year ?? 0,
    to: yearStats[yearStats.length - 1]?.year ?? 0,
  },
  yearStats,
};

const fullOutput = {
  ...liteOutput,
  items: allItems,
};

writeFileSync(INDEX_PATH, JSON.stringify(fullOutput, null, 2));
writeFileSync(LITE_INDEX_PATH, JSON.stringify(liteOutput, null, 2));

console.log(`✓ Rebuilt legislation-index.json + legislation-index-lite.json`);
console.log(`  ${yearStats.length} years · ${totalItems.toLocaleString()} items · ${yearStats[0]?.year}–${yearStats[yearStats.length - 1]?.year}`);
