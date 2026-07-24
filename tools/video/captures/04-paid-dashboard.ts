/**
 * Capture 04: Paid/dashboard state.
 * Shows a realistic dashboard with paid and unpaid invoices.
 */
import { chromium } from 'playwright';
import path from 'path';
import { createDemoOrg, seedClient, seedDashboard, APP_URL, pause } from './_setup';

const OUT = path.resolve(__dirname, '../public/footage');

(async () => {
  const ctx  = await createDemoOrg();
  const ctx2 = await seedClient(ctx);
  const ctx3 = await seedDashboard(ctx2);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  await page.addInitScript((token: string) => {
    localStorage.setItem('krafo_token', token);
  }, ctx3.token);

  await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle' });
  await pause(2500); // let charts and KPIs render

  // Scroll down slowly to reveal stats and invoice list
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy({ top: 160, behavior: 'smooth' }));
    await pause(900);
  }

  // Scroll back up
  await pause(800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(1500);

  // Navigate to the invoice list
  const invoicesLink = page.getByRole('link', { name: /invoices/i })
    .or(page.getByRole('button', { name: /invoices/i }))
    .first();
  if (await invoicesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await invoicesLink.click();
    await page.waitForTimeout(1500);
  }

  await pause(2000);

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '04-paid-dashboard.webm'));
    console.log('✓ 04-paid-dashboard.webm');
  }
})();
