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
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: !!(headerHtml || footerHtml),
      headerTemplate: headerHtml ? `
        <style>
          #header { padding: 0 !important; margin: 0 !important; width: 100%; }
          .h-content { font-family: sans-serif; font-size: 9pt; width: 100%; padding: 0 40px; }
        </style>
        <div class="h-content">${headerHtml}</div>
      ` : '<div></div>',
      footerTemplate: footerHtml ? `
        <style>
          #footer { padding: 0 !important; margin: 0 !important; width: 100%; }
          .f-content { font-family: sans-serif; font-size: 8pt; width: 100%; padding: 0 40px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
        <div class="f-content">
          <span>${footerHtml}</span>
          <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
        </div>
      ` : `
        <style>
          #footer { padding: 0 !important; margin: 0 !important; width: 100%; }
          .f-content { font-family: sans-serif; font-size: 8pt; width: 100%; padding: 0 40px; text-align: right; color: #94a3b8; }
        </style>
        <div class="f-content">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>
      `,
      margin: {
        top: headerHtml ? '45mm' : '20mm',
        right: '15mm',
        bottom: footerHtml ? '35mm' : '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
