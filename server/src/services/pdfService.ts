import puppeteer from 'puppeteer';
import { generateInvoiceHTML, InvoiceTemplateData } from '../templates/invoiceTemplate';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--single-process',
];
const PAGE_WIDTH_PX = 794; // 210mm at 96dpi

export async function generatePDF(data: InvoiceTemplateData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: LAUNCH_ARGS,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: PAGE_WIDTH_PX, height: 10000, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });

    // Measure in print media mode — same context Puppeteer uses for page.pdf().
    // We force a synchronous layout flush inside evaluate() so the measurement
    // reflects the post-print-mode reflow before we read any dimensions.
    await page.emulateMediaType('print');
    const contentHeight = await page.evaluate(() => {
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      const wrapper = document.body.firstElementChild as HTMLElement;
      if (!wrapper) return document.body.scrollHeight;
      // Force layout flush
      void wrapper.offsetHeight;
      return Math.max(
        Math.ceil(wrapper.getBoundingClientRect().height),
        wrapper.scrollHeight,
        wrapper.offsetHeight,
      );
    });

    // Add a small buffer — print-mode rendering can add a few px vs the JS
    // measurement, causing a blank second page if the buffer is zero.
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
