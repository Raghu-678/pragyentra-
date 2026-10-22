/**
 * Pragyentra LLP — Core Application Controller
 * Handles SPA navigation, catalogue filtering, enquiry submission, admin portal & modals.
 */

// Global State
const appState = {
  currentPage: 'home',
  products: [],
  enquiries: [],
  selectedProduct: null,
  activeCategory: 'All',
  searchQuery: '',
  globeInstance: null,
  containerInstance: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  await loadProducts();
  initSearchAndFilters();
  initEnquiryForm();
  initModals();
  initCookieBanner();
  initAdminPortal();
  initCompanyProfile();

  // Route based on URL hash
  const initialHash = window.location.hash.replace('#', '') || 'home';
  navigateToPage(initialHash);

  // Initialize 3D elements once container is ready
  setTimeout(() => {
    if (window.ShippingGlobe3D && document.getElementById('globeCanvas')) {
      appState.globeInstance = new window.ShippingGlobe3D('globeCanvas');
    }
    if (window.CargoContainer3D && document.getElementById('containerCanvas')) {
      appState.containerInstance = new window.CargoContainer3D('containerCanvas');
    }
    setup3DControls();
  }, 100);
});

// Navigation Controller
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .page-switch-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.getAttribute('data-page');
      if (targetPage) {
        navigateToPage(targetPage);
      }
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('mainNavMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // Window scroll header effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Hash change listener
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== appState.currentPage) {
      navigateToPage(hash);
    }
  });
}

function navigateToPage(pageId) {
  const validPages = ['home', 'about', 'products', 'services', 'quality', 'contact', 'legal', 'admin'];
  if (!validPages.includes(pageId)) {
    pageId = 'home';
  }

  appState.currentPage = pageId;
  window.location.hash = pageId;

  // Toggle active page views
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `page-${pageId}`) {
      view.style.display = 'block';
    } else {
      view.style.display = 'none';
    }
  });

  // Update navigation active states
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Close mobile menu if open
  const navMenu = document.getElementById('mainNavMenu');
  if (navMenu) navMenu.classList.remove('mobile-open');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Specific page lifecycle hooks
  if (pageId === 'admin') {
    loadEnquiries();
  }
}
window.navigateToPage = navigateToPage;

// 3D Visualizer Control Buttons
function setup3DControls() {
  // Globe Lane filters
  const laneBtns = document.querySelectorAll('.lane-filter-btn');
  laneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      laneBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lane = btn.getAttribute('data-lane');
      if (appState.globeInstance) {
        appState.globeInstance.filterRoutes(lane);
      }
    });
  });

  // Container Controls
  const toggleDoorsBtn = document.getElementById('btnToggleContainerDoors');
  if (toggleDoorsBtn) {
    toggleDoorsBtn.addEventListener('click', () => {
      if (appState.containerInstance) {
        appState.containerInstance.toggleDoors();
      }
    });
  }

  const toggleXRayBtn = document.getElementById('btnToggleContainerXRay');
  if (toggleXRayBtn) {
    toggleXRayBtn.addEventListener('click', () => {
      if (appState.containerInstance) {
        appState.containerInstance.toggleXRay();
        toggleXRayBtn.classList.toggle('active');
      }
    });
  }

  const btnType20 = document.getElementById('btnContainer20');
  const btnType40 = document.getElementById('btnContainer40');
  if (btnType20 && btnType40) {
    btnType20.addEventListener('click', () => {
      btnType20.classList.add('active');
      btnType40.classList.remove('active');
      if (appState.containerInstance) {
        appState.containerInstance.switchContainerType('20GP');
      }
      document.getElementById('containerCapacityText').innerText = "33.2 CBM (10 Euro Pallets)";
    });

    btnType40.addEventListener('click', () => {
      btnType40.classList.add('active');
      btnType20.classList.remove('active');
      if (appState.containerInstance) {
        appState.containerInstance.switchContainerType('40HC');
      }
      document.getElementById('containerCapacityText').innerText = "76.4 CBM (24 Euro Pallets)";
    });
  }
}

