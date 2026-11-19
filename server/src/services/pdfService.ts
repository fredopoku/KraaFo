import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { generateInvoiceHTML, InvoiceTemplateData } from '../templates/invoiceTemplate';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--single-process',
];
const PAGE_WIDTH_PX = 794; // 210mm at 96dpi

// The HTML rendered here is built from user-supplied data. It is escaped in
// the templates, but the renderer is locked down as well, so a mistake there
// can't turn into code running on the server or requests made from it:
// - page JavaScript is off (puppeteer's own evaluate still works),
// - every network request is refused except inline data: URLs (logos,
//   signatures and QR codes are all embedded as data URLs),
// - rendering is time-boxed.
async function lockDownPage(page: import('puppeteer-core').Page): Promise<void> {
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith('data:') || url === 'about:blank') req.continue().catch(() => {});
    else req.abort('blockedbyclient').catch(() => {});
  });
  page.setDefaultTimeout(20000);
}

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || await chromium.executablePath();
  const browser = await puppeteer.launch({ headless: true, args: [...chromium.args, ...LAUNCH_ARGS], executablePath });
  const page = await browser.newPage();
  try {
    await lockDownPage(page);
    await page.setViewport({ width: PAGE_WIDTH_PX, height: 10000, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('print');
    const contentHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.body.offsetHeight));
    const pdf = await page.pdf({ width: `${PAGE_WIDTH_PX}px`, height: `${contentHeight + 20}px`, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export async function generatePDF(data: InvoiceTemplateData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || await chromium.executablePath();

  const browser = await puppeteer.launch({
    headless: true,
    args: [...chromium.args, ...LAUNCH_ARGS],
    executablePath,
  });

  const page = await browser.newPage();
  try {
    await lockDownPage(page);
    await page.setViewport({ width: PAGE_WIDTH_PX, height: 10000, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });

    await page.emulateMediaType('print');
    const contentHeight = await page.evaluate(() => {
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      const wrapper = document.body.firstElementChild as HTMLElement;
      if (!wrapper) return document.body.scrollHeight;
      void wrapper.offsetHeight;
      return Math.max(
        Math.ceil(wrapper.getBoundingClientRect().height),
        wrapper.scrollHeight,
        wrapper.offsetHeight,
      );
    });

    const pdfHeight = contentHeight + 20;

    const pdf = await page.pdf({
      width: `${PAGE_WIDTH_PX}px`,
      height: `${pdfHeight}px`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
