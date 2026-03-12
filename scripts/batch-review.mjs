#!/usr/bin/env node
/**
 * batch-review.mjs
 *
 * Bulk review using the xAI Batch API for ~50% lower cost and no rate limits.
 * Supports all three review types: regulations, civil-service, ngos.
 *
 * Usage:
 *   # Submit a batch
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs submit --type regulations [--year 2020] [--limit 1000]
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs submit --type civil-service [--limit 450]
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs submit --type ngos [--limit 1000]
 *
 *   # Check batch status
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs status [--batch-id xxx]
 *
 *   # Download results and merge into reviewed JSON
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs results [--batch-id xxx]
 *
 *   # List all batches
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs list
 *
 *   # Cancel a batch
 *   XAI_API_KEY=xai-xxx node scripts/batch-review.mjs cancel --batch-id xxx
 *
 * Environment variables:
 *   XAI_API_KEY  — Required. Your xAI API key from https://console.x.ai
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const BATCHES_DIR = resolve(DATA_DIR, 'batches');
const JOBS_PATH = resolve(DATA_DIR, 'batch-jobs.json');
const REVIEWED_YEAR_DIR = resolve(__dirname, '..', 'public', 'data', 'reviewed');

// ─── Configuration ────────────────────────────────────────────────────────────

const MODEL = 'grok-4-1-fast-reasoning';
const API_BASE = 'https://api.x.ai/v1';
const MAX_TEXT_LENGTH = 500_000; // ~125K tokens – fits within model context with room for prompt
const FETCH_CONCURRENCY = 20;
const REQUESTS_PER_CHUNK = 200; // batch requests per API call

// ─── Prompts ──────────────────────────────────────────────────────────────────

const PROMPTS = {
  regulations: `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's current legislation with the goal of assessing which should be deleted in their entirety.

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

Return ONLY the JSON object, nothing else.

Legislation: `,

  'civil-service': `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's government departments, executive agencies, and arms-length bodies (ALBs) with the goal of assessing which should be abolished or merged to reduce the size and cost of the state.

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

Return ONLY the JSON object, nothing else.

Organisation: `,

  ngos: `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's registered charities and NGOs with the goal of assessing which should have their charitable status withdrawn or government funding removed.

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

Return ONLY the JSON object, nothing else.

Charity: `,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*['"]?(.*?)['"]?$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

loadEnv();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getApiKey() {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    console.error('\n  ✗ XAI_API_KEY not found. Set it in .env or pass as environment variable.');
    console.error('    Get your key from https://console.x.ai\n');
    process.exit(1);
  }
  return key;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    }
  }
  return { command, flags };
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h\d|li|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => {
      try { return String.fromCharCode(parseInt(num)); } catch { return ' '; }
    })
    .replace(/^\s+$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^ +/gm, '')
    .replace(/ +$/gm, '')
    .trim();
}

function extractContent(text) {
  const markers = [
    /(?:^|\n)\s*(?:Text|THE TEXT|Legislation)\s*\n/i,
    /(?:^|\n)\s*(?:An Act to|A BILL TO|EXPLANATORY NOTE)/i,
  ];
  for (const marker of markers) {
    const match = text.match(marker);
    if (match) return text.slice(match.index).trim();
  }
  return text;
}

function parseJsonResponse(content) {
  try { return JSON.parse(content); } catch {}
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx > startIdx) {
    try { return JSON.parse(content.slice(startIdx, endIdx + 1)); } catch {}
  }
  return null;
}

function formatMoney(n) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `£${(n / 1_000_000_000).toFixed(1)}bn`;
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

/**
 * Run async tasks with a concurrency limit.
 */
async function withConcurrency(items, fn, concurrency) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

// ─── Content Preparation (per type) ───────────────────────────────────────────

async function fetchLegislationText(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const contentsUrl = url + (url.endsWith('/') ? '' : '/') + 'enacted';
      let response = await fetch(contentsUrl, {
        headers: {
          'User-Agent': 'better-uk-reviewer/1.0 (research project)',
          'Accept': 'text/html, text/plain',
        },
        redirect: 'follow',
      });
      if (!response.ok) {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'better-uk-reviewer/1.0 (research project)',
            'Accept': 'text/html, text/plain',
          },
          redirect: 'follow',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      const text = stripHtml(html);
      let content = extractContent(text);
      if (content.length > MAX_TEXT_LENGTH) {
        content = content.slice(0, MAX_TEXT_LENGTH)
          + `\n\n[TEXT TRUNCATED — full legislation: ${url} ]`;
      }
      return content;
    } catch (err) {
      if (attempt === 3) return null;
      await sleep(1000 * attempt);
    }
  }
  return null;
}