// Product Catalogue Loader & Renderer
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) {
      appState.products = json.data;
      renderProductsCatalogue();
      renderFeaturedProductsHome();
      populateEnquiryProductDropdown();
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderProductsCatalogue() {
  const container = document.getElementById('productsCatalogueGrid');
  if (!container) return;

  let filtered = appState.products;

  // Filter by category
  if (appState.activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === appState.activeCategory.toLowerCase());
  }

  // Filter by search
  if (appState.searchQuery.trim() !== '') {
    const q = appState.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.hsCode.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h4 style="margin-bottom: 8px;">No products matching your criteria</h4>
        <p style="color: #64748b;">Try adjusting your search keywords or resetting the category filter.</p>
        <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="resetProductFilters()">View All Products</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => `
    <div class="product-card">
      <div class="product-thumb-wrap">
        <img src="${prod.image}" alt="${prod.name}" loading="lazy">
        <div class="product-badges">
          <span class="badge-tag hs-code">HS ${prod.hsCode}</span>
          <span class="badge-tag origin">${prod.origin.split(',')[0]}</span>
        </div>
      </div>
      <div class="product-body">
        <div class="product-category-sub">${prod.category}</div>
        <h3>${prod.name}</h3>
        <p class="prod-desc">${prod.description}</p>
        
        <div class="product-quick-specs">
          <div class="spec-line">
            <span>Minimum Order:</span>
            <span>${prod.moq}</span>
          </div>
          <div class="spec-line">
            <span>Port of Loading:</span>
            <span>${prod.portOfLoading.split(',')[0]}</span>
          </div>
        </div>

        <div class="product-card-actions">
          <button class="btn btn-outline btn-sm" onclick="openProductDetailModal('${prod.id}')">
            View Specs
          </button>
          <button class="btn btn-emerald btn-sm" onclick="triggerQuoteForProduct('${prod.id}', '${escapeQuotes(prod.name)}')">
            Request Quote
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFeaturedProductsHome() {
  const container = document.getElementById('featuredHomeGrid');
  if (!container) return;

  const featured = appState.products.filter(p => p.featured).slice(0, 4);
  container.innerHTML = featured.map(prod => `
    <div class="category-card">
      <div class="cat-image-wrap">
        <img src="${prod.image}" alt="${prod.name}">
        <span class="cat-badge">${prod.category}</span>
      </div>
      <div class="cat-body">
        <h3>${prod.name}</h3>
        <p>${prod.description.substring(0, 110)}...</p>
        <div class="cat-footer">
          <span style="font-size:0.75rem; color:#64748b; font-weight:600;">MOQ: ${prod.moq.split('(')[0]}</span>
          <a href="#products" class="cat-link" onclick="openProductDetailModal('${prod.id}')">
            Explore Specs &rarr;
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

function initSearchAndFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.activeCategory = pill.getAttribute('data-category');
      renderProductsCatalogue();
    });
  });

  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderProductsCatalogue();
    });
  }
}

function resetProductFilters() {
  appState.activeCategory = 'All';
  appState.searchQuery = '';
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-pill').forEach(p => {
    if (p.getAttribute('data-category') === 'All') p.classList.add('active');
    else p.classList.remove('active');
  });
  renderProductsCatalogue();
}
window.resetProductFilters = resetProductFilters;

