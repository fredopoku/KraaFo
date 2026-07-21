/**
 * Capture 03 — Single-channel send (Email only).
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

  await page.goto(`${APP_URL}/generator`, { waitUntil: 'networkidle' });
  await pause(3000);

  // Open mobile menu → Documents → Edit
  await page.getByRole('button', { name: 'Menu' }).click();
  await pause(600);
  await page.getByRole('button', { name: /Documents/i }).last().click();
  await pause(800);
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await pause(1500);

  const sendBtn = page.getByRole('button', { name: 'Send' }).last();
  await sendBtn.waitFor({ state: 'visible', timeout: 8000 });
  await pause(600);
  await sendBtn.click();
  await page.waitForTimeout(1000);

  // Fill email only — no phone (single-channel)
  const emailInput = page.getByPlaceholder('client@example.com');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.click();
  await pause(300);
  await page.keyboard.type('abena.mensah@example.com', { delay: 65 });
  await pause(1500); // email pill turns green, WhatsApp + SMS stay grey

  // Scroll to see the individual send buttons
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
  await pause(800);

  // Look for the individual Email send button (below "or send individually")
  const emailOnlyBtn = page.getByRole('button', { name: /email/i }).filter({ hasNotText: /all channels/i }).last();
  if (await emailOnlyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailOnlyBtn.scrollIntoViewIfNeeded();
    await pause(600);
    await emailOnlyBtn.click();
  } else {
    // Fallback to Send via All Channels (email-only state)
    const sendAllBtn = page.getByRole('button', { name: /send via all channels/i });
    await sendAllBtn.scrollIntoViewIfNeeded();
    await pause(600);
    await sendAllBtn.click();
  }

  await page.waitForTimeout(2500);

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '03-single-channel.webm'));
    console.log('✓ 03-single-channel.webm');
  }
})();
