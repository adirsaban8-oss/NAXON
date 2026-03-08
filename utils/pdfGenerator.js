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
      const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
      const beforeVat = Math.round(total / 1.18);
      const vat = total - beforeVat;
      const quoteId = generateQuoteId();
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── Header ──
      doc.rect(0, 0, 595, 130).fill('#020617');
      doc.rect(0, 130, 595, 3).fill('#00a6ff');

      doc.fontSize(30).font('Helvetica-Bold').fillColor('#00a6ff')
        .text('NAXON MOBILE', 50, 32, { width: 495, align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8')
        .text('Smart Digital Solutions  |  Websites  |  AI  |  Automation', 50, 70, { width: 495, align: 'center' });
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
        .text('Price Proposal', 50, 97, { width: 495, align: 'center' });

      // ── Quote info bar ──
      doc.rect(50, 148, 495, 32).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica').fillColor('#64748b');
      doc.text(`Quote: ${quoteId}`, 62, 158);
      doc.text(`Date: ${date}`, 250, 158);
      doc.text(`${services.length} service${services.length > 1 ? 's' : ''} selected`, 430, 158);

      // ── Services Section ──
      let y = 202;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#020617')
        .text('Selected Services', 50, y);
      y += 30;

      // Table header
      doc.rect(50, y, 495, 28).fill('#020617');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('#', 62, y + 9, { width: 20 });
      doc.text('SERVICE', 88, y + 9);
      doc.text('PRICE (ILS)', 430, y + 9, { width: 105, align: 'right' });
      y += 36;

      // Service rows
      services.forEach((service, i) => {
        if (i % 2 === 0) {
          doc.rect(50, y - 5, 495, 28).fill('#f8fafc');
        }

        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
          .text(`${i + 1}`, 62, y + 2, { width: 20 });
        doc.fontSize(10).font('Helvetica').fillColor('#1e293b')
          .text(service.name, 88, y + 1);

        if (service.customPrice) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#00a6ff')
            .text('Custom Quote', 430, y + 1, { width: 105, align: 'right' });
        } else {
          doc.fontSize(10).font('Helvetica').fillColor('#334155')
            .text(`${service.price.toLocaleString()} NIS`, 430, y + 1, { width: 105, align: 'right' });
        }
        y += 28;
      });

      // ── Totals Section ──
      y += 12;
      doc.rect(310, y, 235, 1).fill('#e2e8f0');
      y += 14;

      // Before VAT
      doc.fontSize(10).font('Helvetica').fillColor('#64748b');
      doc.text('Before VAT:', 320, y);
      doc.text(`${beforeVat.toLocaleString()} NIS`, 430, y, { width: 105, align: 'right' });
      y += 20;

      // VAT
      doc.text('VAT (18%):', 320, y);
      doc.text(`${vat.toLocaleString()} NIS`, 430, y, { width: 105, align: 'right' });
      y += 22;

      // Total highlight
      doc.rect(310, y, 235, 40).fill('#020617');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
        .text('TOTAL (incl. VAT)', 322, y + 13);
      const suffix = customServices.length ? '+' : '';
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#00a6ff')
        .text(`${total.toLocaleString()}${suffix} NIS`, 430, y + 12, { width: 105, align: 'right' });
      y += 50;

      if (customServices.length) {
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
        doc.text(`* ${customServices.map(s => s.name).join(', ')} — pricing upon request`, 310, y);
        y += 14;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1');
      doc.text('All listed prices include 18% VAT.', 310, y);

      // ── Footer ──
      const footerY = 740;
      doc.rect(0, footerY, 595, 60).fill('#f8fafc');
      doc.rect(50, footerY, 495, 0.5).fill('#e2e8f0');

      doc.fontSize(8).font('Helvetica').fillColor('#64748b');
      doc.text('Estimated delivery: 5-7 business days from project approval.  |  This quote is valid for 30 days.', 50, footerY + 12, { width: 495, align: 'center' });

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#00a6ff')
        .text('NAXON MOBILE', 50, footerY + 30, { width: 495, align: 'center' });
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
        .text('Smart Digital Solutions', 50, footerY + 43, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
