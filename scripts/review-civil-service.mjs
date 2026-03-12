#!/usr/bin/env node
/**
 * review-civil-service.mjs
 *
 * Reviews UK government organisations using Grok AI (xAI API).
 * Reads organisation data from data/cs-index.json, sends it to Grok for a
 * keep/abolish verdict, and writes results to data/reviewed-civil-service.json.
 *
 * Usage:
 *   XAI_API_KEY=xai-xxx node scripts/review-civil-service.mjs [--batch 10]
 *
 * Environment variables:
 *   XAI_API_KEY  — Required. Your xAI API key from https://console.x.ai
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const CS_INDEX_PATH = resolve(DATA_DIR, 'cs-index.json');
const REVIEWS_PATH = resolve(DATA_DIR, 'reviewed-civil-service.json');

// ─── Configuration ────────────────────────────────────────────────────────────

const MODEL = 'grok-4-1-fast-reasoning';
const API_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_TEXT_LENGTH = 15_000;
const DELAY_BETWEEN_REVIEWS_MS = 500;

// ─── The Prompt (adapted for UK Civil Service bodies) ─────────────────────────

const SYSTEM_PROMPT = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's government departments, executive agencies, and arms-length bodies (ALBs) with the goal of assessing which should be abolished or merged to reduce the size and cost of the state.

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

Organisation: `;

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
 * Fetch additional detail about an organisation from gov.uk
 */
async function fetchOrgDetail(slug) {
  const url = `https://www.gov.uk/api/organisations/${slug}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'better-uk-reviewer/1.0 (research project)',
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Build text description of an org for Grok to review.
 */
function buildOrgText(item, detail) {
  let text = `Name: ${item.name}\n`;
  text += `Type: ${item.type}\n`;
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
      const bodyText = (org.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      text += `\nAbout:\n${bodyText}\n`;
    }

    // Include child organisations if any
    const children = org.child_organisations || [];
    if (children.length > 0) {
      text += `\nChild Organisations (${children.length}):\n`;
      for (const child of children.slice(0, 10)) {
        text += `  - ${child.title}\n`;
      }
      if (children.length > 10) text += `  ... and ${children.length - 10} more\n`;
    }
  }

  if (item.about && !detail) text += `\nAbout:\n${item.about}\n`;
  if (item.description) text += `\nDescription:\n${item.description}\n`;

  return text.slice(0, MAX_TEXT_LENGTH);
}

// ─── Grok API ─────────────────────────────────────────────────────────────────

async function callGrok(apiKey, orgText) {
  const payload = {
    messages: [
      { role: 'user', content: SYSTEM_PROMPT + orgText },
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
    verdict: parsed.verdict.toLowerCase(),
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
    const detail = await fetchOrgDetail(item.slug);
    const text = buildOrgText(item, detail);
    const review = await callGrok(apiKey, text);

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      format: item.format,
      parentDept: item.parentDept,
      abbreviation: item.abbreviation,
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
        totalCorpus: 450,
        totalReviewed: 0,
        totalKeep: 0,
        totalAbolish: 0,
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

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Civil Service Review (Grok AI)            ║`);
  console.log(`║  gov.uk → Grok → JSON                                    ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`\n  Model: ${MODEL}`);
  console.log(`  Batch size: ${batchSize}\n`);

  if (!existsSync(CS_INDEX_PATH)) {
    console.error('  ✗ No CS index found at data/cs-index.json');
    console.error('    Run "npm run scrape:cs" first to create the index.\n');
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(CS_INDEX_PATH, 'utf-8'));
  const items = index.items ?? [];
  console.log(`  Loaded ${items.length} organisations from index`);

  const reviews = loadReviews();
  const reviewedIds = new Set(reviews.items.map(r => r.id));
  console.log(`  ${reviewedIds.size} already reviewed`);

  const candidates = items.filter(item => !reviewedIds.has(item.id));
  console.log(`  ${candidates.length} candidates for review`);

  if (candidates.length === 0) {
    console.log('\n  ✓ All organisations have been reviewed!\n');
    return;
  }

  const batch = candidates.slice(0, batchSize);
  console.log(`\n  Reviewing ${batch.length} organisations...\n`);

  let totalCostTicks = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    console.log(`  [${i + 1}/${batch.length}] ${item.name} (${item.type})...`);

    const result = await reviewItem(apiKey, item);

    if (result.error) {
      console.log(`    ✗ Error: ${result.error}`);
    } else {
      console.log(`    ✓ ${result.verdict.toUpperCase()} — ${result.summary.slice(0, 80)}...`);
      reviews.items.push(result);
      totalCostTicks += result.costTicks || 0;
    }

    // Update meta and save after each review
    const successItems = reviews.items.filter(r => !r.error);
    reviews.meta.totalReviewed = successItems.length;
    reviews.meta.totalKeep = successItems.filter(r => r.verdict === 'keep').length;
    reviews.meta.totalAbolish = successItems.filter(r => r.verdict === 'abolish').length;
    reviews.meta.costGBP = Math.round((totalCostTicks / 1e10) * 0.79 * 100) / 100;
    reviews.meta.lastUpdated = new Date().toISOString();

    saveReviews(reviews);

    if (i < batch.length - 1) {
      await sleep(DELAY_BETWEEN_REVIEWS_MS);
    }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  Total reviewed: ${reviews.meta.totalReviewed}`);
  console.log(`  Keep: ${reviews.meta.totalKeep}`);
  console.log(`  Abolish: ${reviews.meta.totalAbolish}`);
  console.log(`  Cost: £${reviews.meta.costGBP.toFixed(4)}`);
  console.log(`  ════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