// Product Details Modal
function openProductDetailModal(productId) {
  const product = appState.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productDetailModal');
  const title = document.getElementById('modalProductTitle');
  const body = document.getElementById('modalProductBody');

  title.innerText = product.name;

  // Build specifications list
  const specsRows = Object.entries(product.specifications || {}).map(([key, val]) => `
    <tr>
      <td style="font-weight:600; color:#334155; width:35%; padding:10px 14px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">${key}</td>
      <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#0f172a;">${val}</td>
    </tr>
  `).join('');

  const gradesList = (product.gradesAvailable || []).map(g => `<span class="compliance-tag">${g}</span>`).join(' ');
  const packList = (product.packagingOptions || []).map(p => `<li>📦 ${p}</li>`).join('');
  const docList = (product.documentationAvailable || []).map(d => `<li>📄 ${d}</li>`).join('');

  body.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:24px; margin-bottom:24px;">
      <div style="border-radius:12px; overflow:hidden; height:240px; background:#e2e8f0;">
        <img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div>
        <div style="font-size:0.8125rem; font-weight:700; color:#059669; text-transform:uppercase; margin-bottom:6px;">
          ${product.category} &bull; HS Code: ${product.hsCode}
        </div>
        <p style="font-size:0.9375rem; color:#475569; line-height:1.6; margin-bottom:16px;">
          ${product.description}
        </p>
        <div style="font-size:0.8125rem; color:#1e293b; background:#f1f5f9; padding:10px 14px; border-radius:8px;">
          <strong>Origin:</strong> ${product.origin}<br>
          <strong>Port of Loading:</strong> ${product.portOfLoading}<br>
          <strong>Minimum Order Quantity:</strong> ${product.moq}
        </div>
      </div>
    </div>

    <h4 style="font-size:1.1rem; margin-bottom:10px; color:#0b192c;">Technical Specifications & Lab Parameters</h4>
    <div class="table-responsive" style="margin-bottom:24px;">
      <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
        ${specsRows}
      </table>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
      <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0;">
        <h5 style="margin-bottom:8px; font-size:0.9375rem;">Packaging & Palletization</h5>
        <ul style="list-style:none; font-size:0.8125rem; color:#475569; line-height:1.6;">
          ${packList}
        </ul>
      </div>
      <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0;">
        <h5 style="margin-bottom:8px; font-size:0.9375rem;">Export Documentation Standard</h5>
        <ul style="list-style:none; font-size:0.8125rem; color:#475569; line-height:1.6;">
          ${docList}
        </ul>
      </div>
    </div>

    <div style="margin-bottom:12px;">
      <h5 style="margin-bottom:6px; font-size:0.875rem;">Available Grades & Process Variants:</h5>
      <div>${gradesList}</div>
    </div>
  `;

  // Update modal footer quote button
  const modalQuoteBtn = document.getElementById('modalQuoteActionBtn');
  if (modalQuoteBtn) {
    modalQuoteBtn.onclick = () => {
      modal.close();
      triggerQuoteForProduct(product.id, product.name);
    };
  }

  modal.showModal();
}
window.openProductDetailModal = openProductDetailModal;

function triggerQuoteForProduct(productId, productName) {
  navigateToPage('contact');
  setTimeout(() => {
    const prodSelect = document.getElementById('enquiryProduct');
    const msgArea = document.getElementById('enquiryMessage');
    if (prodSelect) {
      prodSelect.value = productId;
    }
    if (msgArea && (!msgArea.value || msgArea.value.trim() === '')) {
      msgArea.value = `Interested in receiving a commercial export quotation for: ${productName}. Please share specification sheet, available packing options, and CIF freight rates.`;
    }
    const formCard = document.querySelector('.contact-form-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}
window.triggerQuoteForProduct = triggerQuoteForProduct;

function populateEnquiryProductDropdown() {
  const select = document.getElementById('enquiryProduct');
  if (!select) return;

  const existingValue = select.value;
  select.innerHTML = `
    <option value="">-- Select Product Category or Line --</option>
    <optgroup label="Export Products">
      ${appState.products.map(p => `<option value="${p.id}">${p.name} (HS: ${p.hsCode})</option>`).join('')}
    </optgroup>
    <optgroup label="Custom Sourcing">
      <option value="CUSTOM_SOURCING">Custom Product Sourcing Request</option>
      <option value="GENERAL_INQUIRY">General Export Services Inquiry</option>
    </optgroup>
  `;

  if (existingValue) select.value = existingValue;
}

// Enquiry Form Handler (Client & Server Validation)
function initEnquiryForm() {
  const form = document.getElementById('exportEnquiryForm');
  const alertBox = document.getElementById('enquiryFormAlert');
  const submitBtn = document.getElementById('enquirySubmitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('enquiryFullName').value.trim();
    const companyName = document.getElementById('enquiryCompanyName').value.trim();
    const country = document.getElementById('enquiryCountry').value.trim();
    const email = document.getElementById('enquiryEmail').value.trim();
    const phone = document.getElementById('enquiryPhone').value.trim();
    const productSelect = document.getElementById('enquiryProduct');
    const productId = productSelect.value;
    const productName = productSelect.options[productSelect.selectedIndex] ? productSelect.options[productSelect.selectedIndex].text : '';
    const quantity = document.getElementById('enquiryQuantity').value.trim();
    const incoterm = document.getElementById('enquiryIncoterm').value.trim();
    const message = document.getElementById('enquiryMessage').value.trim();

    // Client-side validation
    const errors = [];
    if (!fullName) errors.push('Full name is required.');
    if (!companyName) errors.push('Company name is required.');
    if (!country) errors.push('Country is required.');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('A valid business email is required.');
    if (!phone) errors.push('Phone or WhatsApp number is required.');
    if (!quantity) errors.push('Estimated order quantity is required.');
    if (!message) errors.push('Please describe your requirements.');

    if (errors.length > 0) {
      alertBox.className = 'form-status-alert error';
      alertBox.innerHTML = `<strong>Please correct the following:</strong><br>${errors.join('<br>')}`;
      alertBox.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      Submitting Enquiry to Export Desk...
    `;

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          source: 'Website Quotation Form'
        })
      });

      const data = await res.json();

      if (data.success) {
        alertBox.className = 'form-status-alert success';
        alertBox.innerHTML = `
          <strong>✔ Enquiry Registered Successfully!</strong><br>
          Reference ID: <span style="font-family:monospace; font-weight:700;">${data.trackingId}</span><br>
          Thank you, ${fullName}. Our international export desk has received your request and will provide formal FOB/CIF pricing within 24 business hours.
        `;
        alertBox.style.display = 'block';
        form.reset();

        // Also show confirmation modal with WhatsApp follow-up option
        showConfirmationModal(data.trackingId, companyName, productName);
      } else {
        alertBox.className = 'form-status-alert error';
        alertBox.innerHTML = `<strong>Error:</strong> ${data.message || 'Failed to submit enquiry.'}`;
        alertBox.style.display = 'block';
      }
    } catch (err) {
      console.error('Enquiry error:', err);
      alertBox.className = 'form-status-alert error';
      alertBox.innerHTML = 'Network error. Please try again or reach out directly via WhatsApp.';
      alertBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        Submit Official Export Enquiry
      `;
    }
  });
}

function showConfirmationModal(trackingId, companyName, product) {
  const modal = document.getElementById('confirmationModal');
  if (!modal) return;

  document.getElementById('confTrackingId').innerText = trackingId;
  document.getElementById('confCompany').innerText = companyName;
  document.getElementById('confProduct').innerText = product;

  const waBtn = document.getElementById('confWhatsAppFollowup');
  if (waBtn) {
    const waText = encodeURIComponent(`Hello Pragyentra LLP Export Desk, I have submitted Enquiry ${trackingId} for ${product}. Would like to connect on WhatsApp.`);
    waBtn.href = `https://wa.me/919876543210?text=${waText}`;
  }

  modal.showModal();
}

