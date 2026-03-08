const PDFDocument = require('pdfkit');

function generateQuoteId() {
  return 'NX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateQuotePDF(services) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pricedServices = services.filter(s => !s.customPrice);
      const customServices = services.filter(s => s.customPrice);
      // Prices are VAT-inclusive
      const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
      const beforeVat = Math.round(total / 1.18);
      const vat = total - beforeVat;
      const quoteId = generateQuoteId();
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── Header ──
      doc.rect(0, 0, 595, 140).fill('#020617');
      // Accent line
      doc.rect(0, 140, 595, 3).fill('#00a6ff');

      // Logo
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#00a6ff').text('NAXON MOBILE', 50, 30, { width: 495, align: 'center' });
      doc.fontSize(10).fillColor('#94a3b8').text('Smart Digital Solutions  •  Websites  •  AI  •  Automation', 50, 70, { width: 495, align: 'center' });

      // Title
      doc.fontSize(18).fillColor('#ffffff').text('Website Development Proposal', 50, 100, { width: 495, align: 'center' });

      // ── Quote info ──
      doc.fillColor('#475569').fontSize(10).font('Helvetica');
      doc.text(`Quote ID: ${quoteId}`, 50, 160);
      doc.text(`Date: ${date}`, 50, 175);
      doc.text(`Services: ${services.length} selected`, 50, 190);

      // Divider
      doc.moveTo(50, 212).lineTo(545, 212).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // ── Services ──
      let y = 230;
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#020617').text('Selected Services', 50, y);
      y += 32;

      // Table header
      doc.rect(50, y, 495, 30).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('#', 60, y + 10, { width: 25 });
      doc.text('SERVICE', 85, y + 10);
      doc.text('PRICE', 430, y + 10, { width: 105, align: 'right' });
      y += 40;

      // Service rows
      doc.font('Helvetica').fontSize(10);
      services.forEach((service, i) => {
        if (i % 2 === 0) {
          doc.rect(50, y - 6, 495, 26).fill('#f8fafc');
        }
        doc.fillColor('#94a3b8').text(`${i + 1}`, 60, y, { width: 25 });
        doc.fillColor('#1e293b').text(service.name, 85, y);
        if (service.customPrice) {
          doc.fillColor('#00a6ff').fontSize(9).text('Custom Quote', 430, y, { width: 105, align: 'right' });
          doc.fontSize(10);
        } else {
          doc.fillColor('#475569').text(`₪${service.price.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
        }
        y += 26;
      });

      // ── Totals ──
      y += 16;
      doc.moveTo(300, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      y += 12;

      // Before VAT
      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      doc.text('Before VAT:', 320, y);
      doc.text(`₪${beforeVat.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
      y += 20;

      // VAT
      doc.text('VAT (18%):', 320, y);
      doc.text(`₪${vat.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
      y += 24;

      // Total line
      doc.moveTo(320, y).lineTo(545, y).strokeColor('#00a6ff').lineWidth(2).stroke();
      y += 14;

      const suffix = customServices.length ? '+' : '';
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#020617').text('Total (incl. VAT):', 320, y);
      doc.fillColor('#00a6ff').text(`₪${total.toLocaleString()}${suffix}`, 430, y, { width: 105, align: 'right' });
      y += 26;

      if (customServices.length) {
        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
        doc.text(`* ${customServices.map(s => s.name).join(', ')} — custom pricing`, 320, y, { width: 220, align: 'right' });
        y += 16;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1');
      doc.text('All prices include 18% VAT', 320, y, { width: 220, align: 'right' });

      // ── Footer ──
      const footerY = 730;
      doc.rect(0, footerY, 595, 110).fill('#f8fafc');
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fontSize(9).font('Helvetica').fillColor('#64748b');
      doc.text('Estimated delivery time: 5–7 business days from project approval.', 50, footerY + 18, { width: 495, align: 'center' });
      doc.text('This quote is valid for 30 days from the date of issue.', 50, footerY + 33, { width: 495, align: 'center' });

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#00a6ff');
      doc.text('NAXON MOBILE', 50, footerY + 55, { width: 495, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
      doc.text('Smart Digital Solutions', 50, footerY + 70, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
