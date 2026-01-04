#!/bin/bash
set -e

echo "Waiting for services to settle..."
sleep 8

# Step 1: Ensure cache is empty (best-effort)
curl -s "http://localhost:3000/cache/get?key=sugar_salt" | jq

# Step 2: Call webhook with input to populate cache
echo "Calling webhook to populate cache"
curl -s -X POST http://localhost:3001/webhook/ingest -H "Content-Type: application/json" -d '{"text":"Sugar salt"}' | jq

# Step 3: Call webhook again — should short-circuit to cached response
echo "Calling webhook second time to exercise cache hit"
curl -s -X POST http://localhost:3001/webhook/ingest -H "Content-Type: application/json" -d '{"text":"Sugar salt"}' | jq

echo "Done"
