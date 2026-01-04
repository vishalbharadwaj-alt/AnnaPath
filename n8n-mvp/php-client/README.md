PHP Client for n8n Ingredient Co-pilot

Drop this folder into your WAMP www directory (e.g., C:\wamp64\www\n8n-client) and access via http://localhost/n8n-client/index.html

Files:
- `index.html` — simple form to submit text or an image to the backend
- `submit.php` — handler that builds the payload and POSTs to the n8n webhook
- `call_webhook.php` — quick CLI/browser script that sends a sample payload
- `config.php` — set `$WEBHOOK_URL`, `$N8N_AUTH`, and `$API_KEY_HEADER` if you use API keys

Notes:
- If n8n Basic Auth is enabled, set `$N8N_AUTH = 'user:pass'` in `config.php`.
- If running Docker + WAMP on the same machine, Docker containers can reach the host via `host.docker.internal`. No changes are required for standard localhost testing.
- For production, serve behind HTTPS and add an API token header to avoid exposing the webhook publicly.

Testing:
1. Start the n8n stack (`docker-compose up --build -d`) and import & activate the workflow.
2. Place this folder under WAMP's `www` and open `http://localhost/n8n-client/index.html`.
3. Submit a text or upload an image and verify the response shown.
4. Check audit logs in Postgres or check the Redis cache using the provided test scripts.

Need help wiring the MySQL node in n8n to write into WAMP MySQL? I can produce a ready-to-import workflow variant that writes to MySQL instead of Postgres.
