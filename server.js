const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateQuotePDF } = require('./utils/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICES_FILE = path.join(__dirname, 'services.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readServices() {
  return JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf-8'));
}

function writeServices(data) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(data, null, 2));
}

// Get all services
app.get('/api/services', (req, res) => {
  const data = readServices();
  res.json(data.services);
});

// Admin auth
app.post('/api/admin/login', (req, res) => {
  const data = readServices();
  if (req.body.password === data.adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Update service
app.put('/api/admin/services/:id', (req, res) => {
  const data = readServices();
  if (req.body.adminPassword !== data.adminPassword) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const idx = data.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Service not found' });
  data.services[idx] = { ...data.services[idx], ...req.body.service };
  writeServices(data);
  res.json(data.services[idx]);
});

// Add service
app.post('/api/admin/services', (req, res) => {
  const data = readServices();
  if (req.body.adminPassword !== data.adminPassword) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const newService = req.body.service;
  newService.id = newService.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  data.services.push(newService);
  writeServices(data);
  res.json(newService);
});

// Delete service
app.delete('/api/admin/services/:id', (req, res) => {
  const data = readServices();
  if (req.body.adminPassword !== data.adminPassword) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  data.services = data.services.filter(s => s.id !== req.params.id);
  writeServices(data);
  res.json({ success: true });
});

// Generate PDF
app.post('/api/quote/pdf', async (req, res) => {
  try {
    const { selectedServices } = req.body;
    const data = readServices();
    const services = data.services.filter(s => selectedServices.includes(s.id));
    const pdfBuffer = await generateQuotePDF(services);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=NAXON-Quote.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`\n  NAXON MOBILE Quote Generator`);
  console.log(`  Running at http://localhost:${PORT}`);
  console.log(`  Admin panel: http://localhost:${PORT}/admin\n`);
});