async function fetchOrgDetail(slug) {
  try {
    const response = await fetch(`https://www.gov.uk/api/organisations/${slug}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'better-uk-reviewer/1.0' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function buildOrgText(item, detail) {
  let text = `Name: ${item.name}\nType: ${item.type}\n`;
  if (item.format) text += `Format: ${item.format}\n`;
  if (item.abbreviation) text += `Abbreviation: ${item.abbreviation}\n`;
  if (item.parentDept) text += `Parent Department: ${item.parentDept}\n`;
  if (item.headcount) text += `Headcount: ~${item.headcount.toLocaleString()} staff\n`;
  if (item.childOrgCount) text += `Child Bodies: ${item.childOrgCount}\n`;
  if (item.url) text += `URL: ${item.url}\n`;
  if (detail) {
    const org = detail.organisation || detail;
    if (org.description) text += `\nDescription:\n${org.description}\n`;
    if (org.body) {
      text += `\nAbout:\n${(org.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`;
    }
    const children = org.child_organisations || [];
    if (children.length > 0) {
      text += `\nChild Organisations (${children.length}):\n`;
      for (const child of children.slice(0, 10)) text += `  - ${child.title}\n`;
      if (children.length > 10) text += `  ... and ${children.length - 10} more\n`;
    }
  }
  if (item.about && !detail) text += `\nAbout:\n${item.about}\n`;
  if (item.description) text += `\nDescription:\n${item.description}\n`;
  return text.slice(0, 15_000);
}

async function fetchCharityDetails(charityNumber) {
  try {
    const url = `https://api.charitycommission.gov.uk/register/api/allcharitydetails/${charityNumber}/0`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'better-uk-reviewer/1.0', 'Accept': 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function buildCharityText(item, details) {
  let text = `Name: ${item.name}\nCharity Number: ${item.id}\n`;
  if (item.founded) text += `Founded: ${item.founded}\n`;
  if (item.sector) text += `Sector: ${item.sector}\n`;
  if (item.annualIncome) text += `Annual Income: ${item.annualIncome}\n`;
  if (item.rawSpending) text += `Annual Spending: ${item.annualSpending}\n`;
  if (details) {
    const income = details.LatestIncome || details.Income || details.latest_income;
    const spending = details.LatestExpenditure || details.Expenditure || details.latest_expenditure;
    const employees = details.Employees || details.employees;
    const volunteers = details.Volunteers || details.volunteers;
    if (income && spending) {
      const overhead = income > 0 ? (((income - spending) / income) * 100).toFixed(1) : null;
      text += `\nFinancial Summary:\n  Total Income: ${formatMoney(income)}\n  Total Expenditure: ${formatMoney(spending)}\n`;
      if (overhead !== null) text += `  Surplus/Deficit: ${overhead > 0 ? '+' : ''}${overhead}% of income\n`;
    }
    if (employees) text += `  Employees: ${employees}\n`;
    if (volunteers) text += `  Volunteers: ${volunteers}\n`;
    if (details.Activities) text += `\nActivities:\n${details.Activities}\n`;
    if (details.Objects) text += `\nObjects:\n${details.Objects}\n`;
    if (details.AreaOfBenefit) text += `\nArea of Benefit: ${details.AreaOfBenefit}\n`;
    if (details.PublicFunding || details.GovernmentFunding) text += `\nReceives Government Funding: Yes\n`;
  }
  if (item.description) text += `\nDescription:\n${item.description}\n`;
  return text.slice(0, 15_000);
}

/**
 * Prepare prompt text for each item.
 * Returns array of { item, promptText } or null for items that failed to fetch.
 */
async function prepareItems(type, items) {
  console.log(`\n  Fetching content for ${items.length} items (concurrency: ${FETCH_CONCURRENCY})...\n`);
  let completed = 0;
  const total = items.length;

  if (type === 'regulations') {
    return withConcurrency(items, async (item, i) => {
      const text = await fetchLegislationText(item.url);
      completed++;
      if (completed % 50 === 0 || completed === total) {
        process.stdout.write(`\r  Fetched ${completed}/${total}`);
      }
      if (!text || text.length < 50) return null;
      return { item, promptText: text };
    }, FETCH_CONCURRENCY);
  }

  if (type === 'civil-service') {
    return withConcurrency(items, async (item) => {
      const detail = await fetchOrgDetail(item.slug);
      completed++;
      if (completed % 20 === 0 || completed === total) {
        process.stdout.write(`\r  Fetched ${completed}/${total}`);
      }
      return { item, promptText: buildOrgText(item, detail) };
    }, 10);
  }

  if (type === 'ngos') {
    return withConcurrency(items, async (item) => {
      const charityNum = item.id.replace(/^CHY-/, '');
      const details = await fetchCharityDetails(charityNum);
      completed++;
      if (completed % 50 === 0 || completed === total) {
        process.stdout.write(`\r  Fetched ${completed}/${total}`);
      }
      return { item, promptText: buildCharityText(item, details) };
    }, FETCH_CONCURRENCY);
  }

  throw new Error(`Unknown type: ${type}`);
}

// ─── xAI Batch API ────────────────────────────────────────────────────────────

async function apiFetch(apiKey, path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`xAI API ${response.status}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function createBatch(apiKey, name) {
  return apiFetch(apiKey, '/batches', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

async function addBatchRequests(apiKey, batchId, requests) {
  return apiFetch(apiKey, `/batches/${batchId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ batch_requests: requests }),
  });
}

async function getBatch(apiKey, batchId) {
  return apiFetch(apiKey, `/batches/${batchId}`);
}

async function getBatchResults(apiKey, batchId, pageSize = 100, paginationToken = null) {
  let path = `/batches/${batchId}/results?page_size=${pageSize}`;
  if (paginationToken) path += `&pagination_token=${encodeURIComponent(paginationToken)}`;
  return apiFetch(apiKey, path);
}

async function listBatches(apiKey, pageSize = 20) {
  return apiFetch(apiKey, `/batches?page_size=${pageSize}`);
}

async function cancelBatch(apiKey, batchId) {
  return apiFetch(apiKey, `/batches/${batchId}:cancel`, { method: 'POST' });
}

// ─── Job Tracking ─────────────────────────────────────────────────────────────

function loadJobs() {
  if (!existsSync(JOBS_PATH)) return { jobs: [] };
  return JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));
}

