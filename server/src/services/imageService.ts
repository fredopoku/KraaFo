import Vibrant from 'node-vibrant';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function darken(hex: string, amount = 20): string {
  const [h, s, l] = hexToHsl(hex);
  const newL = Math.max(0, l - amount);
  return hslToHex(h, s, newL);
}

function lighten(hex: string, amount = 40): string {
  const [h, s, l] = hexToHsl(hex);
  const newL = Math.min(100, l + amount);
  return hslToHex(h, s, newL);
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360, sNorm = s / 100, lNorm = l / 100;
  let r, g, b;
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export async function extractBrandColors(imagePath: string): Promise<BrandColors> {
  try {
    const palette = await Vibrant.from(imagePath).getPalette();
    const dominant = palette.Vibrant?.hex || palette.DarkVibrant?.hex || palette.Muted?.hex || '#2563EB';
    return {
      primary: dominant,
      secondary: darken(dominant, 15),
      accent: lighten(dominant, 35),
      text: '#1F2937',
    };
  } catch {
    return { primary: '#2563EB', secondary: '#1E40AF', accent: '#DBEAFE', text: '#1F2937' };
  }
}

export async function processLogo(inputPath: string, outputDir: string, filename: string): Promise<string> {
  const outputPath = path.join(outputDir, `thumb_${filename}`);
  await sharp(inputPath)
    .resize(300, 120, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toFile(outputPath);
  return outputPath;
}

async function renderPdfWithPuppeteer(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1100 });
      const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      // waitUntil load is enough; PDF.js fires load when it renders
      await page.goto(dataUrl, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      // Extra pause for PDF renderer to finish painting
      await new Promise(r => setTimeout(r, 1500));
      const shot = await page.screenshot({ type: 'png', fullPage: false });
      return Buffer.from(shot);
    } finally {
      await browser.close().catch(() => {});
    }
  } catch {
    return null;
  }
}

export async function renderPdfPageToImage(pdfBuffer: Buffer): Promise<Buffer | null> {
  // Try sharp's native PDF rasterisation (requires libvips + Poppler)
  try {
    const result = await sharp(pdfBuffer, { page: 0, density: 150 }).png().toBuffer();
    if (result && result.length > 5000) return result;
  } catch {}
  // Fallback: render via Puppeteer (headless Chrome has a built-in PDF viewer)
  return renderPdfWithPuppeteer(pdfBuffer);
}


export function getLogoBase64(logoPath: string): string | null {
  try {
    if (!logoPath || !fs.existsSync(logoPath)) return null;
    const data = fs.readFileSync(logoPath);
    const ext = path.extname(logoPath).toLowerCase().replace('.', '');
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}
