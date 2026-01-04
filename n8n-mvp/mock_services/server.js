const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
app.use(cors());
const port = process.env.PORT || 3001; // default 3001 (env-configurable)

app.use(bodyParser.json({limit: '5mb'}));

const { createClient } = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
let redisClient = null;
let redisConnected = false;
let inMemoryCache = new Map();

// Open SQLite DB (if present)
const dbPath = path.join(__dirname, '..', 'db', 'food_urban_semi_urban.sqlite');
let sqliteDb = null;
try {
  sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Failed to open SQLite DB', err.message);
      sqliteDb = null;
    } else {
      console.log('SQLite DB opened at', dbPath);
    }
  });
} catch (e) {
  console.error('SQLite init error', e.message);
  sqliteDb = null;
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err);
});

// Only attempt Redis connection if not explicitly disabled
if (!process.env.DISABLE_REDIS) {
  try {
    redisClient = createClient({ url: redisUrl });
    // Prevent process exit on Redis socket errors - log and fallback to in-memory
    redisClient.on('error', (err) => {
      console.error('Redis client error', err);
      redisConnected = false;
      redisClient = null;
    });

    // Try connecting to Redis, but don't crash on failure. Use in-memory fallback.
    redisClient.connect().then(() => {
      redisConnected = true;
      console.log('Redis connected');
    }).catch(err => {
      console.error('Redis connect error', err);
      redisConnected = false;
      redisClient = null; // signal fallback
    });
  } catch (err) {
    console.error('Redis setup error', err);
    redisClient = null;
    redisConnected = false;
  }
} else {
  console.log('Redis disabled via DISABLE_REDIS environment variable; using in-memory cache');
}

