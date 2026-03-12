#!/usr/bin/env node
/**
 * review-ngos.mjs
 *
 * Reviews UK charities/NGOs using Grok AI (xAI API).
 * Reads charity data, fetches public information, sends to Grok for a
 * keep/defund verdict, and writes results to data/reviewed-ngos.json.
 *
 * Usage:
 *   XAI_API_KEY=xai-xxx node scripts/review-ngos.mjs [--batch 10]
 *
 * Environment variables:
 *   XAI_API_KEY  — Required. Your xAI API key from https://console.x.ai
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const NGO_INDEX_PATH = resolve(DATA_DIR, 'ngo-index.json');
const REVIEWS_PATH = resolve(DATA_DIR, 'reviewed-ngos.json');

// ─── Configuration ────────────────────────────────────────────────────────────

const MODEL = 'grok-4-1-fast-reasoning';
const API_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_TEXT_LENGTH = 15_000;
const DELAY_BETWEEN_REVIEWS_MS = 500;
const CHARITY_COMMISSION_API = 'https://api.charitycommission.gov.uk/register/api';

// ─── The Prompt (adapted for UK NGOs/charities) ──────────────────────────────

const SYSTEM_PROMPT = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's registered charities and NGOs with the goal of assessing which should have their charitable status withdrawn or government funding removed.

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

Charity: `;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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

function getApiKey() {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    console.error('\n  ✗ XAI_API_KEY not found. Set it in .env or pass as environment variable.');
    console.error('    Get your key from https://console.x.ai\n');
    process.exit(1);
  }
  return key;
}

/**
 * Fetch charity details from the Charity Commission API.
 */
