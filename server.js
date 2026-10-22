const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ENQUIRIES_FILE = path.join(__dirname, 'data', 'enquiries.json');
const PORTS_FILE = path.join(__dirname, 'data', 'ports.json');

// Helper to read JSON
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper to write JSON
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
}

// API Routes

// 1. Get Products with optional filters
app.get('/api/products', (req, res) => {
  let products = readJson(PRODUCTS_FILE, []);
  const { category, search, featured } = req.query;

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (featured === 'true') {
    products = products.filter(p => p.featured === true);
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.hsCode.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// 2. Get Single Product
app.get('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// 3. Add or update product (Admin)
app.post('/api/products', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const newProduct = {
    id: `PRD-${Date.now().toString().slice(-6)}`,
    name: req.body.name,
    category: req.body.category || 'Agricultural Commodities',
    subCategory: req.body.subCategory || 'General',
    hsCode: req.body.hsCode || '0000.00.00',
    origin: req.body.origin || 'India',
    description: req.body.description || '',
    specifications: req.body.specifications || {},
    gradesAvailable: req.body.gradesAvailable || ['Standard Export Grade'],
    moq: req.body.moq || "1 x 20' FCL",
    packagingOptions: req.body.packagingOptions || ['Standard Export Bags'],
    documentationAvailable: req.body.documentationAvailable || ['Certificate of Origin', 'Phytosanitary Certificate'],
    portOfLoading: req.body.portOfLoading || 'Mundra / JNPT, India',
    featured: Boolean(req.body.featured),
    image: req.body.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
  };

  products.unshift(newProduct);
  writeJson(PRODUCTS_FILE, products);
  res.status(201).json({ success: true, data: newProduct });
});

// 4. Get Ports & Trade Lanes
app.get('/api/ports', (req, res) => {
  const ports = readJson(PORTS_FILE, { indianPorts: [], destinationPorts: [] });
  res.json({ success: true, data: ports });
});

// 5. Submit Quotation / Enquiry
app.post('/api/enquiries', (req, res) => {
  const {
    fullName,
    companyName,
    country,
    email,
    phone,
    productId,
    productName,
    quantity,
    incoterm,
    message,
    source
  } = req.body;

  // PRD Validation
  const errors = [];
  if (!fullName || fullName.trim().length < 2) errors.push('Full name is required (min 2 characters).');
  if (!companyName || companyName.trim().length < 2) errors.push('Company name is required.');
  if (!country || country.trim().length < 2) errors.push('Country is required.');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid business email is required.');
  if (!phone || phone.trim().length < 6) errors.push('Valid Phone or WhatsApp number is required.');
  if (!quantity || quantity.trim().length < 2) errors.push('Estimated order quantity is required.');
  if (!message || message.trim().length < 5) errors.push('Message / specific requirements are required.');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please verify your enquiry details.',
      errors
    });
  }

  const enquiries = readJson(ENQUIRIES_FILE, []);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const trackingId = `PRG-2026-${randomSuffix}`;

  const newEnquiry = {
    id: trackingId,
    timestamp: new Date().toISOString(),
    fullName: fullName.trim(),
    companyName: companyName.trim(),
    country: country.trim(),
    email: email.trim(),
    phone: phone.trim(),
    productId: productId || 'GENERAL',
    productName: productName || 'General Export Inquiry',
    quantity: quantity.trim(),
    incoterm: incoterm || 'FOB / CIF Pending Confirmation',
    message: message.trim(),
    status: 'New',
    notes: 'Submitted via official portal. Auto-assigned to International Trade Desk.',
    source: source || 'Website Enquiry Form'
  };

  enquiries.unshift(newEnquiry);
  writeJson(ENQUIRIES_FILE, enquiries);

  res.status(201).json({
    success: true,
    trackingId,
    message: 'Your export enquiry has been successfully logged. An official quotation will be coordinated by our export desk within 24 business hours.',
    data: newEnquiry
  });
});

