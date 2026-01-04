#!/bin/bash
# Simple test script to exercise the ingest webhook
set -e

echo "Waiting for services to be up..."
sleep 6

echo "Calling webhook with text input"
curl -s -X POST http://localhost:3001/webhook/ingest -H "Content-Type: application/json" -d '{"text":"Sugar, salt, monosodium glutamate"}' | jq

echo "Done"
