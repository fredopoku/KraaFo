/**
 * Render a video config to MP4.
 * Usage:  npx tsx scripts/render.ts <config-id>
 * Example: npx tsx scripts/render.ts invoice-60s
 *
 * Config IDs: invoice-60s | send-all-channels | send-modal-closeup
 */
import path from 'path';
import fs from 'fs';

async function main() {
  const configId = process.argv[2];
  if (!configId) {
    console.error('Usage: npx tsx scripts/render.ts <config-id>');
    console.error('IDs:   invoice-60s | send-all-channels | send-modal-closeup');
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${configId}.mp4`);

  console.log(`🎬 Rendering ${configId} → out/${configId}.mp4`);

  // Dynamic imports — Remotion ESM packages
  const { bundle } = await import('@remotion/bundler');
  const { renderMedia, selectComposition } = await import('@remotion/renderer');

  const entryPoint = path.resolve(__dirname, '../src/index.tsx');

  console.log('  Bundling compositions…');
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log('  Selecting composition…');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: configId,
  });

  console.log(`  Rendering ${composition.durationInFrames} frames @ ${composition.fps}fps…`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outFile,
    crf: 20,
    concurrency: 4,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%   `);
    },
  });

  console.log(`\n✓  Rendered → out/${configId}.mp4`);
  console.log(`   ${(fs.statSync(outFile).size / 1_000_000).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error('Render failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
