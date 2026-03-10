# better-uk — Talk Notes

## The Elevator Pitch

A single developer built a web app that scrapes, AI-reviews, and presents **186,900 UK regulations**, **168,000 charities**, and **~450 civil service bodies** — all reviewed by Grok with a consistent Austrian economics lens. Open source, transparent prompts, and deployed as a static SPA on Vercel.

---

## 1. The Scale of UK Bureaucracy

| Category      | Corpus Size                                          | Verdict        | Source                                      |
| ------------- | ---------------------------------------------------- | -------------- | ------------------------------------------- |
| Regulations   | **186,900** statutory instruments & acts (1801–2025) | KEEP / DELETE  | legislation.gov.uk Atom feeds               |
| Charities     | **168,000** registered charities                     | KEEP / DEFUND  | Charity Commission bulk extract (44 MB ZIP) |
| Civil Service | **~450** departments, agencies & ALBs                | KEEP / ABOLISH | gov.uk organisations API                    |

**Key point:** Nobody has read all 186,900 pieces of UK legislation. Not parliament, not the civil service. An AI can at least attempt a first pass.

---

## 2. Architecture: Scrape → Review → Display

Three completely independent pipelines — each follows the same pattern:

```
Data source  →  Scraper (Node.js)  →  Index JSON
Index JSON   →  Review script + Grok 4.1  →  Reviewed JSON
Reviewed JSON  →  Expo web app  →  Users
```

### The scrapers

- **Legislation**: Paginates legislation.gov.uk Atom feeds across 16 legislation types (UKPGA, UKSI, UKLA, etc.), custom regex XML parser (no external XML lib), 300ms rate limiting
- **Charities**: Downloads 44 MB bulk ZIP from Azure Blob storage, parses TSV, cross-references sector classifications, extracts financials
- **Civil Service**: Walks the gov.uk API, pulls headcount + budgets for every department, agency and ALB

### The review scripts

- All use **Grok 4.1** via the xAI API
- Incremental: skip items already reviewed, save after each item (crash-safe)
- Track API cost in USD ticks → convert to GBP
- Resume with `--resume` flag after rate limiting or credit exhaustion
- Configurable batch size and year filtering

---

## 3. The Prompt Engineering

All three category prompts share a consistent **Austrian economics** framing — citing Mises, Hayek, and Friedman. The key philosophical constraints:

- Wealth is created by liberty and private property, not by decree
- Politician rhetoric ≠ effective action — always treat claims as suspect
- Institutions matter more than desired outcomes
- Regulations always have unintended consequences (distorted incentives, reduced supply, increased costs, monopoly creation)
- The desired goal of a regulation **must** be weighed against the unintended costs

### The verdict structure

For every item, Grok must return:

```json
{ "summary": "...", "verdict": "keep|delete", "reason": "..." }
```

**If "keep"** → justify: why would citizens be _worse off_ if this was deleted?
**If "delete"** → justify: what are the _unseen costs_ of keeping it on the books?

This forces the AI into a specific analytical frame rather than defaulting to "regulation = good."

### Prompt transparency

The full prompts are shown **on the site itself** — users can see exactly what the AI was told. No hidden system prompts.

---

## 4. The Data Problem (and solution)

### The challenge

- 186,900 legislation items = **44 MB** as a single JSON index
- Reviewed regulations at full corpus ≈ **102 MB** — over GitHub's 100 MB file limit
- Can't bundle 44 MB into a static SPA

### The solution: Three-tier data strategy

| Tier               | Example                             | Size            | Bundled?               | Git?          |
| ------------------ | ----------------------------------- | --------------- | ---------------------- | ------------- |
| **Lite meta**      | `legislation-index-lite.json`       | ~5 KB           | ✅ Yes (static import) | ✅ Committed  |
| **Per-year files** | `public/data/legislation/2020.json` | ~50–500 KB each | ❌ Fetched at runtime  | ✅ Committed  |
| **Full monolith**  | `legislation-index.json`            | 44 MB           | ❌ Never               | ❌ Gitignored |

- **Lite files** bundle with the app: just `totalItems` + `yearStats` (counts per year) — enough for headlines, charts, and stats
- **Per-year files** live in `public/` — Expo copies them to `dist/` on build, served as static assets, fetched on demand when the user browses a specific year
- **Full files** stay local — used only by the review scripts as a resume source

### Lazy loading in the app

```
User clicks "2020" → fetch('/data/legislation/2020.json') → cache in memory → render table
```

- Results cached in a `useRef<Map>` — revisiting a year is instant
- Loading spinner while fetching
- Error state for missing years

---

## 5. The Tech Stack

| Layer          | Choice                         | Why                                                                         |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| **Framework**  | Expo Router + React Native Web | Write once, deploy to web — with typed routes and file-based routing        |
| **Styling**    | NativeWind (Tailwind for RN)   | Utility-first CSS, but works cross-platform                                 |
| **Typography** | DM Mono + Instrument Serif     | Monospace data aesthetic — everything feels like a terminal readout         |
| **AI**         | Grok 4.1 (xAI API)             | grok-4-1 for thorough analysis, cost tracking via `usage.cost_in_usd_ticks` |
| **Deployment** | Vercel                         | `expo export --platform web` → static SPA in `dist/` → done                 |
| **Bundler**    | Metro (not webpack)            | Single-page output mode, React Compiler enabled                             |

### Why Expo for a web-only project?

