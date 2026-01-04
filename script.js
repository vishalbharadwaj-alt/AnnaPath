// Simple client-side ingredient classifier for demo/UX purposes only.
// Keeps processing local and explains basic matches (educational only).

function classifyIngredient(text) {
  const t = text.toLowerCase();
  const danger = ['trans fat', 'trans-fat', 'partially hydrogenated', 'hydrogenated oil'];
  const warning = ['aspartame', 'sugar', 'high-fructose', 'hfcs', 'salt', 'sodium'];
  const safe = ['citric acid', 'vitamin', 'water', 'olive oil', 'olive'];

  for (const w of danger) if (t.includes(w)) return { level: 'danger', note: 'Consider avoiding or limiting this ingredient.' };
  for (const w of warning) if (t.includes(w)) return { level: 'warning', note: 'May require attention for some conditions.' };
  for (const w of safe) if (t.includes(w)) return { level: 'safe', note: 'Generally considered low concern in normal amounts.' };
  return { level: 'neutral', note: 'No obvious concerns detected by simple rules.' };
}

function renderResult(name, classification, note) {
  const container = document.createElement('div');
  container.className = 'result ' + (classification === 'neutral' ? '' : classification);

  const icon = document.createElement('img');
  icon.alt = classification === 'danger' ? 'Avoid' : classification === 'warning' ? 'Warning' : 'Safe';
  icon.src = classification === 'danger' ? 'assets/x.svg' : classification === 'warning' ? 'assets/triangle-alert.svg' : 'assets/shield-check.svg';

  const inner = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.textContent = name;
  const p = document.createElement('p');
  p.textContent = note;

  inner.appendChild(h4);
  inner.appendChild(p);
  container.appendChild(icon);
  container.appendChild(inner);
  return container;
}

let selectedImageBase64 = null;
const DEFAULT_WEBHOOK = 'http://localhost:3001/webhook/ingest';

function setLoading(isLoading) {
  const loading = document.getElementById('loading');
  const btn = document.getElementById('analyze-btn');
  const clear = document.getElementById('clear-btn');
  if (isLoading) {
    if (loading) loading.hidden = false;
    if (btn) { btn.disabled = true; btn.textContent = 'Analyzing…'; }
    if (clear) clear.disabled = true;
  } else {
    if (loading) loading.hidden = true;
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Analyze'; }
    if (clear) clear.disabled = false;
  }
}

function showEmptyMessage(show) {
  const empty = document.querySelector('.results .empty');
  if (!empty) return;
  empty.style.display = show ? '' : 'none';
}