async function fetchCharityDetails(charityNumber) {
  const url = `${CHARITY_COMMISSION_API}/allcharitydetails/${charityNumber}/0`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'better-uk-reviewer/1.0 (research project)',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Build a text summary of a charity for Grok to review.
 */
function formatMoney(n) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `£${(n / 1_000_000_000).toFixed(1)}bn`;
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function buildCharityText(item, details) {
  let text = `Name: ${item.name}\n`;
  text += `Charity Number: ${item.id}\n`;
  if (item.founded) text += `Founded: ${item.founded}\n`;
  if (item.sector) text += `Sector: ${item.sector}\n`;
  if (item.annualIncome) text += `Annual Income: ${item.annualIncome}\n`;
  if (item.rawSpending) text += `Annual Spending: ${item.annualSpending}\n`;

  // Financial data from Charity Commission detail endpoint
  if (details) {
    const income = details.LatestIncome || details.Income || details.latest_income;
    const spending = details.LatestExpenditure || details.Expenditure || details.latest_expenditure;
    const employees = details.Employees || details.employees;
    const volunteers = details.Volunteers || details.volunteers;

    if (income && spending) {
      const overhead = income > 0 ? (((income - spending) / income) * 100).toFixed(1) : null;
      text += `\nFinancial Summary:\n`;
      text += `  Total Income: ${formatMoney(income)}\n`;
      text += `  Total Expenditure: ${formatMoney(spending)}\n`;
      if (overhead !== null) text += `  Surplus/Deficit: ${overhead > 0 ? '+' : ''}${overhead}% of income\n`;
    }
    if (employees) text += `  Employees: ${employees}\n`;
    if (volunteers) text += `  Volunteers: ${volunteers}\n`;

    // Trustee/governance info
    const trustees = details.Trustees || details.trustees || [];
    if (trustees.length > 0) {
      text += `  Trustees: ${trustees.length}\n`;
    }

    if (details.Activities) text += `\nActivities:\n${details.Activities}\n`;
    if (details.Objects) text += `\nObjects:\n${details.Objects}\n`;
    if (details.AreaOfBenefit) text += `\nArea of Benefit: ${details.AreaOfBenefit}\n`;

    // Government funding flag
    const govFunded = details.PublicFunding || details.GovernmentFunding;
    if (govFunded) text += `\nReceives Government Funding: Yes\n`;
  }

  if (item.description) text += `\nDescription:\n${item.description}\n`;

  return text.slice(0, MAX_TEXT_LENGTH);
}

// ─── Grok API ─────────────────────────────────────────────────────────────────

async function callGrok(apiKey, charityText) {
  const payload = {
    messages: [
      { role: 'user', content: SYSTEM_PROMPT + charityText },
    ],
    model: MODEL,
    stream: false,
    temperature: 0.7,
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.text().catch(() => '');
    const errorType =
      status === 402 || status === 403 ? 'out-of-credits' :
      status === 429 ? 'rate-limited' :
      status >= 500 ? 'server-error' : 'unknown';
    throw Object.assign(new Error(`Grok API ${status}: ${body.slice(0, 200)}`), { status, errorType });
  }

  const result = await response.json();
  const costTicks = result?.usage?.cost_in_usd_ticks ?? 0;
  const content = result?.choices?.[0]?.message?.content ?? '';

  const parsed = parseJsonResponse(content);
  if (!parsed || !parsed.verdict || !parsed.summary) {
    throw new Error(`Failed to parse Grok response: ${content.slice(0, 300)}`);
  }

  return {
    summary: parsed.summary,
    verdict: parsed.verdict.toLowerCase() === 'defund' ? 'delete' : parsed.verdict.toLowerCase(),
    reason: parsed.reason || '',
    costTicks: typeof costTicks === 'number' ? costTicks : 0,
  };
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

// ─── Review pipeline ──────────────────────────────────────────────────────────

async function reviewItem(apiKey, item) {
  try {
    // Try to fetch extra details from Charity Commission
    const charityNum = item.id.replace(/^CHY-/, '');
    const details = await fetchCharityDetails(charityNum);

    const text = buildCharityText(item, details);
    const review = await callGrok(apiKey, text);

    return {
      id: item.id,
      name: item.name,
      founded: item.founded,
      sector: item.sector,
      annualIncome: item.annualIncome,
      url: item.url,
      verdict: review.verdict,
      summary: review.summary,
      reason: review.reason,
      costTicks: review.costTicks,
      reviewedAt: new Date().toISOString(),
    };
  } catch (err) {
    const errorType = err.errorType || 'unknown';
    if (errorType === 'out-of-credits' || errorType === 'rate-limited') {
      throw err;
    }
    return { id: item.id, name: item.name, error: err.message, errorType };
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadReviews() {
  if (!existsSync(REVIEWS_PATH)) {
    return {
      items: [],
      meta: {
        totalCorpus: 168_000,
        totalReviewed: 0,
        totalKeep: 0,
        totalDefund: 0,
        costGBP: 0,
        lastUpdated: null,
      },
    };
  }
  return JSON.parse(readFileSync(REVIEWS_PATH, 'utf-8'));
}

function saveReviews(data) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(REVIEWS_PATH, JSON.stringify(data, null, 2));
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const apiKey = getApiKey();
  const args = process.argv.slice(2);
  const batchSize = parseInt(args[args.indexOf('--batch') + 1]) || 10;

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Charity Review (Grok AI)          ║`);
  console.log(`║  Charity Commission → Grok → JSON                ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);
  console.log(`\n  Model: ${MODEL}`);
  console.log(`  Batch size: ${batchSize}\n`);

  if (!existsSync(NGO_INDEX_PATH)) {
    console.error('  ✗ No NGO index found at data/ngo-index.json');
    console.error('    Create a list of charities to review first.\n');
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(NGO_INDEX_PATH, 'utf-8'));
  const items = index.items ?? [];
  console.log(`  Loaded ${items.length} charities from index`);

  const reviews = loadReviews();
  const reviewedIds = new Set(reviews.items.map(r => r.id));
  console.log(`  ${reviewedIds.size} already reviewed`);

  const candidates = items.filter(item => !reviewedIds.has(item.id));
  console.log(`  ${candidates.length} candidates for review`);

  if (candidates.length === 0) {
    console.log('\n  ✓ All charities have been reviewed!\n');
    return;
  }

  const batch = candidates.slice(0, batchSize);
  console.log(`\n  Reviewing ${batch.length} charities...\n`);

  let reviewed = 0;
  let keeps = 0;
  let defunds = 0;
  let errors = 0;
  let totalCostTicks = 0;

  for (const item of batch) {
    const num = reviewed + 1;
    process.stdout.write(`  [${num}/${batch.length}] ${item.id} — ${(item.name || '').slice(0, 40)}...`);

    try {
      const result = await reviewItem(apiKey, item);

      if (result.error) {
        console.log(` ✗ ${result.error}`);
        errors++;
      } else {
        const emoji = result.verdict === 'keep' ? '✓' : '✗';
        const label = result.verdict === 'delete' ? 'DEFUND' : 'KEEP';
        console.log(` ${emoji} ${label}`);

        reviews.items.push(result);
        reviewedIds.add(result.id);
        totalCostTicks += result.costTicks || 0;

        if (result.verdict === 'keep') keeps++;
        else defunds++;

        reviews.meta.totalReviewed = reviews.items.filter(r => !r.error).length;
        reviews.meta.totalKeep = reviews.items.filter(r => r.verdict === 'keep').length;
        reviews.meta.totalDefund = reviews.items.filter(r => r.verdict === 'delete').length;
        reviews.meta.costGBP = Math.round((totalCostTicks / 1e10) * 0.79 * 100) / 100;
        reviews.meta.lastUpdated = new Date().toISOString();

        saveReviews(reviews);
      }

      reviewed++;
      await sleep(DELAY_BETWEEN_REVIEWS_MS);
    } catch (err) {
      if (err.errorType === 'rate-limited' || err.errorType === 'out-of-credits') {
        console.log(`\n\n  ⚠ ${err.errorType}. Saving progress and stopping.\n`);
        saveReviews(reviews);
        break;
      }
      console.log(` ✗ ${err.message}`);
      errors++;
      reviewed++;
    }
  }

  console.log(`\n  ─────────────────────────────────────`);
  console.log(`  Reviewed:  ${reviewed}`);
  console.log(`  Keep:      ${keeps}`);
  console.log(`  Defund:    ${defunds}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total reviewed (all time): ${reviews.meta.totalReviewed}`);
  console.log(`  ─────────────────────────────────────\n`);
  console.log(`  ✓ Results saved to data/reviewed-ngos.json\n`);
}

main().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
