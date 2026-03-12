#!/usr/bin/env node
/**
 * review-regulations.mjs
 *
 * Reviews UK legislation using Grok AI (xAI API).
 * Reads legislation IDs from data/legislation-index.json, fetches the
 * full text from legislation.gov.uk, sends it to Grok for a keep/delete
 * verdict, and writes results to data/reviewed-regulations.json.
 *
 * Usage:
 *   XAI_API_KEY=xai-xxx node scripts/review-regulations.mjs [--batch 10] [--year 2020] [--resume]
 *
 * Environment variables:
 *   XAI_API_KEY  — Required. Your xAI API key from https://console.x.ai
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const INDEX_PATH = resolve(DATA_DIR, 'legislation-index.json');
const REVIEWS_PATH = resolve(DATA_DIR, 'reviewed-regulations.json');
const REVIEWED_YEAR_DIR = resolve(__dirname, '..', 'public', 'data', 'reviewed');

// ─── Configuration ────────────────────────────────────────────────────────────

const MODEL = 'grok-4-1-fast-reasoning';
const API_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_TEXT_LENGTH = 500_000; // ~125K tokens – fits within model context with room for prompt
const DELAY_BETWEEN_REVIEWS_MS = 500;
const MAX_RETRIES = 3;

// ─── The Prompt (adapted from bettereu.com for UK) ────────────────────────────

const SYSTEM_PROMPT = `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's current legislation with the goal of assessing which should be deleted in their entirety.

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

Legislation: `;

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
 * Strip HTML from legislation.gov.uk pages, preserving document structure.
 */
function stripHtml(html) {
  return html
    // Remove script/style/head/nav/header/footer
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert structural elements to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h\d|li|tr|td|th|section|article)[^>]*>/gi, '\n')
    // Remove all other tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => {
      try { return String.fromCharCode(parseInt(num)); } catch { return ' '; }
    })
    // Clean up whitespace
    .replace(/^\s+$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^ +/gm, '')
    .replace(/ +$/gm, '')
    .trim();
}

/**
 * Extract the main content from legislation.gov.uk text.
 * Typically the useful content appears after "Text" or "The Legislation" markers.
 */
function extractContent(text) {
  // Try to find the main legislation text
  const markers = [
    /(?:^|\n)\s*(?:Text|THE TEXT|Legislation)\s*\n/i,
    /(?:^|\n)\s*(?:An Act to|A BILL TO|EXPLANATORY NOTE)/i,
  ];
  for (const marker of markers) {
    const match = text.match(marker);
    if (match) {
      return text.slice(match.index).trim();
    }
  }
  return text;
}

// ─── Legislation fetching ─────────────────────────────────────────────────────

/**
 * Fetch the full text of a piece of UK legislation from legislation.gov.uk
 */
