'use strict';

// Post-build pre-renderer — converts the React SPA shell into static HTML
// for the public routes that matter most for SEO.
//
// Runs a tiny static file server against client/dist, launches Chrome,
// and saves fully-rendered HTML back to dist so Google sees real content
// instead of <div id="root"></div>.
//
// Set PUPPETEER_EXECUTABLE_PATH to override Chrome detection.
// If no Chrome is found the script exits 0 (deploy still succeeds).

const puppeteer = require('../server/node_modules/puppeteer-core');
const { createServer } = require('http');
const { createReadStream, existsSync, mkdirSync, writeFileSync } = require('fs');
const { resolve, join, extname } = require('path');

const ROOT  = resolve(__dirname, '..');
const DIST  = resolve(ROOT, 'client/dist');
const PORT  = 3098;

// Routes to pre-render. 'wait' is extra ms after networkidle0 so
// React components that rely on fallback/initial state have time to settle.
const ROUTES = [
  { route: '/',          out: 'index.html',           wait: 5000 },
  { route: '/generator', out: 'generator/index.html', wait: 3000 },
  { route: '/changelog', out: 'changelog/index.html', wait: 2000 },
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

function findChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      require('fs').accessSync(p, require('fs').constants.X_OK);
      return p;
    } catch {}
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

async function main() {
  if (!existsSync(DIST)) {
    console.error('[prerender] client/dist not found — run client build first');
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.warn('[prerender] No Chrome/Chromium found — skipping pre-render.');
    console.warn('[prerender] Set PUPPETEER_EXECUTABLE_PATH to enable it in CI.');
    return;
  }
  console.log(`[prerender] Chrome: ${chrome}`);

  const server = await startStaticServer();
  console.log(`[prerender] Static server on :${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  let ok = 0;
  for (const { route, out, wait } of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route}`;
    const outPath = join(DIST, out);
    console.log(`[prerender] ${route} …`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
      await new Promise(r => setTimeout(r, wait));

      const html = await page.content();
      mkdirSync(outPath.replace(/\/[^/]+$/, ''), { recursive: true });
      writeFileSync(outPath, html, 'utf-8');
      console.log(`[prerender] ✓ ${out} (${(html.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.warn(`[prerender] ✗ ${route}: ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`[prerender] complete — ${ok}/${ROUTES.length} routes pre-rendered`);
}

main().catch(err => {
  // Non-zero exit would abort the Render deploy; pre-render is optional.
  console.error('[prerender] fatal:', err.message);
});