// Modals Controller
function initModals() {
  document.querySelectorAll('.modal-close-btn, .modal-dismiss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('dialog');
      if (modal) modal.close();
    });
  });

  // Light-dismiss by clicking outside dialog
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        dialog.close();
      }
    });
  });
}

// Cookie Notice Banner
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const accepted = localStorage.getItem('pragyentra_cookie_consent');
  if (!accepted) {
    banner.classList.add('visible');
  }

  const acceptBtn = document.getElementById('acceptCookieBtn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('pragyentra_cookie_consent', 'true');
      banner.classList.remove('visible');
    });
  }
}

// Downloadable Company Profile
function initCompanyProfile() {
  const downloadBtns = document.querySelectorAll('.download-profile-trigger');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/company-profile');
        const json = await res.json();
        if (json.success) {
          openCompanyProfileModal(json.data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    });
  });
}

function openCompanyProfileModal(profile) {
  const modal = document.getElementById('companyProfileModal');
  const body = document.getElementById('companyProfileModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="border-bottom: 2px solid #0b192c; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h2 style="color:#0b192c; font-size:1.8rem; margin-bottom:4px;">${profile.companyName}</h2>
        <div style="color:#059669; font-weight:700; font-size:0.95rem;">${profile.tagline}</div>
        <div style="font-size:0.8125rem; color:#64748b; margin-top:4px;">${profile.registrationType}</div>
      </div>
      <div style="text-align:right; font-size:0.8125rem; color:#475569;">
        <strong>Document Code:</strong> DOC-PRG-2026/CP<br>
        <strong>Official Version:</strong> 1.0 (Verified)
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <h4 style="font-size:1.1rem; color:#0b192c; margin-bottom:8px;">1. Executive Summary & Business Scope</h4>
      <p style="font-size:0.9375rem; color:#334155; line-height:1.6;">
        ${profile.businessNature}. Pragyentra LLP bridges verified Indian agricultural producers, precision manufacturing facilities, and eco-friendly product manufacturers with international importers, wholesale distributors, and retail procurement teams worldwide.
      </p>
    </div>

    <div style="margin-bottom:24px;">
      <h4 style="font-size:1.1rem; color:#0b192c; margin-bottom:8px;">2. Primary Export Lines</h4>
      <ul style="list-style:none; padding-left:0; font-size:0.875rem; color:#334155; line-height:1.8;">
        ${profile.primaryExportSectors.map(s => `<li>✔ <strong>${s}</strong></li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom:24px;">
      <h4 style="font-size:1.1rem; color:#0b192c; margin-bottom:8px;">3. Key Maritime Gateways</h4>
      <ul style="list-style:none; padding-left:0; font-size:0.875rem; color:#334155; line-height:1.8;">
        ${profile.exportGateways.map(g => `<li>⚓ ${g}</li>`).join('')}
      </ul>
    </div>

    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
      <h5 style="color:#0b192c; margin-bottom:6px;">Quality & Compliance Commitment</h5>
      <p style="font-size:0.875rem; color:#475569; margin:0;">
        ${profile.qualityCommitment}
      </p>
    </div>

    <div style="font-size:0.875rem; color:#1e293b; border-top:1px solid #e2e8f0; padding-top:16px;">
      <strong>Official Communications:</strong> ${profile.contactChannels.email} &bull; <strong>Desk:</strong> ${profile.contactChannels.exportDesk}
    </div>
  `;

  modal.showModal();
}

// Admin Management Portal
async function loadEnquiries() {
  const tbody = document.getElementById('adminEnquiriesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">Loading enquiries...</td></tr>`;

  try {
    const res = await fetch('/api/enquiries');
    const json = await res.json();
    if (json.success) {
      appState.enquiries = json.data;
      renderAdminDashboard();
    }
  } catch (err) {
    console.error('Failed to load enquiries:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#b91c1c;">Failed to load enquiries.</td></tr>`;
  }
}

function renderAdminDashboard() {
  const enquiries = appState.enquiries;

  // KPIs
  const total = enquiries.length;
  const newCount = enquiries.filter(e => e.status === 'New').length;
  const inReviewCount = enquiries.filter(e => e.status === 'In Review').length;
  const quotedCount = enquiries.filter(e => e.status === 'Quoted').length;

  const totalEl = document.getElementById('kpiTotalEnquiries');
  const newEl = document.getElementById('kpiNewEnquiries');
  const reviewEl = document.getElementById('kpiReviewEnquiries');
  const quotedEl = document.getElementById('kpiQuotedEnquiries');

  if (totalEl) totalEl.innerText = total;
  if (newEl) newEl.innerText = newCount;
  if (reviewEl) reviewEl.innerText = inReviewCount;
  if (quotedEl) quotedEl.innerText = quotedCount;

  // Render Table
  const tbody = document.getElementById('adminEnquiriesTableBody');
  if (!tbody) return;

  if (enquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">No buyer enquiries logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = enquiries.map(e => `
    <tr>
      <td style="font-family:monospace; font-weight:700; color:#0b192c;">${e.id}</td>
      <td>${e.timestamp ? e.timestamp.substring(0, 10) : '-'}</td>
      <td>
        <strong>${e.fullName}</strong><br>
        <span style="font-size:0.75rem; color:#64748b;">${e.companyName} (${e.country})</span>
      </td>
      <td>
        <span style="font-size:0.8125rem;">${e.email}</span><br>
        <span style="font-size:0.75rem; color:#059669;">${e.phone}</span>
      </td>
      <td>
        <strong>${e.productName}</strong><br>
        <span style="font-size:0.75rem; color:#64748b;">Qty: ${e.quantity} | Incoterm: ${e.incoterm || 'FOB'}</span>
      </td>
      <td>
        <span class="status-badge ${e.status.replace(/\s+/g, '-')}">${e.status}</span>
      </td>
      <td>
        <select class="form-select" style="padding:4px 8px; font-size:0.75rem;" onchange="updateEnquiryStatus('${e.id}', this.value)">
          <option value="New" ${e.status === 'New' ? 'selected' : ''}>New</option>
          <option value="In Review" ${e.status === 'In Review' ? 'selected' : ''}>In Review</option>
          <option value="Quoted" ${e.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
          <option value="Closed" ${e.status === 'Closed' ? 'selected' : ''}>Closed</option>
        </select>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="viewEnquiryDetail('${e.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

async function updateEnquiryStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/enquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      const idx = appState.enquiries.findIndex(e => e.id === id);
      if (idx !== -1) {
        appState.enquiries[idx].status = newStatus;
        renderAdminDashboard();
      }
    }
  } catch (err) {
    console.error('Failed to update status:', err);
  }
}
window.updateEnquiryStatus = updateEnquiryStatus;

function viewEnquiryDetail(id) {
  const e = appState.enquiries.find(item => item.id === id);
  if (!e) return;

  alert(`ENQUIRY DETAILS: [${e.id}]\n\nBuyer: ${e.fullName}\nCompany: ${e.companyName}\nCountry: ${e.country}\nEmail: ${e.email}\nPhone: ${e.phone}\nProduct: ${e.productName}\nQuantity: ${e.quantity}\nIncoterm: ${e.incoterm}\n\nMessage:\n"${e.message}"\n\nNotes:\n${e.notes || 'None'}`);
}
window.viewEnquiryDetail = viewEnquiryDetail;

function initAdminPortal() {
  const exportCsvBtn = document.getElementById('adminExportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      window.location.href = '/api/enquiries/export-csv';
    });
  }

  // Add Product Modal
  const openAddProductBtn = document.getElementById('adminAddProductBtn');
  const addModal = document.getElementById('adminAddProductModal');
  const addForm = document.getElementById('adminAddProductForm');

  if (openAddProductBtn && addModal) {
    openAddProductBtn.addEventListener('click', () => {
      addModal.showModal();
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newProdName').value;
      const category = document.getElementById('newProdCategory').value;
      const hsCode = document.getElementById('newProdHsCode').value;
      const origin = document.getElementById('newProdOrigin').value;
      const moq = document.getElementById('newProdMoq').value;
      const desc = document.getElementById('newProdDesc').value;

      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            hsCode,
            origin,
            moq,
            description: desc,
            featured: true
          })
        });

        const json = await res.json();
        if (json.success) {
          addModal.close();
          addForm.reset();
          await loadProducts();
          alert('New product successfully published to export catalogue!');
        }
      } catch (err) {
        console.error('Failed to add product:', err);
      }
    });
  }
}

// Helper to escape single quotes in inline attributes
function escapeQuotes(str) {
  return (str || '').replace(/'/g, "\\'");
}
