/**
 * Capture 06: Full product demo (flagship social video).
 * One continuous recording: landing → setup → invoice → send → dashboard.
 *
 * Approach:
 *  - Org + client + invoice are seeded via API before recording starts.
 *  - Token is injected so Setup renders in edit mode (pre-filled, reliable).
 *  - Invoice is loaded via mobile menu Documents → Edit (known reliable flow).
 *  - Smart Fill refreshes the items; Send proceeds on the already-saved invoice.
 *
 * Section timings (approximate):
 *   0–9s   Landing hero + How it works scroll
 *   9–19s  Setup page: steps 1 + 2 with pre-filled business data
 *  19–45s  Invoice generator: load via menu, Smart Fill, scroll items
 *  45–58s  Send modal: email + phone + Send via All Channels
 *  58–68s  Dashboard: revenue cards, invoice list
 */
import { chromium } from 'playwright';
import path from 'path';
import { createDemoOrg, seedClient, seedInvoice, APP_URL, pause } from './_setup';

const OUT = path.resolve(__dirname, '../public/footage');

(async () => {
  // Seed everything via API before recording starts
  const ctx  = await createDemoOrg();
  const ctx2 = await seedClient(ctx);
  const ctx3 = await seedInvoice(ctx2);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  // Token injected into every page the browser navigates to
  await page.addInitScript((token: string) => {
    localStorage.setItem('krafo_token', token);
  }, ctx3.token);

  // ── SECTION 1: Landing page (0–9s) ──────────────────────────────────────
  // Landing is a public page: renders normally with or without a token.
  await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
  await pause(3000); // hero crossfade plays
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'smooth' }));
  await pause(2800); // "How it works" stepper visible
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(2500); // settle on hero

  // ── SECTION 2: Setup / Settings (9–19s) ─────────────────────────────────
  // With the token injected, /setup loads in edit mode: all fields pre-filled
  // with the demo org's data: shows a complete, configured business.
  await page.goto(`${APP_URL}/setup`, { waitUntil: 'networkidle' });
  await pause(1500); // Step 1 (Company Info) with name + email pre-filled

  // Scroll down so viewer sees the populated address / phone fields
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'smooth' }));
  await pause(1800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(600);

  // Advance to Step 2: Branding (color swatches + invoice preview look great)
  const continueBtn = page.getByRole('button', { name: /continue/i });
  await continueBtn.scrollIntoViewIfNeeded();
  await continueBtn.click();
  await pause(2500); // Step 2: indigo brand colors + preview tile visible

  // Navigate directly to generator (skip finishing the wizard)
  await page.goto(`${APP_URL}/generator`, { waitUntil: 'networkidle' });

  // ── SECTION 3: Invoice generator (19–45s) ───────────────────────────────
  await pause(2000); // generator settles, org data loads

  // Load the seeded invoice via mobile menu → Documents → Edit
  await page.getByRole('button', { name: 'Menu' }).click();
  await pause(600);
  await page.getByRole('button', { name: /Documents/i }).last().click();
  await pause(800);
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await pause(1800); // invoice loads: client name + line items populate the form

  // Scroll down to show the line items + live PDF preview
  await page.evaluate(() => window.scrollBy({ top: 340, behavior: 'smooth' }));
  await pause(2500); // viewer reads the line items

  // Scroll back to top and trigger Smart Fill
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(800);

  const smartFill = page.getByRole('button', { name: /smart fill/i });
  await smartFill.scrollIntoViewIfNeeded();
  await pause(500);
  await smartFill.click(); // AI rewrites items: dramatic 4 s pause
  await pause(4000);

  // Scroll down again so viewer sees the refreshed items
  await page.evaluate(() => window.scrollBy({ top: 340, behavior: 'smooth' }));
  await pause(2200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(800);

  // ── SECTION 4: Send modal (45–58s) ──────────────────────────────────────
  // The invoice is already saved (seeded via API); Send works immediately.
  const sendBtn = page.getByRole('button', { name: 'Send' }).last();
  await sendBtn.waitFor({ state: 'visible', timeout: 6000 });
  await pause(500);
  await sendBtn.click();
  await page.waitForTimeout(1000); // modal opens with channel pills

  const emailInput = page.getByPlaceholder('client@example.com');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.click();
  await pause(300);
  await page.keyboard.type('abena.mensah@example.com', { delay: 65 });
  await pause(900); // email pill turns green

  const phoneInput = page.getByPlaceholder('+233 20 000 0000');
  await phoneInput.waitFor({ state: 'visible', timeout: 3000 });
  await phoneInput.click();
  await pause(300);
  await page.keyboard.type('+233241234567', { delay: 70 });
  await pause(1300); // WhatsApp + SMS pills turn green: all three lit up

  const sendAllBtn = page.getByRole('button', { name: /send via all channels/i });
  await sendAllBtn.scrollIntoViewIfNeeded();
  await pause(700);
  await sendAllBtn.click();
  await page.waitForTimeout(2500); // success toast / confirmation state

  // ── SECTION 5: Dashboard (58–68s) ───────────────────────────────────────
  await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle' });
  await pause(2000); // revenue summary cards render
  await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'smooth' }));
  await pause(3000); // viewer reads revenue stats + invoice list
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(2500); // wide shot of the dashboard header

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '06-full-demo.webm'));
    console.log('✓ 06-full-demo.webm');
  }
})();
