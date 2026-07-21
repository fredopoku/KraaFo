/**
 * Run all 5 Playwright capture scripts sequentially.
 * Requires the KraaFo dev server to be running:
 *   npm run dev   (from repo root)
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const FOOTAGE_DIR = path.resolve(__dirname, '../public/footage');
if (!fs.existsSync(FOOTAGE_DIR)) fs.mkdirSync(FOOTAGE_DIR, { recursive: true });

const captures = [
  '01-create-invoice',
  '02-send-modal',
  '03-single-channel',
  '04-paid-dashboard',
  '05-landing-story',
];

console.log('🎬 Starting KraaFo UI captures…\n');
console.log('Make sure the dev server is running: npm run dev\n');

for (const name of captures) {
  const script = path.resolve(__dirname, `../captures/${name}.ts`);
  console.log(`▶  ${name}…`);
  try {
    execSync(`npx tsx "${script}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log(`✓  ${name} done\n`);
  } catch (err) {
    console.error(`✗  ${name} failed — check that the dev server is running and retry\n`);
    process.exit(1);
  }
}

console.log('🎉 All captures complete. Footage saved to public/footage/');
console.log('Run: npx tsx scripts/render.ts <config-id>');
