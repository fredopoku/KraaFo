'use strict';

// Post-build pre-renderer — converts the React SPA shell into static HTML
// for the public routes that matter most for SEO.
//
// Chrome resolution: uses @sparticuz/chromium (bundled binary — no system
// Chrome required, same mechanism as pdfService.ts). Falls back to system
// Chrome paths for local dev.
//
// Exits 1 (fails the build) if Chrome cannot be found or any route fails
// to produce ≥300 words of body text — silent failure is not allowed.

const puppeteer = require('../server/node_modules/puppeteer-core');
const { createServer } = require('http');
const { createReadStream, existsSync, mkdirSync, writeFileSync } = require('fs');
const { resolve, join, extname } = require('path');

const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'client/dist');
const PORT = 3098;

// required: true  → build fails if word count < minWords or if render throws
// required: false → best-effort; warns but does not fail the build
const ROUTES = [
  { route: '/',                   out: 'index.html',                    wait: 6000, canonical: 'https://kraafo.com/',                   required: true,  minWords: 300 },
  { route: '/generator',          out: 'generator/index.html',          wait: 5000, canonical: 'https://kraafo.com/generator',           required: false, minWords: 100 },
  { route: '/changelog',          out: 'changelog/index.html',          wait: 3000, canonical: 'https://kraafo.com/changelog',           required: false, minWords: 50  },
  { route: '/invoice-generator',  out: 'invoice-generator/index.html',  wait: 4000, canonical: 'https://kraafo.com/invoice-generator',   required: false, minWords: 100 },
  { route: '/receipt-generator',  out: 'receipt-generator/index.html',  wait: 4000, canonical: 'https://kraafo.com/receipt-generator',   required: false, minWords: 100 },
  { route: '/quote-generator',    out: 'quote-generator/index.html',    wait: 4000, canonical: 'https://kraafo.com/quote-generator',     required: false, minWords: 100 },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.txt':  'text/plain',
  '.xml':  'text/xml',
};

// Resolve Chrome. Priority order:
//   1. PUPPETEER_EXECUTABLE_PATH (explicit override)
//   2. System Chrome paths (macOS dev, Render runtime which has Chrome installed)
//   3. @sparticuz/chromium bundled binary (Linux-only — Render build workers where system Chrome is absent)
async function getChromePath() {
  const fs = require('fs');

  // 1. Explicit override
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    try {
      fs.accessSync(process.env.PUPPETEER_EXECUTABLE_PATH, fs.constants.X_OK);
      console.log(`[prerender] Chrome via PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      return { path: process.env.PUPPETEER_EXECUTABLE_PATH, args: [] };
    } catch {
      console.warn(`[prerender] PUPPETEER_EXECUTABLE_PATH not executable — falling through`);
    }
  }

  // 2. System paths (works on macOS dev and Render runtime containers)
  const systemPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of systemPaths) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      console.log(`[prerender] Chrome via system path: ${p}`);
      return { path: p, args: [] };
    } catch {}
  }

  // 3. @sparticuz/chromium — Linux-only bundled binary.
  // Used on Render build workers (no system Chrome, but the package is installed).
  // Dynamic import needed because the package is pure ESM.
  if (process.platform === 'linux') {
    try {
      const chromiumMod = await import('../server/node_modules/@sparticuz/chromium/build/index.js');
      const chromium = chromiumMod.default ?? chromiumMod;
      const path = await chromium.executablePath();
      console.log(`[prerender] Chrome via @sparticuz/chromium: ${path}`);
      return { path, args: chromium.args ?? [] };
    } catch (err) {
      console.warn(`[prerender] @sparticuz/chromium failed: ${err.message}`);
    }
  }

  return null;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath);
      if (!extname(filePath) || !existsSync(filePath)) {
        filePath = join(DIST, 'index.html');
      }
      const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      createReadStream(filePath)
        .on('error', () => { res.statusCode = 404; res.end(); })
        .pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

// Strip HTML tags and count whitespace-separated words.
function countWords(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

// Ensure the canonical <link> in <head> points to the correct route URL.
function fixCanonical(html, canonicalUrl) {
  // Replace existing canonical href
  const updated = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"/i,
    `<link rel="canonical" href="${canonicalUrl}"`
  );
  // If no canonical tag existed, inject one before </head>
  if (updated === html && !html.includes('rel="canonical"')) {
    return html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
  }
  return updated;
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('[prerender] client/dist not found — run client build first');
    process.exit(1);
  }

  const chrome = await getChromePath();
  if (!chrome) {
    console.error('[prerender] No Chrome/Chromium found — cannot pre-render.');
    console.error('[prerender] Ensure @sparticuz/chromium is installed in server/node_modules, or set PUPPETEER_EXECUTABLE_PATH.');
    process.exit(1);
  }

  const server = await startStaticServer();
  console.log(`[prerender] Static server on :${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chrome.path,
    headless: true,
    args: [
      ...chrome.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });

  let ok = 0;
  const hardFailures = [];

  for (const { route, out, wait, canonical, required, minWords } of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route}`;
    const outPath = join(DIST, out);
    console.log(`[prerender] Rendering ${route} (${required ? 'required' : 'optional'}) …`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, wait));

      let html = await page.content();
      html = fixCanonical(html, canonical);

      const words = countWords(html);
      if (words < minWords) {
        throw new Error(`only ${words} words in output — React may not have rendered (min: ${minWords})`);
      }

      mkdirSync(outPath.replace(/\/[^/]+$/, ''), { recursive: true });
      writeFileSync(outPath, html, 'utf-8');
      console.log(`[prerender] ✓ ${out} — ${words} words, ${(html.length / 1024).toFixed(0)} KB`);
      ok++;
    } catch (err) {
      if (required) {
        console.error(`[prerender] ✗ ${route} (REQUIRED): ${err.message}`);
        hardFailures.push(route);
      } else {
        console.warn(`[prerender] ⚠ ${route} (optional, skipped): ${err.message}`);
      }
    }

    await page.close();
  }

  await browser.close();
  server.close();

  if (hardFailures.length > 0) {
    console.error(`[prerender] BUILD FAILED — required route(s) did not produce valid output: ${hardFailures.join(', ')}`);
    process.exit(1);
  }

  console.log(`[prerender] Complete — ${ok}/${ROUTES.length} routes pre-rendered (required routes all passed).`);
}

main().catch(err => {
  console.error('[prerender] Fatal:', err.message);
  process.exit(1);
});