// 6. Get Enquiries (Admin)
app.get('/api/enquiries', (req, res) => {
  const enquiries = readJson(ENQUIRIES_FILE, []);
  res.json({
    success: true,
    count: enquiries.length,
    data: enquiries
  });
});

// 7. Update Enquiry Status (Admin)
app.patch('/api/enquiries/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const enquiries = readJson(ENQUIRIES_FILE, []);
  const enquiry = enquiries.find(e => e.id === id);

  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }

  if (status) enquiry.status = status;
  if (notes) enquiry.notes = notes;
  enquiry.lastUpdated = new Date().toISOString();

  writeJson(ENQUIRIES_FILE, enquiries);
  res.json({ success: true, data: enquiry });
});

// 8. Export Enquiries to CSV
app.get('/api/enquiries/export-csv', (req, res) => {
  const enquiries = readJson(ENQUIRIES_FILE, []);
  const headers = ['Tracking ID', 'Date', 'Full Name', 'Company', 'Country', 'Email', 'Phone', 'Product', 'Quantity', 'Incoterm', 'Status', 'Message'];
  
  const csvRows = [headers.join(',')];
  enquiries.forEach(e => {
    const row = [
      `"${e.id}"`,
      `"${e.timestamp ? e.timestamp.substring(0, 10) : ''}"`,
      `"${(e.fullName || '').replace(/"/g, '""')}"`,
      `"${(e.companyName || '').replace(/"/g, '""')}"`,
      `"${(e.country || '').replace(/"/g, '""')}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${(e.productName || '').replace(/"/g, '""')}"`,
      `"${(e.quantity || '').replace(/"/g, '""')}"`,
      `"${e.incoterm || ''}"`,
      `"${e.status || 'New'}"`,
      `"${(e.message || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Pragyentra_Export_Enquiries.csv"');
  res.status(200).send(csvRows.join('\r\n'));
});

// 9. Logistics Freight & Transit Estimator
app.post('/api/freight-estimate', (req, res) => {
  const { originPort, destinationPort, containerType, cargoCategory, estimatedGrossWeight } = req.body;
  const ports = readJson(PORTS_FILE, { indianPorts: [], destinationPorts: [] });

  const origin = ports.indianPorts.find(p => p.code === originPort) || ports.indianPorts[0];
  const dest = ports.destinationPorts.find(p => p.code === destinationPort) || ports.destinationPorts[0];

  const transitDays = dest.transitDays[origin.code] || 20;

  // Container dimensions & capacity
  let containerSpecs = {
    name: "20' General Purpose Container (20' GP)",
    internalLength: "5.898 m (19' 4\")",
    internalWidth: "2.352 m (7' 8\")",
    internalHeight: "2.393 m (7' 10\")",
    maxPayload: "25,000 kg",
    internalVolume: "33.2 CBM",
    standardPallets: "10 Standard Euro Pallets (1200 x 800 mm) or 9 Standard ISO Pallets"
  };

  if (containerType === "40HC") {
    containerSpecs = {
      name: "40' High Cube Intermodal Container (40' HC)",
      internalLength: "12.032 m (39' 5\")",
      internalWidth: "2.352 m (7' 8\")",
      internalHeight: "2.698 m (8' 10\")",
      maxPayload: "28,600 kg",
      internalVolume: "76.4 CBM",
      standardPallets: "24 Standard Euro Pallets or 20 - 21 Standard ISO Pallets"
    };
  } else if (containerType === "40GP") {
    containerSpecs = {
      name: "40' Standard General Purpose (40' GP)",
      internalLength: "12.032 m (39' 5\")",
      internalWidth: "2.352 m (7' 8\")",
      internalHeight: "2.393 m (7' 10\")",
      maxPayload: "26,500 kg",
      internalVolume: "67.7 CBM",
      standardPallets: "21 Standard Euro Pallets"
    };
  }

  // Recommended documents based on category
  let complianceDocs = [
    "Commercial Invoice & Packing List with HS codes",
    "Certificate of Origin (Authorized Chamber of Commerce / DGFT)",
    "Bill of Lading (Clean on Board Ocean Bill)",
    "Standard Shipping Bill & Port Clearance"
  ];

  if (cargoCategory === "Organic Spices & Herbs" || cargoCategory === "Agricultural Commodities") {
    complianceDocs.push(
      "Phytosanitary Certificate (Ministry of Agriculture, Plant Quarantine)",
      "Spices Board India Quality Clearance Certificate (where applicable)",
      "Certificate of Analysis (Moisture, Curcumin, Aflatoxin & Microbiological parameters)",
      "ISPM-15 Heat Treated Palletization & Fumigation Certificate"
    );
  } else if (cargoCategory === "Engineering Goods") {
    complianceDocs.push(
      "Mill Test Certificate / Material Test Report (EN 10204 3.1)",
      "RoHS / REACH Conformity Declaration",
      "Dimensional & CMM Inspection Report",
      "Anti-Rust VCI Packaging Certification"
    );
  } else if (cargoCategory === "Natural Minerals") {
    complianceDocs.push(
      "Material Safety Data Sheet (MSDS / SDS 16 Sections)",
      "API Rheology / Sieve Analysis Certificate",
      "Non-Dangerous Goods (Non-DG) Cargo Declaration"
    );
  }

  res.json({
    success: true,
    estimate: {
      origin: origin.name,
      originState: origin.state,
      destination: dest.name,
      destinationCountry: dest.country,
      transitDays,
      containerSpecs,
      complianceDocs,
      recommendedCutOffDays: 4,
      incotermsSupported: ["FOB (Free On Board)", "CIF (Cost, Insurance & Freight)", "CFR (Cost & Freight)", "EXW (Ex Works)"]
    }
  });
});

// 10. Downloadable Company Profile
app.get('/api/company-profile', (req, res) => {
  const profile = {
    companyName: "Pragyentra LLP",
    registrationType: "Limited Liability Partnership (Registered under MCA, Govt. of India)",
    tagline: "Connecting Indian Products with Global Markets",
    headquarters: "India",
    businessNature: "International Merchant Exporter, Product Sourcing & Export Logistics Coordinator",
    primaryExportSectors: [
      "Agricultural Commodities & Extra Long Grain Rice",
      "Certified Spices & High-Curcumin Turmeric",
      "100% Biodegradable Areca Palm Tableware & Eco-Packaging",
      "Precision Machined Brass Components & Industrial Flanges",
      "High-Yield Industrial Sodium Bentonite & Mineral Raw Materials"
    ],
    exportGateways: [
      "Mundra Port (Gujarat) — Direct Western Maritime Access",
      "JNPT Nhava Sheva (Maharashtra) — Premier Central Container Terminal",
      "Chennai Port (Tamil Nadu) — Southern & Far-East Gateway",
      "Cochin Port (Kerala) — Transshipment & Spice Corridor"
    ],
    qualityCommitment: "Batch-wise pre-shipment quality inspection, laboratory testing, ISPM-15 compliant palletization, and strict regulatory adherence with DGFT, FSSAI, and international standards.",
    contactChannels: {
      email: "contact@pragyentra.com",
      exportDesk: "+91 98765 43210",
      whatsApp: "https://wa.me/919876543210?text=Hello%20Pragyentra%20LLP%2C%20I%20would%20like%20to%20discuss%20an%20export%20inquiry.",
      workingHours: "Monday to Saturday, 09:00 - 18:30 IST (Export desk monitored 24/7 for overseas timezones)"
    }
  };
  res.json({ success: true, data: profile });
});

// Serve Static Assets from /public
app.use(express.static(path.join(__dirname, 'public')));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Pragyentra LLP Export Website Server running at http://localhost:${PORT}`);
});
