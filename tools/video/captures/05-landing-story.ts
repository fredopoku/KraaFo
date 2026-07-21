/**
 * Capture 05 — Landing page: story player + hero crossfade.
 * No auth needed — public page.
 */
import { chromium } from 'playwright';
import path from 'path';
import { APP_URL, pause } from './_setup';

const OUT = path.resolve(__dirname, '../public/footage');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await pause(2500); // let hero crossfade and blob animations start

  // Watch the hero crossfade for two full cycles (~6s each)
  await pause(6000);

  // Scroll down gently to reveal the story player section
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'smooth' }));
  await pause(1500);

  // Interact with the story player — click next card twice
  const storyNext = page.getByRole('button', { name: /next/i })
    .or(page.locator('[aria-label*="next story"]'))
    .or(page.locator('[aria-label*="Next"]'))
    .first();

  for (let i = 0; i < 3; i++) {
    if (await storyNext.isVisible({ timeout: 1500 }).catch(() => false)) {
      await storyNext.click();
      await pause(2200);
    } else {
      // Tap the right half of the story player to advance
      await page.mouse.click(300, 460);
      await pause(2200);
    }
  }

  // Scroll back up and let the hero run a few more seconds
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(4000);

  const videoPath = await page.video()?.path();
  await browser.close();

  if (videoPath) {
    const fs = await import('fs');
    fs.renameSync(videoPath, path.join(OUT, '05-landing-story.webm'));
    console.log('✓ 05-landing-story.webm');
  }
})();
