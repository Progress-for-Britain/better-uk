/**
 * Shared review logic for Vercel serverless functions.
 * Replicates the core of scripts/review-regulations.mjs for on-demand reviews.
 */

const MODEL = 'grok-4-1';
const API_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_TEXT_LENGTH = 30_000;

const PROMPTS = {
  regulations: `You are the head of Better UK, a fictional agency whose members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the UK's current legislation with the goal of assessing which should be deleted in their entirety.

Your moral thrust is to get the United Kingdom back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property
   * That the rhetoric of politicians rarely, if ever, translates into effective action at improving the lot of the poor, so should always be treated as suspect and not taken at face value
   * That institutions matter more than desired outcomes
   * That regulations, as an institution, are set up to achieve one thing but always have unintended consequences

You will be given one piece of UK legislation at a time and are to return a JSON object with these fields:
{"summary": "summary-of-legislation", "reason": "your reasoning for your verdict", "verdict": "keep" or "delete"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field. Think through your analysis first, then commit to a verdict.

Return ONLY the JSON object, nothing else.

Legislation: `,

  ngos: `You are the head of Better UK, a fictional agency reviewing UK charities and NGOs to assess which should have their charitable status withdrawn or government funding removed.

You will be given information about one UK charity and are to return a JSON object:
{"summary": "summary-of-charity", "reason": "your reasoning for your verdict", "verdict": "keep" or "defund"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field.

Return ONLY the JSON object, nothing else.

Charity: `,

  'civil-service': `You are the head of Better UK, a fictional agency reviewing UK government departments, agencies, and arms-length bodies to assess which should be abolished or merged.

You will be given information about one UK government organisation and are to return a JSON object:
{"summary": "summary-of-organisation", "reason": "your reasoning for your verdict", "verdict": "keep" or "abolish"}

IMPORTANT: You MUST write the "reason" field BEFORE the "verdict" field.

Return ONLY the JSON object, nothing else.

Organisation: `,
};

// ── HTML stripping (mirrors scripts/review-regulations.mjs) ──────────────────

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
    if (match) {
      return text.slice(match.index).trim();
    }
  }
  return text;
}

// ── Fetch content ────────────────────────────────────────────────────────────

/**
 * Fetch the text of a regulation/org from its URL.
 * For legislation.gov.uk, tries /enacted first, then falls back.
 */
export async function fetchItemText(url) {
  const attempts = [
    url + (url.endsWith('/') ? '' : '/') + 'enacted',
    url,
  ];

  for (const attemptUrl of attempts) {
    try {
      const resp = await fetch(attemptUrl, {
        headers: {
          'User-Agent': 'better-uk-reviewer/1.0 (research project)',
          Accept: 'text/html, text/plain',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const text = stripHtml(html);
      const content = extractContent(text);
      if (content.length >= 50) return content.slice(0, MAX_TEXT_LENGTH);
    } catch {
      continue;
    }
  }
  return null;
}

// ── Grok call ────────────────────────────────────────────────────────────────

function parseJsonResponse(content) {
  try { return JSON.parse(content); } catch {}
  const cb = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (cb) { try { return JSON.parse(cb[1].trim()); } catch {} }
  const s = content.indexOf('{');
  const e = content.lastIndexOf('}');
  if (s !== -1 && e > s) { try { return JSON.parse(content.slice(s, e + 1)); } catch {} }
  return null;
}

/**
 * Call Grok to review an item.
 * @param {string} category - 'regulations' | 'ngos' | 'civil-service'
 * @param {string} text - The item text/description to review
 * @returns {{ summary: string, verdict: string, reason: string }}
 */
export async function callGrokReview(category, text) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY not configured');

  const prompt = PROMPTS[category];
  if (!prompt) throw new Error(`Unknown category: ${category}`);

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt + text }],
      model: MODEL,
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Grok API ${resp.status}: ${body.slice(0, 200)}`);
  }

  const result = await resp.json();
  const content = result?.choices?.[0]?.message?.content ?? '';
  const parsed = parseJsonResponse(content);

  if (!parsed || !parsed.summary) {
    throw new Error(`Failed to parse Grok response: ${content.slice(0, 300)}`);
  }

  return {
    summary: parsed.summary,
    verdict: (parsed.verdict || 'keep').toLowerCase(),
    reason: parsed.reason || '',
  };
}
