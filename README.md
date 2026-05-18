# Daily Research Update

Local web app for daily autonomous-vehicle research briefings from arXiv. It scans recent papers for five topics, asks the local Codex CLI to synthesize each topic into a roughly 500-word blog post, and serves the results in a tabbed web interface with generated SVG explainers.

Each run only considers papers published in the last 7 days. Papers already included in an earlier saved daily report are filtered out, so recurring runs do not repeat old papers.

The SVG visual for each topic uses a separate 180-day arXiv scan to show field direction over the past six months: monthly paper momentum plus dominant research themes. This trend scan does not change which papers are reported in the daily digest.

## Topics

- Autonomous driving algorithms
- Simulation
- 3D reconstruction
- Safety
- Autonomous vehicle transportation
- Autonomous vehicle storage and event data recorders

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Open `http://127.0.0.1:3000`.

## Daily Schedule

The server schedules an update every morning at 6:00 AM Eastern using:

```env
CRON_SCHEDULE=0 6 * * *
CRON_TIMEZONE=America/New_York
```

`America/New_York` handles EST/EDT transitions automatically.

## Manual Update

Run a scan without waiting for the scheduler:

```bash
npm run update
```

Or use the `Run now` button in the web UI. Summaries are stored under `data/reports/`, and visual explainers are generated under `public/generated/`. These generated files are ignored by Git by default.

## Codex Summarization

This project does not use an OpenAI API key. It shells out to the local Codex CLI:

```bash
codex exec -m gpt-5.5 "<summary prompt>"
```

Configure the command in `.env` if needed:

```env
CODEX_BIN=codex
CODEX_MODEL=gpt-5.5
CODEX_MAX_PAPERS=5
CODEX_TIMEOUT_MS=60000
```

If Codex is unavailable or returns non-JSON output, the app writes a fallback digest from arXiv titles and abstracts so the daily job still produces a usable report.