function displayAIResponse(resp) {
  // resp may be a string, or an object (structured response)
  const aiDetails = document.getElementById('ai-details');
  const summaryNode = document.getElementById('ai-summary');
  const bulletsNode = document.getElementById('ai-bullets');

  aiDetails.hidden = false;
  bulletsNode.innerHTML = '';

  if (!resp) {
    summaryNode.textContent = 'No response from AI.';
    return;
  }

  if (typeof resp === 'string') {
    summaryNode.textContent = resp;
    return;
  }

  // If object with known fields
  const summaryText = resp.summaryPlainText || resp.summary || resp.response?.summary || (typeof resp === 'string' ? resp : JSON.stringify(resp));
  summaryNode.textContent = summaryText;
  const summaryEl = document.getElementById('summary'); if (summaryEl) summaryEl.innerText = summaryText;

  const bullets = resp.bullets || resp.response?.bullets || [];
  if (Array.isArray(bullets) && bullets.length > 0) {
    const ul = document.createElement('ul');
    bullets.forEach(b => { const li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
    bulletsNode.appendChild(ul);

    // Also populate #details element if present
    const detailsEl = document.getElementById('details');
    if (detailsEl) detailsEl.innerHTML = `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
  }

  // Set risk score if present
  const risk = resp.riskScore || resp.response?.riskScore;
  const riskEl = document.getElementById('risk-score');
  if (riskEl && typeof risk !== 'undefined') {
    riskEl.innerText = `Risk Level: ${risk}%`;
    riskEl.style.color = risk > 50 ? 'red' : 'green';
  }
}

async function postToWebhook(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // Try to parse as JSON, otherwise return text
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return txt; }
}

async function analyze() {
  const textarea = document.getElementById('ingredients');
  const select = document.getElementById('health');
  const webhookInput = document.getElementById('webhook-url');
  const resultsList = document.getElementById('results-list');
  const uncertainty = document.getElementById('uncertainty');

  const raw = textarea.value.trim();
  if (!raw && !selectedImageBase64) {
    textarea.focus();
    alert('Please paste ingredient text or add an image to analyze.');
    return;
  }

  const url = (webhookInput && webhookInput.value.trim()) ? webhookInput.value.trim() : DEFAULT_WEBHOOK;

  // Build payload
  const payload = {};
  if (raw) payload.text = raw;
  if (selectedImageBase64) payload.image = selectedImageBase64;
  const audience = (select && select.value) ? select.value : undefined;
  if (audience) payload.userProfile = { profile: audience };

  showEmptyMessage(false);
  resultsList.innerHTML = '';
  setLoading(true);

  try {
    let resp;
    try {
      resp = await postToWebhook(url, payload);
    } catch (firstErr) {
      console.warn('Primary webhook failed, attempting local mock fallback', firstErr);
      // Fallback to local mock services (if n8n isn't running)
      const mockUrl = 'http://localhost:3001/webhook/ingest';
      try {
        resp = await postToWebhook(mockUrl, payload);
        // annotate the response so users know this was a fallback
        resp = (typeof resp === 'object') ? { ...resp, _fallback: true, _fallback_source: mockUrl } : { summary: resp, _fallback: true, _fallback_source: mockUrl };
      } catch (secondErr) {
        throw new Error('Both primary webhook and local mock fallback failed: ' + (secondErr.message || secondErr));
      }
    }

    // Show AI response
    displayAIResponse(resp);

    // Also render simple local breakdown if we have text
    if (raw) {
      const parts = raw.split(/[,;\/\n]+/).map(p => p.trim()).filter(Boolean);
      const seen = new Set();
      for (const p of parts) {
        const cls = classifyIngredient(p);
        const name = p.split('(')[0].trim();
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const node = renderResult(name, cls.level, cls.note);
        resultsList.appendChild(node);
      }
      if (resultsList.children.length === 0) {
        const none = document.createElement('p');
        none.textContent = 'No ingredients recognized in the input. Try a comma-separated list or paste the full ingredient statement.';
        resultsList.appendChild(none);
      }
    } else if (selectedImageBase64) {
      // When only image provided, display a placeholder indicating AI will extract ingredients
      const p = document.createElement('p');
      p.textContent = 'Image sent to the workflow for OCR and analysis. The AI response is shown above.';
      resultsList.appendChild(p);
    }

    uncertainty.hidden = false;
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Analyze error', err);
    alert('Error calling the analysis webhook: ' + (err.message || err));
  } finally {
    setLoading(false);
  }
}

function clearAll() {
  document.getElementById('ingredients').value = '';
  document.getElementById('health').selectedIndex = 0;
  document.getElementById('webhook-url').value = '';
  selectedImageBase64 = null;
  const preview = document.getElementById('image-preview');
  preview.innerHTML = '';
  preview.hidden = true;
  document.getElementById('results-list').innerHTML = '';
  document.getElementById('ai-details').hidden = true;
  document.getElementById('uncertainty').hidden = true;
  showEmptyMessage(true);
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    // Keep the full data URL (base64). In practice you may want to strip metadata or upload to storage and send URL.
    selectedImageBase64 = dataUrl;
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    preview.appendChild(img);
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
}

// Hook up UI interactions
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('analyze-btn');
  if (btn) btn.addEventListener('click', analyzeIngredients);

  // Safe fetch wrapper called from the Analyze button
  async function analyzeIngredients() {
    const userInputEl = document.getElementById('userInput');
    const userInput = userInputEl ? userInputEl.value.trim() : (document.getElementById('ingredients')?.value || '').trim();
    const outputEl = document.getElementById('output');

    try {
      const response = await fetch('http://localhost:3001/webhook/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userInput })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Server returned non-JSON response (check /webhook/ingest path)');
      }

      const data = await response.json();
      if (outputEl) outputEl.innerText = data.summaryPlainText || data.summary || JSON.stringify(data, null, 2);

    } catch (err) {
      console.error('UI Error:', err.message);
      if (outputEl) outputEl.innerText = 'Error: ' + (err.message || err);
    }
  }

  const addImage = document.getElementById('add-image-btn');
  const input = document.getElementById('image-input');
  const clear = document.getElementById('clear-btn');

  if (addImage && input) {
    addImage.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) handleImageFile(f);
    });
  }

  if (clear) clear.addEventListener('click', clearAll);
});