- File-based routing (like Next.js but lighter)
- React Native Web gives pixel-identical components across breakpoints
- If you ever want a native app, the code is already there
- Metro is fast and the DX is excellent

---

## 6. The UI Walkthrough

### Three-tab architecture

A single `index.tsx` powers all three categories. The active tab (`regulations | ngos | civil-service`) switches:

- Hero headline and stats
- Donut chart (keep vs delete percentage)
- Year chart (legislation only — stacked bars per year)
- Verdicts table (reviewed items with expandable rows)
- Index browser (full corpus browsing with lazy-loaded year data)

### Key UI patterns

- **Responsive**: `useWindowDimensions()` hook switches between desktop columns and mobile stacked layout
- **Donut chart**: Pure CSS `conic-gradient` — no charting library, 0 dependencies
- **Year chart**: Horizontal scrollable bar chart with interactive year selection
- **Expandable rows**: Mobile shows 2-line summary; tap to expand full reason + verdict
- **Pagination**: 50 items per page in the index browser
- **Search + filter**: Real-time text search + type/sector filter pills
- **Budget sort**: Civil service tab can sort by departmental budget (£m/£bn)
- **External links**: Every item links to its source (legislation.gov.uk, charity register, gov.uk)

---

## 7. Comparison with bettereu.com

|                   | better-uk                                      | bettereu.com                           |
| ----------------- | ---------------------------------------------- | -------------------------------------- |
| **Language**      | TypeScript / React Native                      | Clojure                                |
| **Data engine**   | Static JSON + Grok API scripts                 | Rama (distributed dataflow)            |
| **Architecture**  | Static SPA, offline-reviewed data              | Live pipeline, real-time processing    |
| **Deployment**    | Vercel (free tier)                             | Rama cluster                           |
| **Scope**         | UK: legislation + charities + civil service    | EU: regulations only                   |
| **Data source**   | legislation.gov.uk, Charity Commission, gov.uk | EUR-Lex SPARQL endpoint                |
| **AI model**      | Grok 4.1 (grok-4-1)                            | Grok 4.1 (grok-4-1-fast-non-reasoning) |
| **Output format** | JSON                                           | Clojure EDN maps                       |

### Key differences

- **bettereu** uses Rama for a live, distributed, tick-driven pipeline — scraping and reviewing happen continuously
- **better-uk** uses a simpler offline batch approach — scrape once, review incrementally, deploy static
- **better-uk** covers three categories (regulations, charities, civil service) vs one (EU regulations)
- **better-uk** is a static SPA that works entirely from pre-computed JSON — zero server costs at runtime

---

## 8. Interesting Implementation Details

### The scraper handles 16 types of UK legislation

UKPGA (Public General Acts), UKSI (Statutory Instruments), UKLA (Local Acts), ASP (Acts of Scottish Parliament), ASC (Acts of Senedd Cymru), NIA (Northern Ireland Acts), SSI (Scottish SIs), WSI (Welsh SIs), NISR (NI Statutory Rules), UKCI (Church Instruments), UKMO (Ministerial Orders), NISI (NI Orders in Council), and more.

### HTML stripping for legislation review

The review script fetches full legislation text from legislation.gov.uk, strips HTML (removing scripts, styles, nav, headers, footers), decodes entities, and truncates to 30,000 characters before sending to Grok. It tries the `/enacted` endpoint first, falls back to the base URL, and retries 3× with exponential backoff.

### Cost tracking

Every Grok API call returns `usage.cost_in_usd_ticks`. The review scripts sum these across all reviews and convert to GBP. The cost is displayed on the site (e.g., "AI review cost: £X.XX") — full transparency on what it costs to review the corpus.

### Charity Commission data

The scraper downloads a 44 MB ZIP from Azure Blob storage, cross-references two TSV files (charity details + classifications), filters to registered charities only, and extracts financial data. The full 168,000 charities → `ngo-index.json` (gitignored), top 5,000 by income → `ngo-index-lite.json` (bundled).

---

## 9. What Could Come Next

- **Full corpus reviews**: At ~£0.01–0.05 per regulation, the full 186,900 items would cost roughly £2,000–10,000
- **Comparative analysis**: Run the same prompts through Claude, GPT-4, Gemini — compare verdicts
- **Time-series analysis**: How has the rate of legislation changed over decades? Which decades were most "deletable"?
- **Public voting**: Let users agree/disagree with AI verdicts — build a consensus layer
- **Native app**: The Expo codebase already runs on iOS/Android — just needs a build
- **Live pipeline**: Move from static batch processing to a bettereu-style live pipeline (Rama, or a simpler queue system)
- **Cost projections**: What would the civil service save if all "abolish" verdicts were implemented? (Budget data is already scraped)

---

## 10. Demo Flow

1. **Open the site** — show the three-tab hero with stats
2. **Click through tabs** — regulations → charities → civil service (different stats, same layout)
3. **Show a verdict** — expand a "DELETE" row, read the AI's reasoning
4. **Browse the index** — scroll the year selector, watch lazy-loading in action
5. **Show the prompt** — scroll to the "Open Source: The Prompt" section
6. **Run the scraper live** — `npm run scrape -- --from 2025 --to 2025 --type ukpga` (fast, just one year/type)
7. **Run a review** — `XAI_API_KEY=xxx npm run review -- --batch 1` (show one item being reviewed live)
8. **Show the per-year JSON** — open `public/data/legislation/2025.json` in the browser
9. **Show the code** — single `index.tsx` file, single `data.ts` file, three scraper scripts
