import puppeteer from 'puppeteer';

export async function renderPDF(
  html: string, 
  headerHtml?: string, 
  footerHtml?: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <style>
          #footer { padding: 0 !important; margin: 0 !important; width: 100%; }
          .f-content { font-family: sans-serif; font-size: 8pt; width: 100%; padding: 0 40px; text-align: right; color: #94a3b8; }
        </style>
        <div class="f-content">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>
      `,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
