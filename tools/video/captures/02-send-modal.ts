/**
 * Capture 02: Send modal: fields filling, status pills going green, Send via All Channels.
 * Starts with a pre-seeded invoice so the Save step is already done.
 */
import { chromium } from 'playwright';
import path from 'path';
import { createDemoOrg, seedClient, seedInvoice, APP_URL, pause } from './_setup';

const OUT = path.resolve(__dirname, '../public/footage');

(async () => {
  const ctx  = await createDemoOrg();
  const ctx2 = await seedClient(ctx);
  const ctx3 = await seedInvoice(ctx2);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  await page.addInitScript((token: string) => {
    localStorage.setItem('krafo_token', token);
  }, ctx3.token);

  // Load the generator, then navigate to the seeded invoice via mobile menu
  await page.goto(`${APP_URL}/generator`, { waitUntil: 'networkidle' });
  await pause(3000);

  // ── Open mobile menu ──────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Menu' }).click();
  await pause(600);

  // ── Tap "Documents" ───────────────────────────────────────────────────
  await page.getByRole('button', { name: /Documents/i }).last().click();
  await pause(800);

  // ── Tap "Edit" on our seeded invoice ──────────────────────────────────
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await pause(1500); // invoice loads into form

  // ── Open send modal ───────────────────────────────────────────────────
  const sendBtn = page.getByRole('button', { name: 'Send' }).last();
  await sendBtn.waitFor({ state: 'visible', timeout: 8000 });
  await pause(600);
  await sendBtn.click();
  await page.waitForTimeout(1000);

  // ── Fill email field (placeholder: "client@example.com") ─────────────
  const emailInput = page.getByPlaceholder('client@example.com');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.click();
  await pause(400);
  await emailInput.fill('');
  await pause(300);
  await page.keyboard.type('abena.mensah@example.com', { delay: 65 });
  await pause(900); // status pill turns green

  // ── Fill phone field (placeholder: "+233 20 000 0000") ───────────────
  const phoneInput = page.getByPlaceholder('+233 20 000 0000');
  await phoneInput.waitFor({ state: 'visible', timeout: 3000 });
  await phoneInput.click();
  await pause(300);
  await page.keyboard.type('+233241234567', { delay: 70 });
  await pause(1200); // both WhatsApp + SMS pills turn green

  // ── Pause: viewer reads the green pill state ─────────────────────────
  await pause(1200);

  // ── Tap Send via All Channels ─────────────────────────────────────────
  const sendAllBtn = page.getByRole('button', { name: /send via all channels/i });
  await sendAllBtn.scrollIntoViewIfNeeded();
  await pause(700);
  await sendAllBtn.click();

  // Wait for success state / toast
  await page.waitForTimeout(3000);

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '02-send-modal.webm'));
    console.log('✓ 02-send-modal.webm');
  }
})();
