# AskBall UAT Portal — Claude Code Guide

## Project overview

AskBall UAT Portal is a lightweight Node.js/Express web app used by QA testers to score
chatbot responses during sprint UAT cycles. Responses are persisted in a local JSON file
(`uat_data.json`). There is no database migration step.

## Tech stack

- **Runtime**: Node.js ≥ 18
- **Framework**: Express 4
- **Storage**: JSON file via `lib/db.js`
- **Frontend**: Single HTML file (`public/index.html`) with vanilla JS — no build step
- **Tests**: Node built-in `node:test` runner

## Project structure

```
askball-uat/
├── server.js          # Express app — routes only, no business logic
├── lib/
│   └── db.js          # JSON-file persistence helpers (readDB / writeDB / makeKey)
├── public/
│   └── index.html     # Full SPA — tester login, UAT form, dashboard
├── tests/
│   └── api.test.js    # HTTP integration tests for all API routes
├── package.json
├── CLAUDE.md          # ← you are here
├── DEPLOY.md          # Railway deployment instructions
└── uat_data.json      # Runtime data file (git-ignored, auto-created)
```

## Common commands

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm start

# Run all tests
npm test
```

## API routes

| Method | Path                    | Description                        |
|--------|-------------------------|------------------------------------|
| GET    | /api/health             | Liveness check                     |
| POST   | /api/response           | Save / update one tester response  |
| POST   | /api/submit             | Mark a tester as submitted         |
| GET    | /api/responses/:tester  | Fetch all responses for a tester   |
| GET    | /api/dashboard          | Full dataset for the dashboard tab |
| GET    | /api/export             | Same as dashboard (used by XLSX)   |

## Architecture notes

- `lib/db.js` is the **only** place that touches the filesystem. Keep all `fs` calls there.
- Routes in `server.js` call `readDB()` / `writeDB()` — they should not import `fs` directly.
- The frontend is a single-file SPA. State lives in JS variables; there is no framework.
- `DB_PATH` env var overrides the default `./uat_data.json` — tests use a temp path via this var.

## Environment variables

| Variable | Default          | Purpose                        |
|----------|------------------|--------------------------------|
| PORT     | 3000             | HTTP listen port               |
| DB_PATH  | ./uat_data.json  | Path to JSON persistence file  |

## Testing approach

Tests use `node:test` (built-in, no extra deps) and `node:assert`. Each test:
1. Points `DB_PATH` to a temp file so tests are isolated.
2. Starts the server on a random port.
3. Makes real HTTP requests via `node:http`.
4. Cleans up the temp file after the suite.

Run a single test file directly:
```bash
node --test tests/api.test.js
```