// Cache endpoints with fallback
app.post('/cache/set', async (req, res) => {
  const { key, value, ttl } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key required' });
  try {
    if (redisConnected && redisClient) {
      await redisClient.set(key, JSON.stringify(value), { EX: ttl || 3600 });
    } else {
      inMemoryCache.set(key, JSON.stringify(value));
      if (ttl && ttl > 0) setTimeout(() => inMemoryCache.delete(key), ttl * 1000);
    }
    res.json({ ok: true, fallback: !redisConnected });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/cache/get', async (req, res) => {
  const key = req.query.key;
  if (!key) return res.json({ found: false });
  try {
    if (redisConnected && redisClient) {
      const v = await redisClient.get(key);
      if (!v) return res.json({ found: false });
      return res.json({ found: true, value: JSON.parse(v) });
    } else {
      const v = inMemoryCache.get(key);
      if (!v) return res.json({ found: false });
      return res.json({ found: true, value: JSON.parse(v) });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Simple mock OCR: returns detected ingredients and a confidence score
app.post('/ocr', (req, res) => {
  // Accepts { image: <string> } or { text: <string> }
  const payload = req.body || {};
  const input = payload.text || payload.image || '';

  // Simple deterministic mock tokenization
  let ingredients = [];
  if (typeof input === 'string' && input.trim().length > 0) {
    // Very basic split by non-word characters to pick tokens that look like ingredients
    ingredients = input.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0,8);
  } else {
    // fallback example
    ingredients = ['sugar', 'salt', 'mono_sodium_glutamate', 'wheat_flour'];
  }

  res.json({
    ingredients: ingredients,
    confidence: 0.89,
    raw: input
  });
});

// Mock LLM reasoning: expects structured context
app.post('/llm', (req, res) => {
  const ctx = req.body || {};
  // ctx should include {ingredients, userProfile, medicalHistory, region, budget}
  const ings = (ctx.ingredients || []).slice(0,10);

  // generate a simple deterministic reasoning response
  let bullets = [];
  let risk = 10;
  let uncertainties = [];

  if (ings.includes('sugar')) {
    bullets.push('High sugar content — relevant for diabetes and weight management.');
    risk += 30;
  }
  if (ings.includes('salt')) {
    bullets.push('High salt content — relevant for hypertension and fluid balance.');
    risk += 20;
  }
  if (ctx.medicalHistory && ctx.medicalHistory.includes('diabetes')) {
    bullets.push('Based on your diabetes history, sugar is a significant concern.');
    risk += 15;
  }

  // If the OCR confidence is low, communicate uncertainty
  if ((ctx.ocrConfidence || 0) < 0.6) {
    uncertainties.push('Low OCR confidence: some ingredients may be misrecognized.');
  }

  // Build alternatives heuristically
  let alternatives = [];
  if (ings.includes('sugar')) {
    alternatives.push({name: 'plain low-fat yogurt', costEstimate: 'low', availability: 'common'});
  }
  if (ings.includes('mono_sodium_glutamate')) {
    alternatives.push({name: 'homemade spice mix (no MSG)', costEstimate: 'low', availability: 'local markets'});
  }

  const summary = `Detected ${ings.length} ingredient(s). Main concerns: ${bullets.length>0 ? bullets.join(' ') : 'No major red flags detected.'}`;

  res.json({
    summaryPlainText: summary,
    bullets,
    riskScore: Math.min(100, risk),
    uncertainties,
    alternatives,
    explainabilityNotes: 'This is a simulated response from the mock LLM. Replace with your real LLM or a domain model.'
  });
});

// Simple webhook endpoint that mimics the n8n ingest workflow (OCR -> LLM)
app.post('/webhook/ingest', async (req, res) => {
  const body = req.body || {};
  const input = (body.text || body.image || '');

  // Reuse OCR logic
  let ingredients = [];
  if (typeof input === 'string' && input.trim().length > 0) {
    ingredients = input.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0,8);
  } else {
    ingredients = ['sugar','salt','wheat_flour'];
  }
  const ocrConfidence = 0.9;

  // Build LLM context
  const ctx = { ingredients, ocrConfidence, userProfile: body.userProfile || {}, medicalHistory: body.medicalHistory || [] };

  // Reuse LLM logic inline to avoid an internal HTTP call
  const ings = (ctx.ingredients || []).slice(0,10);
  let bullets = [];
  let risk = 10;
  let uncertainties = [];

  if (ings.includes('sugar')) { bullets.push('High sugar content — relevant for diabetes and weight management.'); risk += 30; }
  if (ings.includes('salt')) { bullets.push('High salt content — relevant for hypertension and fluid balance.'); risk += 20; }
  if (ctx.medicalHistory && ctx.medicalHistory.includes('diabetes')) { bullets.push('Based on your diabetes history, sugar is a significant concern.'); risk += 15; }
  if (ocrConfidence < 0.6) { uncertainties.push('Low OCR confidence: some ingredients may be misrecognized.'); }

  const summary = `Detected ${ings.length} ingredient(s). Main concerns: ${bullets.length>0 ? bullets.join(' ') : 'No major red flags detected.'}`;

  return res.json({ summaryPlainText: summary, bullets, riskScore: Math.min(100, risk), uncertainties, alternatives: [], explainabilityNotes: 'Mock ingest endpoint response' });
});

// Health check
app.get('/health', (req, res) => res.json({ok: true}));

// Simple DB endpoints (if SQLite DB available)
app.get('/db/foods', (req, res) => {
  if (!sqliteDb) return res.status(500).json({ error: 'DB not available' });
  sqliteDb.all('SELECT food_id, food_name, region FROM foods ORDER BY food_id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/db/foods/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!sqliteDb) return res.status(500).json({ error: 'DB not available' });
  sqliteDb.get('SELECT food_id, food_name, region FROM foods WHERE food_id = ?', [id], (err, food) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!food) return res.status(404).json({ error: 'not found' });
    sqliteDb.all(
      `SELECT fi.impact_level, fi.reason, i.ingredient_id, i.common_name, i.health_effect_tag
       FROM food_ingredients fi JOIN ingredients i ON fi.ingredient_id = i.ingredient_id
       WHERE fi.food_id = ?`,
      [id],
      (err2, ingRows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ...food, ingredients: ingRows });
      }
    );
  });
});

app.get('/db/ingredients', (req, res) => {
  if (!sqliteDb) return res.status(500).json({ error: 'DB not available' });
  sqliteDb.all('SELECT ingredient_id, common_name, chemical_name, health_effect_tag FROM ingredients ORDER BY ingredient_id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Mock services running on port ${port}`);
});
