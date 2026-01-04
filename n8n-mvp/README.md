# n8n MVP backend for Ingredient Co-pilot

This repo contains a runnable MVP backend using n8n plus local mock services for OCR and LLM reasoning. The idea: let you run a full local stack and import a ready n8n workflow that takes in an ingredient input (image/text), runs OCR, normalizes, calls reasoning, and responds.

## What's included
- docker-compose.yml (n8n, Postgres, Redis, MinIO, mock services)
- mock_services (Node/Express mock OCR and LLM)
- n8n_workflows/ingest_and_reasoning.json — importable n8n workflow

## Quick start (local)
1. Ensure Docker & Docker Compose are installed.
2. From this directory run:

   docker-compose up --build -d

3. Open n8n at http://localhost:5678 (user: `admin`, pass: `changeme`).
4. Import `n8n_workflows/ingest_and_reasoning.json` via the n8n UI (Settings → Workflows → Import).
5. Activate the workflow.

## Local mock services 🔧

- The mock services listen on `http://localhost:3001` by default. The ingest webhook is at `http://localhost:3001/webhook/ingest` and is useful when running the front-end locally.
- To run the mock services locally (simple):
  - cd `n8n-mvp/mock_services` && `npm install`
  - `node server.js` (or `DISABLE_REDIS=1 node server.js` to avoid attempting a Redis connection)
- Run under PM2 for reliability (recommended):
  - Install pm2 globally: `npm install -g pm2`
  - Start the service with env vars: in PowerShell

    ```powershell
    # start the service with Redis disabled (recommended for local dev)
    $env:PORT=3001; $env:DISABLE_REDIS=1; pm2 start server.js --name "mock-ai-service" --watch --update-env
    pm2 status
    pm2 logs mock-ai-service --lines 200
    ```

  - To make PM2 restart on machine reboot: `pm2 startup` then `pm2 save` (follow PM2 output instructions).
- If port `3001` is already in use (for example, by VS Code Live Preview), you can start the mock service on a different port: in PowerShell use `$env:PORT=3002; $env:DISABLE_REDIS=1; node server.js` and update the webhook URL in the front-end (or use the `webhook-url` input in the UI).
- To regenerate the SQLite database used by the mock DB endpoints, run `python scripts/import_sqlite.py` from the repository root. The generated DB is `n8n-mvp/db/food_urban_semi_urban.sqlite`.

**n8n resilience (recommended)**
- For the HTTP Request node that calls the ingest webhook, enable **Retry on Fail** and set:
  - Max Retries: 3
  - Wait Between Retries (ms): 2000
  - On Error: Continue (or handle the error node in your workflow)

**UI note / common pitfall**
- Ensure front-end fetches use the full path to the webhook: `http://localhost:3001/webhook/ingest` — fetching just the host (`http://localhost:3001`) returns the site root (HTML) and causes JSON parsing errors (Unexpected token '<').
- On Windows, `Invoke-RestMethod` is a quick way to POST JSON for testing without quoting issues:

  ```powershell
  $body = @{ text = "Sugar salt" } | ConvertTo-Json
  Invoke-RestMethod -Uri 'http://127.0.0.1:3001/webhook/ingest' -Method Post -Body $body -ContentType 'application/json'
  ```

## Test
Send a POST to the webhook (note the webhook path is `/webhook/ingest`):

curl -X POST http://localhost:5678/webhook/ingest -H "Content-Type: application/json" -d '{"text":"Sugar, salt, wheat flour"}'

You should get a short summary string returned.

## Replace mocks with real services
- Replace `http://mock-services:3000/ocr` with your OCR provider endpoint or set up a small microservice wrapper.
- Replace `http://mock-services:3000/llm` with your LLM endpoint (OpenAI, Anthropic, or on-prem model); adapt the prompt builder in the `Normalize` function or add another function to build structured prompts.

## Caching & Auditing (added)
- A simple cache microservice has been added (`/cache/get` and `/cache/set`) which uses Redis.
- The n8n workflow checks cache first; on miss it calls OCR + LLM and stores the reasoning result back into cache.
- The workflow also inserts an audit row into Postgres (`audit_logs` table). Create the table using `db/init_db.sql` in the Postgres container (or run psql against the `postgres` service).

## Next tasks (suggested)
- Add metric instrumentation and error handling (Sentry).
- Swap mock endpoints for production providers using the provider templates in `templates/` (coming next).
- Add GitHub Actions to run tests on PRs (coming next).

If you'd like, I can:
- Provide a ready-to-import workflow that also writes to Postgres and caches results,
- Add an automated test harness that exercises the webhook and checks expected reasoning.

