// The PDF renderer must treat user text as text: no script, no outbound
// requests, no markup. Needs a local Chrome/Chromium; skipped without one.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { SERVER_DIR } = require('./helpers');

const CHROME = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => p && fs.existsSync(p));
if (CHROME) process.env.PUPPETEER_EXECUTABLE_PATH = CHROME;

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PORT = 4545;
const T = `http://127.0.0.1:${PORT}`;
const hits = [];
let trap;

function doc(overrides) {
  return {
    type: 'invoice', number: 'INV-1', issue_date: '2026-11-19', due_date: '2026-12-19', status: 'sent',
    org: { name: 'Acme', primary_color: '#2563EB', secondary_color: '#1E40AF', accent_color: '#DBEAFE', tax_name: 'VAT', currency_symbol: '$', logo_base64: PNG_1PX },
    client: { name: 'Client' },
    items: [{ description: 'Work', quantity: 1, unit: 'hour', unit_price: 10, amount: 10 }],
    subtotal: 10, discount_type: 'none', discount_value: 0, discount_amount: 0, tax_rate: 0, tax_amount: 0,
    total: 10, amount_paid: 0, balance_due: 10,
    ...overrides,
  };
}

before(() => new Promise(r => { trap = http.createServer((req, res) => { hits.push(req.url); res.end('x'); }).listen(PORT, r); }));
after(() => new Promise(r => trap.close(r)));

test('hostile document content stays inert', { skip: !CHROME && 'no Chrome/Chromium found' }, async () => {
  const { generatePDF } = require(path.join(SERVER_DIR, 'dist/services/pdfService.js'));
  const pdfParse = require('pdf-parse');

  const normal = await generatePDF(doc({}));
  assert.equal(normal.subarray(0, 4).toString(), '%PDF');

  const evil = await generatePDF(doc({
    client: { name: `<img src="${T}/img">Evil Co`, company: `<iframe src="${T}/iframe"></iframe>` },
    notes: `<script>fetch('${T}/script')</script>Line one\nLine two`,
    terms: `<link rel="stylesheet" href="${T}/css"><meta http-equiv="refresh" content="0;url=${T}/refresh">`,
    items: [{ description: `<object data="${T}/object"></object>Design`, quantity: 1, unit: 'h', unit_price: 5, amount: 5 }],
    org: { ...doc({}).org, name: `Acme<style>@import url(${T}/import);</style>`, primary_color: `red;background:url(${T}/color)`, logo_base64: `${T}/logo`, signature_url: `${T}/sig` },
  }));
  await new Promise(r => setTimeout(r, 500));
  assert.deepEqual(hits, [], 'renderer made outbound requests');

  const text = (await pdfParse(evil)).text;
  assert.ok(text.includes('<script>'), 'markup is printed as text');
  assert.match(text, /Evil\s*Co/);
  assert.match(text, /one\s*\n\s*Line two/, 'line breaks in notes are kept');
});
