#!/usr/bin/env node
/**
 * scrape-charities.mjs
 *
 * Downloads UK charity data from the Charity Commission bulk data extract
 * (public ZIP files on Azure Blob Storage). Extracts registered charities
 * with their financials, classifications, and activities, then writes to
 * data/ngo-index.json for the review script (review-ngos.mjs) to process.
 *
 * Usage:
 *   node scripts/scrape-charities.mjs [--all] [--limit 500]
 *
 * Data source:
 *   Charity Commission for England & Wales — public extract
 *   https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const INDEX_PATH = resolve(DATA_DIR, 'ngo-index.json');
const TMP_DIR = resolve(tmpdir(), 'better-uk-charities');

// ─── Configuration ────────────────────────────────────────────────────────────

const BLOB_BASE = 'https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt';
const CHARITY_ZIP = `${BLOB_BASE}/publicextract.charity.zip`;
const CLASSIFICATION_ZIP = `${BLOB_BASE}/publicextract.charity_classification.zip`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIncome(income) {
  if (!income && income !== 0) return '';
  const n = typeof income === 'string' ? parseFloat(income) : income;
  if (isNaN(n)) return '';
  if (n >= 1_000_000_000) return `£${(n / 1_000_000_000).toFixed(1)}bn`;
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toFixed(0)}`;
}

function extractYear(dateStr) {
  if (!dateStr) return 0;
  const match = String(dateStr).match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

async function downloadFile(url, dest) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);
}

function unzipFile(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'pipe' });
}

async function readTsvFile(filePath, onRow) {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;
  let count = 0;

  for await (const line of rl) {
    const fields = line.split('\t');
    if (!headers) {
      headers = fields.map(h => h.trim());
      continue;
    }
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (fields[i] || '').trim();
    }
    onRow(row);
    count++;
  }

  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const allFlag = args.includes('--all');
  const freshStart = args.includes('--fresh'); // accepted for consistency; bulk download is always fresh
  const limitIdx = args.indexOf('--limit');
  const limit = allFlag ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 500 : 500);

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Charity Scraper                       ║`);
  console.log(`║  Charity Commission Bulk Data → data/ngo-index.json   ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  console.log(`\n  Target: ${allFlag ? 'ALL registered charities' : limit + ' charities'}`);
  if (freshStart) console.log(`  Mode: FRESH (bulk download is always a fresh snapshot)`);

  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  // ── Step 1: Download classification data ──────────────────────────────────
  console.log(`\n  [1/4] Downloading classification data...`);
  const classZip = resolve(TMP_DIR, 'classification.zip');
  await downloadFile(CLASSIFICATION_ZIP, classZip);
  unzipFile(classZip, TMP_DIR);

  // Build classification lookup: charity_number -> sector
  const classifications = new Map();
  const classTxt = resolve(TMP_DIR, 'publicextract.charity_classification.txt');
  await readTsvFile(classTxt, (row) => {
    const charityNum = row.registered_charity_number;
    const linked = row.linked_charity_number;
    if (linked !== '0') return; // Only main charity entries
    if (row.classification_type !== 'What') return;
    if (!classifications.has(charityNum)) {
      classifications.set(charityNum, row.classification_description);
    }
  });
  console.log(`    ✓ Loaded classifications for ${classifications.size.toLocaleString()} charities`);

  // ── Step 2: Download main charity data ────────────────────────────────────
  console.log(`\n  [2/4] Downloading charity register (~44 MB, may take a moment)...`);
  const charityZip = resolve(TMP_DIR, 'charity.zip');
  await downloadFile(CHARITY_ZIP, charityZip);
  unzipFile(charityZip, TMP_DIR);

  // ── Step 3: Parse charities ───────────────────────────────────────────────
  console.log(`\n  [3/4] Parsing registered charities...`);
  const items = [];
  let totalRows = 0;
  let skippedRemoved = 0;
  let skippedLinked = 0;

  const charityTxt = resolve(TMP_DIR, 'publicextract.charity.txt');
  await readTsvFile(charityTxt, (row) => {
    totalRows++;

    // Only main charity entries (linked_charity_number = 0)
    if (row.linked_charity_number !== '0') {
      skippedLinked++;
      return;
    }

    // Only currently registered charities
    if (row.charity_registration_status !== 'Registered') {
      skippedRemoved++;
      return;
    }

    if (items.length >= limit) return;

    const charityNumber = row.registered_charity_number;
    const rawIncome = parseFloat(row.latest_income) || 0;
    const rawSpending = parseFloat(row.latest_expenditure) || 0;

    items.push({
      id: `CHY-${charityNumber}`,
      charityNumber,
      name: row.charity_name || '',
      type: row.charity_type || '',
      founded: extractYear(row.date_of_registration),
      sector: classifications.get(charityNumber) || 'General',
      annualIncome: formatIncome(rawIncome),
      rawIncome,
      annualSpending: formatIncome(rawSpending),
      rawSpending,
      url: `https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/${charityNumber}`,
      description: row.charity_activities || '',
      web: row.charity_contact_web || '',
    });

    if (items.length % 10_000 === 0) {
      process.stdout.write(`    ${items.length.toLocaleString()} charities parsed...\r`);
    }
  });

  console.log(`    ✓ Parsed ${totalRows.toLocaleString()} rows total`);
  console.log(`      ${skippedRemoved.toLocaleString()} removed/inactive, ${skippedLinked.toLocaleString()} linked subsidiaries`);
  console.log(`      ${items.length.toLocaleString()} registered charities kept`);

  // ── Step 4: Sort and write ────────────────────────────────────────────────
  console.log(`\n  [4/4] Writing to data/ngo-index.json...`);
  items.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    items,
    meta: {
      totalScraped: items.length,
      scrapedAt: new Date().toISOString(),
      source: 'Charity Commission for England & Wales — Public Extract',
    },
  };

  writeFileSync(INDEX_PATH, JSON.stringify(output, null, 2));

  console.log(`\n  ✓ Wrote ${items.length.toLocaleString()} charities to data/ngo-index.json`);
  console.log(`    Income data: ${items.filter(i => i.rawIncome > 0).length.toLocaleString()} charities have reported income`);
  console.log(`    Spending data: ${items.filter(i => i.rawSpending > 0).length.toLocaleString()} charities have reported spending\n`);

  // Clean up temp files
  try {
    unlinkSync(charityZip);
    unlinkSync(classZip);
    unlinkSync(charityTxt);
    unlinkSync(classTxt);
  } catch {}
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