function saveJobs(data) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));
}

function saveItemsForBatch(batchId, items) {
  mkdirSync(BATCHES_DIR, { recursive: true });
  writeFileSync(
    resolve(BATCHES_DIR, `${batchId}-items.json`),
    JSON.stringify(items, null, 2)
  );
}

function loadItemsForBatch(batchId) {
  const path = resolve(BATCHES_DIR, `${batchId}-items.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// ─── Review persistence (reused from existing scripts) ────────────────────────

const REVIEW_PATHS = {
  regulations: resolve(DATA_DIR, 'reviewed-regulations.json'),
  'civil-service': resolve(DATA_DIR, 'reviewed-civil-service.json'),
  ngos: resolve(DATA_DIR, 'reviewed-ngos.json'),
};

const INDEX_PATHS = {
  regulations: resolve(DATA_DIR, 'legislation-index.json'),
  'civil-service': resolve(DATA_DIR, 'cs-index.json'),
  ngos: resolve(DATA_DIR, 'ngo-index.json'),
};

const DEFAULT_META = {
  regulations: { totalCorpus: 186_900, totalReviewed: 0, totalKeep: 0, totalDelete: 0, costGBP: 0, lastUpdated: null },
  'civil-service': { totalCorpus: 450, totalReviewed: 0, totalKeep: 0, totalAbolish: 0, costGBP: 0, lastUpdated: null },
  ngos: { totalCorpus: 168_000, totalReviewed: 0, totalKeep: 0, totalDefund: 0, costGBP: 0, lastUpdated: null },
};

function loadReviews(type) {
  const path = REVIEW_PATHS[type];
  if (!existsSync(path)) return { items: [], meta: { ...DEFAULT_META[type] } };
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveReviews(type, data) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(REVIEW_PATHS[type], JSON.stringify(data, null, 2));

  // For regulations, also write per-year files
  if (type === 'regulations') {
    mkdirSync(REVIEWED_YEAR_DIR, { recursive: true });
    const yearGroups = {};
    for (const item of data.items) {
      if (!item.year) continue;
      if (!yearGroups[item.year]) yearGroups[item.year] = [];
      yearGroups[item.year].push(item);
    }
    for (const [year, items] of Object.entries(yearGroups)) {
      writeFileSync(
        resolve(REVIEWED_YEAR_DIR, `${year}.json`),
        JSON.stringify({ year: Number(year), count: items.length, items }, null, 2)
      );
    }
  }
}

// ─── Build review object from batch result ────────────────────────────────────

function buildReviewResult(type, item, parsed, costTicks) {
  const base = {
    verdict: parsed.verdict.toLowerCase(),
    summary: parsed.summary,
    reason: parsed.reason || '',
    costTicks: costTicks || 0,
    reviewedAt: new Date().toISOString(),
  };

  if (type === 'regulations') {
    // Normalise verdict
    base.verdict = base.verdict === 'keep' ? 'keep' : 'delete';
    return { id: item.id, title: item.title, year: item.year, type: item.type, url: item.url, source: item.source, ...base };
  }

  if (type === 'civil-service') {
    base.verdict = base.verdict === 'keep' ? 'keep' : 'abolish';
    return { id: item.id, name: item.name, type: item.type, format: item.format, parentDept: item.parentDept, abbreviation: item.abbreviation, url: item.url, ...base };
  }

  if (type === 'ngos') {
    // defund → delete (matches existing convention)
    base.verdict = base.verdict === 'keep' ? 'keep' : 'delete';
    return { id: item.id, name: item.name, founded: item.founded, sector: item.sector, annualIncome: item.annualIncome, url: item.url, ...base };
  }
}

function updateMeta(type, reviews) {
  const items = reviews.items.filter(r => !r.error);
  const totalCostTicks = items.reduce((sum, r) => sum + (r.costTicks || 0), 0);

  if (type === 'regulations') {
    reviews.meta.totalReviewed = items.length;
    reviews.meta.totalKeep = items.filter(r => r.verdict === 'keep').length;
    reviews.meta.totalDelete = items.filter(r => r.verdict === 'delete').length;
  } else if (type === 'civil-service') {
    reviews.meta.totalReviewed = items.length;
    reviews.meta.totalKeep = items.filter(r => r.verdict === 'keep').length;
    reviews.meta.totalAbolish = items.filter(r => r.verdict === 'abolish').length;
  } else if (type === 'ngos') {
    reviews.meta.totalReviewed = items.length;
    reviews.meta.totalKeep = items.filter(r => r.verdict === 'keep').length;
    reviews.meta.totalDefund = items.filter(r => r.verdict === 'delete').length;
  }

  reviews.meta.costGBP = Math.round((totalCostTicks / 100_000) * 78) / 100;
  reviews.meta.lastUpdated = new Date().toISOString();
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdSubmit(flags) {
  const apiKey = getApiKey();
  const type = flags.type;
  if (!type || !PROMPTS[type]) {
    console.error('\n  ✗ --type must be one of: regulations, civil-service, ngos\n');
    process.exit(1);
  }

  const limit = parseInt(flags.limit) || (type === 'civil-service' ? 450 : 1000);
  const yearFilter = flags.year ? parseInt(flags.year) : null;
  const model = flags.model || MODEL;

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: Batch Review (xAI Batch API)                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`\n  Type: ${type}`);
  console.log(`  Model: ${model}`);
  console.log(`  Limit: ${limit}`);
  if (yearFilter) console.log(`  Year filter: ${yearFilter}`);

  // Load index
  const indexPath = INDEX_PATHS[type];
  if (!existsSync(indexPath)) {
    console.error(`\n  ✗ No index found at ${indexPath}`);
    console.error(`    Run the appropriate scraper first.\n`);
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const allItems = index.items ?? [];
  console.log(`  Index: ${allItems.length} items`);

  // Filter to unreviewed (also exclude items already in-flight in pending batches)
  const reviews = loadReviews(type);
  const reviewedIds = new Set(reviews.items.map(r => r.id));

  const jobs = loadJobs();
  const inFlightIds = new Set();
  for (const j of jobs.jobs) {
    if (j.type !== type) continue;
    if (j.status === 'completed' || j.status === 'cancelled') continue;
    const batchItems = loadItemsForBatch(j.batchId);
    if (batchItems) {
      for (const id of Object.keys(batchItems)) inFlightIds.add(id);
    }
  }

  let candidates = allItems.filter(item => !reviewedIds.has(item.id) && !inFlightIds.has(item.id));
  if (yearFilter) candidates = candidates.filter(item => item.year === yearFilter);
  console.log(`  Already reviewed: ${reviewedIds.size}`);
  if (inFlightIds.size) console.log(`  In-flight (pending batches): ${inFlightIds.size}`);
  console.log(`  Candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log('\n  ✓ Nothing to review!\n');
    return;
  }

  const batch = candidates.slice(0, limit);
  console.log(`  Submitting: ${batch.length} items`);

  // Phase 1: Pre-fetch content
  const prepared = await prepareItems(type, batch);
  const valid = prepared.filter(Boolean);
  const skipped = prepared.length - valid.length;
  console.log(`\n\n  Content ready: ${valid.length} items (${skipped} skipped due to fetch errors)`);

  if (valid.length === 0) {
    console.error('\n  ✗ No items to submit after content fetch.\n');
    return;
  }

  // Phase 2: Create batch
  const batchName = `better-uk-${type}${yearFilter ? `-${yearFilter}` : ''}-${Date.now()}`;
  console.log(`\n  Creating batch: ${batchName}...`);
  const batchResponse = await createBatch(apiKey, batchName);
  const batchId = batchResponse.batch_id || batchResponse.id;
  console.log(`  Batch ID: ${batchId}`);

  // Phase 3: Submit requests in chunks
  const prompt = PROMPTS[type];
  const batchRequests = valid.map(({ item, promptText }) => ({
    batch_request_id: item.id,
    batch_request: {
      chat_get_completion: {
        messages: [{ role: 'user', content: prompt + promptText }],
        model,
        temperature: 0.7,
      },
    },
  }));

  const totalChunks = Math.ceil(batchRequests.length / REQUESTS_PER_CHUNK);
  console.log(`  Submitting ${batchRequests.length} requests in ${totalChunks} chunks...`);

  for (let i = 0; i < batchRequests.length; i += REQUESTS_PER_CHUNK) {
    const chunk = batchRequests.slice(i, i + REQUESTS_PER_CHUNK);
    const chunkNum = Math.floor(i / REQUESTS_PER_CHUNK) + 1;
    await addBatchRequests(apiKey, batchId, chunk);
    console.log(`    Chunk ${chunkNum}/${totalChunks}: ${chunk.length} requests submitted`);
    // Respect 100 API calls per 30 seconds limit
    if (chunkNum < totalChunks) await sleep(350);
  }

  // Phase 4: Save job info + items for later result mapping
  const itemMap = Object.fromEntries(valid.map(({ item }) => [item.id, item]));
  saveItemsForBatch(batchId, itemMap);

  jobs.jobs.push({
    batchId,
    name: batchName,
    type,
    model,
    yearFilter: yearFilter || null,
    itemCount: valid.length,
    createdAt: new Date().toISOString(),
    status: 'submitted',
  });
  saveJobs(jobs);

  console.log(`\n  ✓ Batch submitted successfully!`);
  console.log(`  Batch ID: ${batchId}`);
  console.log(`  Items: ${valid.length}`);
  console.log(`\n  Check status:  XAI_API_KEY=... node scripts/batch-review.mjs status --batch-id ${batchId}`);
  console.log(`  Get results:   XAI_API_KEY=... node scripts/batch-review.mjs results --batch-id ${batchId}\n`);
}

