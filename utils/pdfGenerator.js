const PDFDocument = require('pdfkit');

function generateQuoteId() {
  return 'NX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function formatDate() {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

async function generateQuotePDF(services) {
  const pricedServices = services.filter(s => !s.customPrice);
  const customServices = services.filter(s => s.customPrice);
  const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
  const beforeVat = Math.round(total / 1.18);
  const vat = total - beforeVat;
  const quoteId = generateQuoteId();
  const date = formatDate();
  const suffix = customServices.length ? '+' : '';

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 40;
  const contentW = pageW - margin * 2;

  // ==================== HEADER ====================
  const headerH = 90;
  doc.rect(0, 0, pageW, headerH).fill('#020617');
  doc.rect(0, headerH, pageW, 3).fill('#00a6ff');

  doc.font('Helvetica-Bold').fontSize(26).fillColor('#00a6ff');
  doc.text('NAXON MOBILE', 0, 18, { width: pageW, align: 'center' });

  doc.font('Helvetica').fontSize(9).fillColor('#94a3b8');
  doc.text('Smart Digital Solutions  •  Websites  •  AI  •  Automation', 0, 48, { width: pageW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff');
  doc.text('Price Quote', 0, 64, { width: pageW, align: 'center' });

  // ==================== INFO BAR ====================
  const infoY = headerH + 18;
  doc.roundedRect(margin, infoY, contentW, 32, 6).fill('#f8fafc');
  doc.roundedRect(margin, infoY, contentW, 32, 6).strokeColor('#e2e8f0').stroke();

  doc.font('Helvetica').fontSize(9).fillColor('#64748b');
  doc.text(`Quote #: ${quoteId}`, margin + 14, infoY + 10, { width: 200 });
  doc.text(`Date: ${date}`, 0, infoY + 10, { width: pageW, align: 'center' });
  doc.text(`${services.length} service${services.length !== 1 ? 's' : ''} selected`, margin + contentW - 160, infoY + 10, { width: 146, align: 'right' });

  // ==================== SERVICES TABLE ====================
  let curY = infoY + 52;

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#020617');
  doc.text('Selected Services', margin, curY);
  curY += 26;

  // Table header
  const colNum = margin;
  const colName = margin + 40;
  const colPrice = pageW - margin - 90;
  const rowH = 36;

  doc.rect(margin, curY, contentW, 28).fill('#020617');
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  doc.text('#', colNum + 10, curY + 9, { width: 25, align: 'center' });
  doc.text('SERVICE', colName, curY + 9, { width: 300 });
  doc.text('PRICE', colPrice, curY + 9, { width: 80, align: 'right' });
  curY += 28;

  // Table rows
  services.forEach((s, i) => {
    const bgColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(margin, curY, contentW, rowH).fill(bgColor);

    // Number
    doc.font('Helvetica').fontSize(10).fillColor('#94a3b8');
    doc.text(`${i + 1}`, colNum + 10, curY + 12, { width: 25, align: 'center' });

    // Service name
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b');
    doc.text(s.name, colName, curY + 10, { width: 320 });

    // Price
    if (s.customPrice) {
      doc.font('Helvetica').fontSize(10).fillColor('#00a6ff');
      doc.text('Custom Quote', colPrice, curY + 12, { width: 80, align: 'right' });
    } else {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b');
      doc.text(`ILS ${s.price.toLocaleString()}`, colPrice, curY + 10, { width: 80, align: 'right' });
    }

    // Bottom border
    doc.moveTo(margin, curY + rowH).lineTo(margin + contentW, curY + rowH).strokeColor('#f1f5f9').lineWidth(1).stroke();
    curY += rowH;
  });

  // ==================== TOTALS ====================
  curY += 20;
  const totalsX = pageW - margin - 220;
  const totalsW = 220;

  // Before VAT
  doc.font('Helvetica').fontSize(10).fillColor('#64748b');
  doc.text('Before VAT', totalsX, curY, { width: 120 });
  doc.text(`ILS ${beforeVat.toLocaleString()}`, totalsX + 120, curY, { width: 100, align: 'right' });
  doc.moveTo(totalsX, curY + 16).lineTo(totalsX + totalsW, curY + 16).strokeColor('#f1f5f9').lineWidth(1).stroke();
  curY += 22;

  // VAT
  doc.font('Helvetica').fontSize(10).fillColor('#64748b');
  doc.text('VAT (18%)', totalsX, curY, { width: 120 });
  doc.text(`ILS ${vat.toLocaleString()}`, totalsX + 120, curY, { width: 100, align: 'right' });
  doc.moveTo(totalsX, curY + 16).lineTo(totalsX + totalsW, curY + 16).strokeColor('#f1f5f9').lineWidth(1).stroke();
  curY += 24;

  // Total box
  doc.roundedRect(totalsX, curY, totalsW, 42, 6).fill('#020617');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff');
  doc.text('Total incl. VAT', totalsX + 14, curY + 14, { width: 100 });
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#00a6ff');
  doc.text(`ILS ${total.toLocaleString()}${suffix}`, totalsX + 114, curY + 11, { width: 92, align: 'right' });
  curY += 50;

  // Custom note
  if (customServices.length) {
    const customNames = customServices.map(s => s.name).join(', ');
    doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
    doc.text(`* ${customNames} — custom pricing`, totalsX, curY, { width: totalsW });
    curY += 14;
  }

  doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
  doc.text('All prices include 18% VAT', totalsX, curY, { width: totalsW });

  // ==================== FOOTER ====================
  const footerY = pageH - 55;
  doc.rect(0, footerY, pageW, 55).fill('#f8fafc');
  doc.moveTo(0, footerY).lineTo(pageW, footerY).strokeColor('#e2e8f0').lineWidth(1).stroke();

  doc.font('Helvetica').fontSize(7).fillColor('#64748b');
  doc.text('Estimated delivery: 5-7 business days from project approval  |  This quote is valid for 30 days', 0, footerY + 10, { width: pageW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#00a6ff');
  doc.text('NAXON MOBILE', 0, footerY + 24, { width: pageW, align: 'center' });

  doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
  doc.text('Smart Digital Solutions', 0, footerY + 38, { width: pageW, align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = { generateQuotePDF };
