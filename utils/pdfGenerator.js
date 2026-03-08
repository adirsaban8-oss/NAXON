const puppeteer = require('puppeteer-core');

function generateQuoteId() {
  return 'NX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function hebrewDate() {
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const d = new Date();
  return `${d.getDate()} ב${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildHTML(services) {
  const pricedServices = services.filter(s => !s.customPrice);
  const customServices = services.filter(s => s.customPrice);
  const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
  const beforeVat = Math.round(total / 1.18);
  const vat = total - beforeVat;
  const quoteId = generateQuoteId();
  const date = hebrewDate();
  const suffix = customServices.length ? '+' : '';

  const serviceRows = services.map((s, i) => `
    <tr class="${i % 2 === 0 ? 'even' : ''}">
      <td class="num">${i + 1}</td>
      <td class="svc-name">
        <strong>${s.nameHe || s.name}</strong>
        <span class="en-name">${s.name}</span>
      </td>
      <td class="price">${s.customPrice ? '<span class="custom">בהתאמה אישית</span>' : `₪${s.price.toLocaleString()}`}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Heebo', sans-serif; color: #1e293b; background: #fff; }
  .en { font-family: 'Inter', sans-serif; direction: ltr; display: inline-block; }

  /* Header */
  .header {
    background: linear-gradient(135deg, #020617, #0f172a);
    padding: 32px 40px 28px;
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00a6ff, #38bdf8, #00a6ff);
  }
  .logo { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 800; color: #00a6ff; letter-spacing: 1px; }
  .subtitle { font-size: 11px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; }
  .doc-title { font-size: 20px; font-weight: 700; color: #fff; margin-top: 14px; }

  /* Info bar */
  .info-bar {
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin: 24px 40px 0;
    padding: 12px 20px;
    font-size: 11px;
    color: #64748b;
  }

  /* Content */
  .content { padding: 24px 40px; }
  .section-title { font-size: 16px; font-weight: 700; color: #020617; margin-bottom: 16px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  thead { background: #020617; }
  thead th { color: #fff; font-size: 10px; font-weight: 600; padding: 10px 14px; text-align: right; letter-spacing: 0.5px; }
  thead th.price-col { text-align: left; }
  tbody td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  tr.even td { background: #f8fafc; }
  .num { color: #94a3b8; width: 30px; text-align: center; }
  .svc-name strong { display: block; font-size: 13px; }
  .en-name { font-family: 'Inter', sans-serif; direction: ltr; font-size: 10px; color: #94a3b8; }
  .price { text-align: left; font-family: 'Inter', sans-serif; font-weight: 600; white-space: nowrap; direction: ltr; }
  .custom { color: #00a6ff; font-family: 'Heebo', sans-serif; font-size: 11px; font-weight: 500; }

  /* Totals */
  .totals { margin-top: 20px; display: flex; justify-content: flex-start; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
  .totals-row .val { font-family: 'Inter', sans-serif; direction: ltr; }
  .total-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #020617, #0f172a);
    border-radius: 8px;
    padding: 14px 18px;
    margin-top: 8px;
  }
  .total-main .label { color: #fff; font-size: 14px; font-weight: 700; }
  .total-main .amount { font-family: 'Inter', sans-serif; direction: ltr; color: #00a6ff; font-size: 18px; font-weight: 800; }
  .note { font-size: 9px; color: #94a3b8; margin-top: 8px; }
  .custom-note { font-size: 10px; color: #94a3b8; margin-top: 6px; }

  /* Footer */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 14px 40px;
    text-align: center;
  }
  .footer p { font-size: 9px; color: #64748b; margin-bottom: 4px; }
  .footer .brand { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #00a6ff; margin-top: 6px; }
  .footer .brand-sub { font-size: 8px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">NAXON MOBILE</div>
    <div class="subtitle">פתרונות דיגיטליים חכמים &nbsp;•&nbsp; אתרים &nbsp;•&nbsp; AI &nbsp;•&nbsp; אוטומציה</div>
    <div class="doc-title">הצעת מחיר</div>
  </div>

  <div class="info-bar">
    <span>מספר הצעה: <strong class="en">${quoteId}</strong></span>
    <span>תאריך: <strong>${date}</strong></span>
    <span>${services.length} שירותים נבחרו</span>
  </div>

  <div class="content">
    <div class="section-title">שירותים שנבחרו</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>שירות</th>
          <th class="price-col">מחיר</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>לפני מע״מ</span>
          <span class="val">₪${beforeVat.toLocaleString()}</span>
        </div>
        <div class="totals-row">
          <span>מע״מ (18%)</span>
          <span class="val">₪${vat.toLocaleString()}</span>
        </div>
        <div class="total-main">
          <span class="label">סה״כ כולל מע״מ</span>
          <span class="amount">₪${total.toLocaleString()}${suffix}</span>
        </div>
        ${customServices.length ? `<div class="custom-note">* ${customServices.map(s => s.nameHe || s.name).join(', ')} — תמחור בהתאמה אישית</div>` : ''}
        <div class="note">כל המחירים כוללים מע״מ 18%</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>זמן אספקה משוער: 5–7 ימי עסקים מאישור הפרויקט &nbsp;|&nbsp; הצעה זו בתוקף ל־30 יום</p>
    <div class="brand">NAXON MOBILE</div>
    <div class="brand-sub">פתרונות דיגיטליים חכמים</div>
  </div>
</body>
</html>`;
}

async function generateQuotePDF(services) {
  const html = buildHTML(services);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await browser.close();
  return pdf;
}

module.exports = { generateQuotePDF };
