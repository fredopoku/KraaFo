/**
 * Capture 01 — Creating an invoice start-to-finish with Smart Fill.
 * Demo data: Sparkle & Shine · Abena Mensah · GHS amounts.
 */
import { chromium } from 'playwright';
import path from 'path';
import { createDemoOrg, seedClient, APP_URL, pause } from './_setup';

const OUT = path.resolve(__dirname, '../public/footage');

(async () => {
  const ctx = await createDemoOrg();
  const ctx2 = await seedClient(ctx);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  // Inject auth token before navigating
  await page.addInitScript((token: string) => {
    localStorage.setItem('krafo_token', token);
  }, ctx2.token);

  await page.goto(`${APP_URL}/generator`, { waitUntil: 'networkidle' });
  await pause(3000); // let org fetch + animations settle

  // ── Client name — type slowly (placeholder is "John Smith") ───────────
  const clientInput = page.getByPlaceholder('John Smith');
  await clientInput.waitFor({ state: 'visible', timeout: 10000 });
  await clientInput.click();
  await pause(600);
  await page.keyboard.type('Abena Mensah', { delay: 90 });
  await pause(800);

  // Pick from autocomplete if it appears
  const suggestion = page.getByText('Abena Mensah').first();
  if (await suggestion.isVisible({ timeout: 1500 }).catch(() => false)) {
    await suggestion.click();
    await pause(600);
  }

  // ── Smart Fill ────────────────────────────────────────────────────────
  const smartFill = page.getByRole('button', { name: /smart fill/i });
  await smartFill.scrollIntoViewIfNeeded();
  await pause(700);
  await smartFill.click();

  // Wait for AI/template suggestions — templates populate almost instantly
  await pause(4000);

  // ── Scroll down to show line items and live preview ───────────────────
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
  await pause(2000);

  // ── Notes ─────────────────────────────────────────────────────────────
  const notesInput = page.getByPlaceholder('A note for your client...');
  if (await notesInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await notesInput.click();
    await pause(300);
    await page.keyboard.type('Thank you for choosing Sparkle & Shine!', { delay: 45 });
    await pause(700);
  }

  // ── Save — scroll back up to reach the Save button ───────────────────
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(800);
  const saveBtn = page.getByRole('button', { name: 'Save' }).first();
  await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
  await pause(500);
  await saveBtn.click();
  await page.waitForTimeout(2500); // save + toast animation

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '01-create-invoice.webm'));
    console.log('✓ 01-create-invoice.webm');
  }
})();
