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

      const subtotal = services.reduce((sum, s) => sum + s.price, 0);
      const vat = Math.round(subtotal * 0.18);
      const total = subtotal + vat;
      const quoteId = generateQuoteId();
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // Header
      doc.rect(0, 0, 595, 130).fill('#020617');

      // Logo
      doc.fontSize(30).font('Helvetica-Bold').fillColor('#00a6ff').text('NAXON MOBILE', 50, 35, { width: 495, align: 'center' });
      doc.fontSize(10).fillColor('#94a3b8').text('Smart Digital Solutions  •  Websites  •  AI  •  Automation', 50, 72, { width: 495, align: 'center' });

      // Title
      doc.fontSize(17).fillColor('#ffffff').text('Website Development Proposal', 50, 100, { width: 495, align: 'center' });

      // Quote info
      doc.fillColor('#475569');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Quote ID: ${quoteId}`, 50, 150);
      doc.text(`Date: ${date}`, 50, 165);

      // Divider
      doc.moveTo(50, 190).lineTo(545, 190).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // Services header
      let y = 210;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#020617').text('Selected Services', 50, y);
      y += 30;

      // Table header
      doc.rect(50, y, 495, 28).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('SERVICE', 60, y + 9);
      doc.text('PRICE', 430, y + 9, { width: 105, align: 'right' });
      y += 38;

      // Service rows
      doc.font('Helvetica').fontSize(10);
      services.forEach((service, i) => {
        if (i % 2 === 0) {
          doc.rect(50, y - 5, 495, 24).fill('#f8fafc');
        }
        doc.fillColor('#1e293b').text(service.name, 60, y);
        doc.fillColor('#475569').text(`₪${service.price.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
        y += 24;
      });

      // Totals divider
      y += 10;
      doc.moveTo(300, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      y += 15;

      // Totals
      doc.fontSize(10).font('Helvetica').fillColor('#64748b');
      doc.text('Subtotal:', 350, y);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`₪${subtotal.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
      y += 22;

      doc.font('Helvetica').fillColor('#64748b').text('VAT (18%):', 350, y);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`₪${vat.toLocaleString()}`, 430, y, { width: 105, align: 'right' });
      y += 22;

      doc.moveTo(350, y).lineTo(545, y).strokeColor('#00a6ff').lineWidth(1.5).stroke();
      y += 12;

      doc.fontSize(15).font('Helvetica-Bold').fillColor('#020617').text('Total:', 350, y);
      doc.fillColor('#00a6ff').text(`₪${total.toLocaleString()}`, 430, y, { width: 105, align: 'right' });

      // Footer
      const footerY = 720;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
      doc.text('Estimated delivery time: 5-7 business days.', 50, footerY + 15, { width: 495, align: 'center' });
      doc.text('NAXON MOBILE  •  Smart Digital Solutions', 50, footerY + 30, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
