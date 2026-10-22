# Pragyentra LLP — Official Corporate Export Platform

> **Connecting Indian Products with Global Markets**  
> Official corporate website and international export portal for Pragyentra LLP, built strictly according to the corporate Product Requirements Document (PRD).

---

## 🌟 Overview & Core Value Proposition

Pragyentra LLP is an international merchant exporter and product sourcing partner based in India. This platform provides global importers, wholesale distributors, retail chains, and procurement managers with a modern digital interface to discover verified Indian export commodities, inspect technical specifications, estimate maritime shipping schedules, and submit official quotation requests.

---

## 🚀 Key Features

### 1. 🌐 Interactive 3D Maritime Trade Globe (WebGL / Three.js)
- Real-time 3D Earth visualization centered on Indian maritime export hubs.
- Visualized shipping corridors from Indian ports (Mundra, JNPT Nhava Sheva, Chennai, Cochin) to international destination hubs (Rotterdam, Jebel Ali / Dubai, Singapore, New York, Hamburg, Santos, Durban).
- Animated trade light particles, parabolic bezier arcs, interactive tooltips with direct ocean transit days, and corridor filters (Europe, Middle East, Americas, Asia-Pacific).

### 2. 📦 Interactive 3D Cargo Container & Pallet Stuffing Visualizer
- 3D ISO shipping container (20' General Purpose & 40' High-Cube).
- Realistic corrugated metal walls, corner lock castings, wooden plank flooring, and strapped shrink-wrapped Euro pallets stacked inside.
- Interactive controls: 360° mouse rotation, openable rear cargo doors, X-Ray / semi-transparent inspection mode, and container spec switcher.

### 3. ⏱ Live Maritime Transit & Freight Estimator
- Instant calculation engine for ocean transit schedules from major Indian ports to global discharge ports.
- Equipment capacity readouts (CBM volume, payload, pallet allowances).
- Dynamic regulatory checklist generation (Phytosanitary, FSSAI, Spices Board, Mill Test Reports, ISPM-15 fumigation).
- "Apply to Quotation" button that auto-populates the official enquiry form.

### 4. 📋 Searchable & Filterable Export Product Catalogue
- Five core export sectors:
  - **Agricultural Commodities**: Aged 1121 Basmati Rice, Oilseeds, Grains.
  - **Organic Spices & Herbs**: High-Curcumin Salem/Nizamabad Turmeric, Tellicherry Black Pepper, Stemless Red Chillies.
  - **Eco-Friendly Products**: 100% Biodegradable Areca Palm Tableware, Export Jute & Cotton Bags.
  - **Engineering Goods**: Precision CNC Turned Brass Components & Industrial Flanges.
  - **Natural Minerals**: Industrial Activated Sodium Bentonite Clay.
- Full technical specification tables, HS codes, available grades, packaging options, MOQ, and origin details.

### 5. 📑 Complete Corporate Pages (PRD Aligned)
- **Home**: Hero banner with 3D Globe, Live port status strip, Featured sectors, Why Choose Us, 6-Step Export Workflow, Quick Estimator, CTA.
- **About Us**: Mission, Vision, Core Values, Regional Sourcing Network across India, Corporate transparency (verifiable facts only).
- **Products**: Searchable, filterable catalogue with interactive modal detail sheets.
- **Export Services**: Transparent breakdown of in-house managed vs partner-coordinated capabilities.
- **Quality & Compliance**: 5-Tier Quality Assurance protocol from raw material intake to tamper-evident container sealing.
- **Contact Us & Quotation**: Complete form with client/server validation, unique tracking ID generation (`PRG-2026-XXXX`), and instant confirmation modal.
- **Legal Pages**: Privacy Policy, Terms of Use, Cookie notice, and Enquiry Data Handling Statement.
- **Admin Management Portal**: Real-time KPI counters, enquiry status management (New, In Review, Quoted, Closed), CSV export, and dynamic product addition.
- **Downloadable Company Profile**: Printable/PDF export of official corporate profile.
- **WhatsApp Integration**: Floating quick-chat button with pre-filled export desk inquiry.

---

## 🛠 Tech Stack

- **Backend**: Node.js & Express.js (REST APIs, JSON persistence, compression, CORS)
- **Frontend**: Vanilla HTML5, Modern CSS (Deep Navy `#0B192C`, Emerald `#10B981`, Silver Grey `#E2E8F0`, Glassmorphism)
- **3D Graphics**: Three.js (r128) WebGL canvas visualizers
- **Typography**: Google Fonts (`Inter`)

---

## 🏁 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm (v9 or newer)

### Installation
```bash
# Clone the repository
git clone https://github.com/Raghu-678/pragyentra-.git
cd pragyentra-

# Install backend dependencies
npm install

# Start the application server
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📂 Project Structure

```
pragyentra-export-website/
├── package.json          # Node.js project manifest & scripts
├── server.js             # Express web server & REST API endpoints
├── data/
│   ├── products.json     # Product catalogue database with specifications & HS codes
│   ├── enquiries.json    # Persistent buyer enquiry records & tracking IDs
│   └── ports.json        # Indian & global maritime port coordinates & transit data
├── public/
│   ├── index.html        # Main Single Page Application with all corporate sections
│   ├── css/
│   │   └── styles.css    # Responsive corporate stylesheet & glassmorphic design system
│   └── js/
│       ├── app.js        # Application controller, routing, catalogue, modals, admin
│       ├── globe3d.js    # Three.js 3D interactive shipping globe & trade routes
│       ├── container3d.js# Three.js 3D cargo container & pallet stuffing viewer
│       └── freightCalc.js# Freight & ocean transit calculation logic
└── README.md
```

---

## 📄 License & Ownership

&copy; 2026 Pragyentra LLP. All rights reserved. Registered Limited Liability Partnership under the Ministry of Corporate Affairs (MCA), Government of India.