async function fetchLegislationText(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // First try the /contents endpoint for the full enacted version
      const contentsUrl = url + (url.endsWith('/') ? '' : '/') + 'enacted';
      const response = await fetch(contentsUrl, {
        headers: {
          'User-Agent': 'better-uk-reviewer/1.0 (research project)',
          'Accept': 'text/html, text/plain',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        // Fall back to the base URL
        const fallbackResp = await fetch(url, {
          headers: {
            'User-Agent': 'better-uk-reviewer/1.0 (research project)',
            'Accept': 'text/html, text/plain',
          },
          redirect: 'follow',
        });
        if (!fallbackResp.ok) {
          throw new Error(`HTTP ${fallbackResp.status}`);
        }
        const html = await fallbackResp.text();
        const text = stripHtml(html);
        let content = extractContent(text);
        if (content.length > MAX_TEXT_LENGTH) {
          content = content.slice(0, MAX_TEXT_LENGTH)
            + `\n\n[TEXT TRUNCATED — full legislation: ${url} ]`;
        }
        return content;
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
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${err.message}`);
      }
      await sleep(1000 * attempt);
    }
  }
}

// ─── Grok API ─────────────────────────────────────────────────────────────────

/**
 * Call Grok API to review a piece of legislation.
 * Returns { summary, verdict, reason, costTicks }
 */
async function callGrok(apiKey, legislationText) {
  const payload = {
    messages: [
      { role: 'user', content: SYSTEM_PROMPT + legislationText },
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

  // Parse JSON from response (may be wrapped in markdown code blocks)
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

/**
 * Parse a JSON object from the Grok response.
 * Handles clean JSON, markdown code blocks, and conversational preambles.
 */
function parseJsonResponse(content) {
  // Try direct parse
  try {
    return JSON.parse(content);
  } catch {}

  // Try extracting from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Try finding raw JSON object
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx > startIdx) {
    try {
      return JSON.parse(content.slice(startIdx, endIdx + 1));
    } catch {}
  }

  return null;
}

// ─── Review pipeline ──────────────────────────────────────────────────────────

/**
 * Review a single legislation item.
 * Returns the review result or null on failure.
 */
async function reviewItem(apiKey, item) {
  try {
    // Fetch the legislation text
    const text = await fetchLegislationText(item.url);
    if (!text || text.length < 50) {
      return { ...item, error: 'Document too short or empty', errorType: 'empty' };
    }

    // Send to Grok for review
    const review = await callGrok(apiKey, text);
    return {
      id: item.id,
      title: item.title,
      year: item.year,
      type: item.type,
      url: item.url,
      source: item.source,
      verdict: review.verdict,
      summary: review.summary,
      reason: review.reason,
      costTicks: review.costTicks,
      reviewedAt: new Date().toISOString(),
    };
  } catch (err) {
    const errorType = err.errorType || 'unknown';
    // Propagate fatal errors
    if (errorType === 'out-of-credits' || errorType === 'rate-limited') {
      throw err;
    }
    return {
      id: item.id,
      title: item.title,
      year: item.year,
      error: err.message,
      errorType,
    };
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadReviews() {
  if (!existsSync(REVIEWS_PATH)) {
    return {
      items: [],
      meta: {
        totalCorpus: 186_900,
        totalReviewed: 0,
        totalKeep: 0,
        totalDelete: 0,
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

  // Also write per-year reviewed files for the frontend
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

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const apiKey = getApiKey();
  const args = process.argv.slice(2);

  const batchSize = parseInt(args[args.indexOf('--batch') + 1]) || 10;
  const yearFilter = args.includes('--year')
    ? parseInt(args[args.indexOf('--year') + 1])
    : null;
  const resumeMode = args.includes('--resume');

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  better-uk: UK Legislation Review (Grok AI)      ║`);
  console.log(`║  legislation.gov.uk → Grok ${MODEL.slice(0, 12).padEnd(12)} → JSON  ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);
  console.log(`\n  Model: ${MODEL}`);
  console.log(`  Batch size: ${batchSize}`);
  if (yearFilter) console.log(`  Year filter: ${yearFilter}`);
  console.log(`  Resume mode: ${resumeMode ? 'yes' : 'no'}\n`);

  // Load legislation index
  if (!existsSync(INDEX_PATH)) {
    console.error('  ✗ No legislation index found at data/legislation-index.json');
    console.error('    Run: node scripts/scrape-legislation.mjs first\n');
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  console.log(`  Loaded ${index.totalItems} legislation items from index`);

  // Load existing reviews
  const reviews = loadReviews();
  const reviewedIds = new Set(reviews.items.map(r => r.id));
  console.log(`  ${reviewedIds.size} already reviewed`);

  // Filter to unreviewed items
  let candidates = index.items.filter(item => !reviewedIds.has(item.id));
  if (yearFilter) {
    candidates = candidates.filter(item => item.year === yearFilter);
  }

  console.log(`  ${candidates.length} candidates for review`);

  if (candidates.length === 0) {
    console.log('\n  ✓ All items have been reviewed!\n');
    return;
  }

  // Take batch
  const batch = candidates.slice(0, batchSize);
  console.log(`\n  Reviewing ${batch.length} items...\n`);

  let reviewed = 0;
  let keeps = 0;
  let deletes = 0;
  let errors = 0;
  let totalCostTicks = 0;

  for (const item of batch) {
    const num = reviewed + 1;
    process.stdout.write(`  [${num}/${batch.length}] ${item.id} — ${item.title.slice(0, 50)}...`);

    try {
      const result = await reviewItem(apiKey, item);

      if (result.error) {
        console.log(` ✗ ${result.error}`);
        errors++;
      } else {
        const emoji = result.verdict === 'keep' ? '✓' : '✗';
        console.log(` ${emoji} ${result.verdict.toUpperCase()}`);

        reviews.items.push(result);
        reviewedIds.add(result.id);
        totalCostTicks += result.costTicks || 0;

        if (result.verdict === 'keep') keeps++;
        else deletes++;

        // Update meta
        reviews.meta.totalReviewed = reviews.items.filter(r => !r.error).length;
        reviews.meta.totalKeep = reviews.items.filter(r => r.verdict === 'keep').length;
        reviews.meta.totalDelete = reviews.items.filter(r => r.verdict === 'delete').length;
        reviews.meta.costGBP = Math.round((totalCostTicks / 100_000) * 78) / 100; // Approximate USD ticks to GBP
        reviews.meta.lastUpdated = new Date().toISOString();

        // Save after each review (incremental)
        saveReviews(reviews);
      }

      reviewed++;
      await sleep(DELAY_BETWEEN_REVIEWS_MS);
    } catch (err) {
      if (err.errorType === 'rate-limited') {
        console.log(`\n\n  ⚠ Rate limited. Saving progress and stopping.\n`);
        saveReviews(reviews);
        break;
      }
      if (err.errorType === 'out-of-credits') {
        console.log(`\n\n  ⚠ Out of credits. Saving progress and stopping.\n`);
        saveReviews(reviews);
        break;
      }
      console.log(` ✗ ${err.message}`);
      errors++;
      reviewed++;
    }
  }

  // Final summary
  console.log(`\n  ─────────────────────────────────────`);
  console.log(`  Reviewed:  ${reviewed}`);
  console.log(`  Keep:      ${keeps}`);
  console.log(`  Delete:    ${deletes}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total reviewed (all time): ${reviews.meta.totalReviewed}`);
  console.log(`  ─────────────────────────────────────\n`);
  console.log(`  ✓ Results saved to data/reviewed-regulations.json\n`);
}

main().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