async function cmdStatus(flags) {
  const apiKey = getApiKey();
  const jobs = loadJobs();

  // If no batch-id specified, show most recent or all
  if (!flags['batch-id']) {
    if (jobs.jobs.length === 0) {
      console.log('\n  No batch jobs found. Submit one first.\n');
      return;
    }
    // Show status for most recent jobs
    console.log(`\n  Checking status for ${jobs.jobs.length} batch job(s)...\n`);
    for (const job of jobs.jobs.slice(-5)) {
      try {
        const batch = await getBatch(apiKey, job.batchId);
        const state = batch.state || {};
        const pending = state.num_pending ?? '?';
        const success = state.num_success ?? '?';
        const error = state.num_error ?? '?';
        const total = state.num_requests ?? job.itemCount;
        const done = pending === 0 ? ' ✓ DONE' : '';
        console.log(`  ${job.name}`);
        console.log(`    ID: ${job.batchId}`);
        console.log(`    Type: ${job.type} | Items: ${total} | Success: ${success} | Errors: ${error} | Pending: ${pending}${done}`);
        if (batch.cost_breakdown) {
          const costUsd = (batch.cost_breakdown.total_cost_usd_ticks || 0) / 1e10;
          console.log(`    Cost: $${costUsd.toFixed(4)}`);
        }
        console.log();
      } catch (err) {
        console.log(`  ${job.name}: ✗ ${err.message}\n`);
      }
    }
    return;
  }

  const batchId = flags['batch-id'];
  const batch = await getBatch(apiKey, batchId);
  const state = batch.state || {};

  console.log(`\n  Batch: ${batch.name || batchId}`);
  console.log(`  ID: ${batchId}`);
  console.log(`  Total:    ${state.num_requests ?? '?'}`);
  console.log(`  Success:  ${state.num_success ?? '?'}`);
  console.log(`  Errors:   ${state.num_error ?? '?'}`);
  console.log(`  Pending:  ${state.num_pending ?? '?'}`);
  console.log(`  Cancelled: ${state.num_cancelled ?? 0}`);
  if (batch.cost_breakdown) {
    const costUsd = (batch.cost_breakdown.total_cost_usd_ticks || 0) / 1e10;
    console.log(`  Cost:     $${costUsd.toFixed(4)}`);
  }
  if (batch.expires_at) console.log(`  Expires:  ${batch.expires_at}`);
  console.log();
}

