# better-uk

Inspired by [bettereu.com](https://bettereu.com/) — a UK-focused AI review of legislation, charities, and the civil service.

## What is this?

A web app that uses Grok AI to review three pillars of UK public life and give each item a simple verdict:

| Category          | Corpus                                            | Verdict         |
| ----------------- | ------------------------------------------------- | --------------- |
| **Regulations**   | ~186,900 statutory instruments & acts (1801–2025) | KEEP or DELETE  |
| **NGO Ecosystem** | ~168,000 registered charities                     | KEEP or DEFUND  |
| **Civil Service** | ~450 departments, agencies & ALBs                 | KEEP or ABOLISH |

Built with Expo Router, React Native for Web, and powered by Grok (`grok-4-1`) via the xAI API. Deployed as a static SPA on Vercel.

## Getting started

```bash
cd better-uk
npm install
npm run web          # start dev server on http://localhost:8081
```

## Scraper & review pipeline

The pipeline has three stages: **scrape** → **review** → **display**.

### 1. Scrape — build the index

```bash
# UK legislation from legislation.gov.uk (Atom feeds)
npm run scrape -- --from 1801 --to 2025

# UK charities from the Charity Commission bulk extract (Azure Blob)
npm run scrape:charities              # default 500 charities
npm run scrape:charities -- --limit 2000
npm run scrape:charities -- --all     # no limit, exhaust all search terms

# UK government organisations from gov.uk
npm run scrape:cs
```

The legislation scraper paginates Atom feeds across 16 legislation types (UKPGA, UKSI, UKLA, ASP, ASC, NIA, SSI, WSI, NISR, UKCI, UKMO, NISI, etc.) with 300ms rate limiting. It supports `--type ukpga` to scrape a single type and `--fresh` to ignore existing data.

### 2. Review — send to Grok AI

Requires a `XAI_API_KEY` environment variable ([get one here](https://console.x.ai)).

```bash
# Review legislation (reads data/legislation-index.json)
XAI_API_KEY=xai-xxx npm run review -- --batch 20

# Review charities (reads data/ngo-index.json)
XAI_API_KEY=xai-xxx npm run review:ngos -- --batch 20

# Review civil service bodies (reads data/cs-index.json)
XAI_API_KEY=xai-xxx npm run review:cs -- --batch 20
```

All review scripts are incremental — they skip items already reviewed and save after each item. They track Grok API costs in USD ticks and convert to GBP. Use `--year 2020` to filter to a specific year, or `--resume` to continue after rate limiting.

### Data architecture

The full legislation corpus is ~186,900 items (~44 MB as JSON) which is too large to bundle into the app or commit to git as a single file. The data is split into three tiers:

| Tier               | Example                             | Size            | Bundled?              | Git?          |
| ------------------ | ----------------------------------- | --------------- | --------------------- | ------------- |
| **Lite meta**      | `data/legislation-index-lite.json`  | ~5 KB           | ✅ Static import      | ✅ Committed  |
| **Per-year files** | `public/data/legislation/2020.json` | ~50–500 KB each | ❌ Fetched at runtime | ✅ Committed  |
| **Full monolith**  | `data/legislation-index.json`       | ~44 MB          | ❌ Never              | ❌ Gitignored |

- **Lite files** are imported at build time — contain `totalItems`, `yearStats`, and metadata (no individual items). Enough for headlines, charts, and stats.
- **Per-year files** live in `public/data/` and are served as static assets. The app fetches them on demand when the user browses a specific year, with in-memory caching.
- **Full monolith files** stay local and are used only by the review scripts as a resume source. They are gitignored.

The same three-tier pattern applies to reviewed data — as the reviewed corpus grows, the review script also writes per-year files to `public/data/reviewed/{year}.json`.

### Data files

| File                                  | Written by         | Read by             | Git?          |
| ------------------------------------- | ------------------ | ------------------- | ------------- |
| `data/legislation-index.json`         | `scrape`           | `review`            | ❌ Gitignored |
| `data/legislation-index-lite.json`    | `scrape`           | app (static import) | ✅            |
| `public/data/legislation/{year}.json` | `scrape`           | app (runtime fetch) | ✅            |
| `data/ngo-index.json`                 | `scrape:charities` | `review:ngos`       | ❌ Gitignored |
| `data/ngo-index-lite.json`            | `scrape:charities` | app (static import) | ✅            |
| `data/cs-index.json`                  | `scrape:cs`        | `review:cs`, app    | ✅            |
| `data/reviewed-regulations.json`      | `review`           | `review` (resume)   | ❌ Gitignored |
| `public/data/reviewed/{year}.json`    | `review`           | app (runtime fetch) | ✅            |
| `data/reviewed-ngos.json`             | `review:ngos`      | app                 | ✅            |
| `data/reviewed-civil-service.json`    | `review:cs`        | app                 | ✅            |

## npm scripts

| Script                     | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `npm run web`              | Start Expo dev server for web                                 |
| `npm run build:web`        | Build for production (`expo export --platform web` → `dist/`) |
| `npm run scrape`           | Scrape legislation.gov.uk                                     |
| `npm run scrape:charities` | Scrape Charity Commission                                     |
| `npm run scrape:cs`        | Scrape gov.uk organisations                                   |
| `npm run review`           | AI review of legislation                                      |
| `npm run review:ngos`      | AI review of charities                                        |
| `npm run review:cs`        | AI review of civil service                                    |
