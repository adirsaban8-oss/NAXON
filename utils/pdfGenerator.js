const PDFDocument = require('pdfkit');
const path = require('path');

const FONT_REGULAR = 'C:/Windows/Fonts/arial.ttf';
const FONT_BOLD = 'C:/Windows/Fonts/arialbd.ttf';

function generateQuoteId() {
  return 'NX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function hebrewDate() {
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function generateQuotePDF(services) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.registerFont('Hebrew', FONT_REGULAR);
      doc.registerFont('Hebrew-Bold', FONT_BOLD);

      const pricedServices = services.filter(s => !s.customPrice);
      const customServices = services.filter(s => s.customPrice);
      const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
      const beforeVat = Math.round(total / 1.18);
      const vat = total - beforeVat;
      const quoteId = generateQuoteId();
      const date = hebrewDate();

      // ── Header ──
      doc.rect(0, 0, 595, 140).fill('#020617');
      doc.rect(0, 140, 595, 3).fill('#00a6ff');

      // Logo
      doc.fontSize(32).font('Hebrew-Bold').fillColor('#00a6ff').text('NAXON MOBILE', 50, 30, { width: 495, align: 'center' });
      doc.fontSize(10).font('Hebrew').fillColor('#94a3b8').text('פתרונות דיגיטליים חכמים  •  אתרים  •  AI  •  אוטומציה', 50, 70, { width: 495, align: 'center' });

      // Title
      doc.fontSize(18).font('Hebrew-Bold').fillColor('#ffffff').text('הצעת מחיר', 50, 100, { width: 495, align: 'center' });

      // ── Quote info ──
      doc.fillColor('#475569').fontSize(10).font('Hebrew');
      doc.text(`${quoteId} :מספר הצעה`, 50, 160, { width: 495, align: 'right' });
      doc.text(`${date} :תאריך`, 50, 175, { width: 495, align: 'right' });
      doc.text(`${services.length} שירותים נבחרו`, 50, 190, { width: 495, align: 'right' });

      // Divider
      doc.moveTo(50, 212).lineTo(545, 212).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // ── Services ──
      let y = 230;
      doc.fontSize(14).font('Hebrew-Bold').fillColor('#020617').text('שירותים שנבחרו', 50, y, { width: 495, align: 'right' });
      y += 32;

      // Table header
      doc.rect(50, y, 495, 30).fill('#f1f5f9');
      doc.fontSize(9).font('Hebrew-Bold').fillColor('#64748b');
      doc.text('מחיר', 60, y + 10, { width: 80 });
      doc.text('שירות', 300, y + 10, { width: 235, align: 'right' });
      doc.text('#', 510, y + 10, { width: 25, align: 'right' });
      y += 40;

      // Service rows
      doc.font('Hebrew').fontSize(10);
      services.forEach((service, i) => {
        if (i % 2 === 0) {
          doc.rect(50, y - 6, 495, 26).fill('#f8fafc');
        }
        doc.fillColor('#94a3b8').text(`${i + 1}`, 510, y, { width: 25, align: 'right' });
        doc.fillColor('#1e293b').text(service.nameHe || service.name, 140, y, { width: 395, align: 'right' });
        if (service.customPrice) {
          doc.fillColor('#00a6ff').fontSize(9).text('בהתאמה אישית', 60, y, { width: 80 });
          doc.fontSize(10);
        } else {
          doc.fillColor('#475569').text(`₪${service.price.toLocaleString()}`, 60, y, { width: 80 });
        }
        y += 26;
      });

      // ── Totals ──
      y += 16;
      doc.moveTo(50, y).lineTo(250, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      y += 12;

      // Before VAT
      doc.fontSize(10).font('Hebrew').fillColor('#475569');
      doc.text(`₪${beforeVat.toLocaleString()}`, 60, y, { width: 80 });
      doc.text(':לפני מע״מ', 140, y, { width: 110, align: 'right' });
      y += 20;

      // VAT
      doc.text(`₪${vat.toLocaleString()}`, 60, y, { width: 80 });
      doc.text(':(18%) מע״מ', 140, y, { width: 110, align: 'right' });
      y += 24;

      // Total line
      doc.moveTo(50, y).lineTo(250, y).strokeColor('#00a6ff').lineWidth(2).stroke();
      y += 14;

      const suffix = customServices.length ? '+' : '';
      doc.fontSize(14).font('Hebrew-Bold').fillColor('#020617');
      doc.text(`₪${total.toLocaleString()}${suffix}`, 55, y, { width: 85 });
      doc.text(':סה״כ כולל מע״מ', 140, y, { width: 130, align: 'right' });
      y += 26;

      if (customServices.length) {
        doc.fontSize(9).font('Hebrew').fillColor('#94a3b8');
        doc.text(`* ${customServices.map(s => s.nameHe || s.name).join(', ')} — תמחור בהתאמה אישית`, 50, y, { width: 495, align: 'right' });
        y += 16;
      }

      doc.fontSize(8).font('Hebrew').fillColor('#cbd5e1');
      doc.text('כל המחירים כוללים מע״מ 18%', 50, y, { width: 200 });

      // ── Footer ──
      const footerY = 730;
      doc.rect(0, footerY, 595, 110).fill('#f8fafc');
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fontSize(9).font('Hebrew').fillColor('#64748b');
      doc.text('זמן אספקה משוער: 5–7 ימי עסקים מאישור הפרויקט.', 50, footerY + 18, { width: 495, align: 'center' });
      doc.text('הצעה זו בתוקף ל־30 יום מתאריך ההנפקה.', 50, footerY + 33, { width: 495, align: 'center' });

      doc.fontSize(10).font('Hebrew-Bold').fillColor('#00a6ff');
      doc.text('NAXON MOBILE', 50, footerY + 55, { width: 495, align: 'center' });
      doc.fontSize(8).font('Hebrew').fillColor('#94a3b8');
      doc.text('פתרונות דיגיטליים חכמים', 50, footerY + 70, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