async function cmdResults(flags) {
  const apiKey = getApiKey();
  const jobs = loadJobs();

  let batchId = flags['batch-id'];
  let job;

  if (!batchId) {
    // Use most recent job
    job = jobs.jobs.filter(j => j.status !== 'completed').pop() || jobs.jobs[jobs.jobs.length - 1];
    if (!job) {
      console.error('\n  ✗ No batch jobs found.\n');
      return;
    }
    batchId = job.batchId;
  } else {
    job = jobs.jobs.find(j => j.batchId === batchId);
  }

  if (!job) {
    console.error(`\n  ✗ No local job found for batch ${batchId}.`);
    console.error(`    Only batches submitted by this script can have results processed.\n`);
    return;
  }

  console.log(`\n  Fetching results for: ${job.name} (${job.type})`);
  console.log(`  Batch ID: ${batchId}\n`);

  // Check batch status first
  const batchInfo = await getBatch(apiKey, batchId);
  const state = batchInfo.state || {};
  console.log(`  Progress: ${state.num_success || 0} success, ${state.num_error || 0} errors, ${state.num_pending || 0} pending`);

  if ((state.num_success || 0) === 0) {
    console.log('\n  No completed results yet. Try again later.\n');
    return;
  }

  // Load original items for result mapping
  const itemMap = loadItemsForBatch(batchId);
  if (!itemMap) {
    console.error('\n  ✗ Item mapping file not found. Cannot reconstruct review objects.\n');
    return;
  }

  // Paginate through all results
  const allResults = [];
  let paginationToken = null;
  let page = 0;

  while (true) {
    page++;
    const resultPage = await getBatchResults(apiKey, batchId, 100, paginationToken);
    const items = resultPage.results || [];
    allResults.push(...items);

    process.stdout.write(`\r  Fetched page ${page}: ${allResults.length} results`);

    paginationToken = resultPage.pagination_token;
    if (!paginationToken) break;
  }

  console.log(`\n\n  Processing ${allResults.length} results...`);

  // Load existing reviews and merge
  const reviews = loadReviews(job.type);
  const reviewedIds = new Set(reviews.items.map(r => r.id));
  let added = 0;
  let parseErrors = 0;
  let skippedDupes = 0;

  for (const result of allResults) {
    const reqId = result.batch_request_id;
    if (reviewedIds.has(reqId)) { skippedDupes++; continue; }

    const item = itemMap[reqId];
    if (!item) { parseErrors++; continue; }

    // xAI batch response: batch_result.response.chat_get_completion
    const completion = result.batch_result?.response?.chat_get_completion;
    if (!completion) { parseErrors++; continue; }

    const content = completion.choices?.[0]?.message?.content;
    if (!content) { parseErrors++; continue; }

    const parsed = parseJsonResponse(content);
    if (!parsed || !parsed.verdict || !parsed.summary) {
      parseErrors++;
      continue;
    }

    const costTicks = completion.usage?.cost_in_usd_ticks ?? 0;
    const review = buildReviewResult(job.type, item, parsed, costTicks);
    reviews.items.push(review);
    reviewedIds.add(reqId);
    added++;
  }

  // Update meta and save
  updateMeta(job.type, reviews);
  saveReviews(job.type, reviews);

  // Update job status
  const isPending = (state.num_pending || 0) > 0;
  job.status = isPending ? 'partial' : 'completed';
  job.resultsAt = new Date().toISOString();
  saveJobs(jobs);

  // Cost info
  let costStr = '';
  if (batchInfo.cost_breakdown) {
    const costUsd = (batchInfo.cost_breakdown.total_cost_usd_ticks || 0) / 1e10;
    costStr = ` | Cost: $${costUsd.toFixed(4)}`;
  }

  console.log(`\n  ─────────────────────────────────────`);
  console.log(`  New reviews added:  ${added}`);
  if (skippedDupes) console.log(`  Skipped (dupes):    ${skippedDupes}`);
  console.log(`  Parse errors:       ${parseErrors}`);
  console.log(`  Total reviewed:     ${reviews.meta.totalReviewed}${costStr}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`\n  ✓ Results saved to ${REVIEW_PATHS[job.type].replace(resolve(__dirname, '..') + '/', '')}\n`);
}

async function cmdList(flags) {
  const apiKey = getApiKey();

  console.log('\n  Fetching batches from xAI...\n');
  const result = await listBatches(apiKey, 20);
  const batches = result.batches || [];

  if (batches.length === 0) {
    console.log('  No batches found.\n');
    return;
  }

  for (const batch of batches) {
    const state = batch.state || {};
    const status = (state.num_pending || 0) === 0 ? 'DONE' : 'PROCESSING';
    console.log(`  ${batch.name || batch.batch_id || batch.id}`);
    console.log(`    ID: ${batch.batch_id || batch.id} | ${status}`);
    console.log(`    Requests: ${state.num_requests ?? '?'} | Success: ${state.num_success ?? 0} | Errors: ${state.num_error ?? 0} | Pending: ${state.num_pending ?? 0}`);
    if (batch.cost_breakdown) {
      const costUsd = (batch.cost_breakdown.total_cost_usd_ticks || 0) / 1e10;
      console.log(`    Cost: $${costUsd.toFixed(4)}`);
    }
    console.log();
  }
}

async function cmdCancel(flags) {
  const apiKey = getApiKey();
  const batchId = flags['batch-id'];

  if (!batchId) {
    console.error('\n  ✗ --batch-id is required for cancel.\n');
    process.exit(1);
  }

  console.log(`\n  Cancelling batch ${batchId}...`);
  const result = await cancelBatch(apiKey, batchId);
  console.log(`  ✓ Cancelled. Completed before cancellation: ${result.state?.num_success ?? '?'} requests`);

  // Update local job status
  const jobs = loadJobs();
  const job = jobs.jobs.find(j => j.batchId === batchId);
  if (job) {
    job.status = 'cancelled';
    saveJobs(jobs);
  }
  console.log();
}

// ─── CLI Router ───────────────────────────────────────────────────────────────

const USAGE = `
  Usage: XAI_API_KEY=xai-xxx node scripts/batch-review.mjs <command> [flags]

  Commands:
    submit    Submit a batch for review
              --type <regulations|civil-service|ngos>  (required)
              --limit <n>      Max items to submit (default: 1000)
              --year <year>    Filter by year (regulations only)
              --model <model>  Override model (default: grok-4-1)

    status    Check batch progress
              --batch-id <id>  Specific batch (default: show recent)

    results   Download results and merge into reviewed JSON
              --batch-id <id>  Specific batch (default: most recent)

    list      List all batches from xAI

    cancel    Cancel a running batch
              --batch-id <id>  (required)
`;

async function main() {
  const { command, flags } = parseArgs();

  switch (command) {
    case 'submit':  return cmdSubmit(flags);
    case 'status':  return cmdStatus(flags);
    case 'results': return cmdResults(flags);
    case 'list':    return cmdList(flags);
    case 'cancel':  return cmdCancel(flags);
    default:
      console.log(USAGE);
      process.exit(command ? 1 : 0);
  }
}

main().catch(err => {
  console.error(`\n  Fatal error: ${err.message}`);
  process.exit(1);
});
