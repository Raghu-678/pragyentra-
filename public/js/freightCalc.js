/**
 * Pragyentra LLP — Freight & Transit Estimator Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const originSelect = document.getElementById('calcOriginPort');
  const destSelect = document.getElementById('calcDestPort');
  const containerSelect = document.getElementById('calcContainerType');
  const categorySelect = document.getElementById('calcCategory');
  const calculateBtn = document.getElementById('calculateFreightBtn');
  const resultBox = document.getElementById('calcResultBox');
  const applyQuoteBtn = document.getElementById('applyEstimateToQuoteBtn');

  if (!calculateBtn) return;

  calculateBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const origin = originSelect.value;
    const dest = destSelect.value;
    const container = containerSelect.value;
    const category = categorySelect.value;

    calculateBtn.innerHTML = `
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      Calculating Transit & Specs...
    `;
    calculateBtn.disabled = true;

    try {
      const res = await fetch('/api/freight-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originPort: origin,
          destinationPort: dest,
          containerType: container,
          cargoCategory: category
        })
      });

      const data = await res.json();
      if (data.success) {
        const est = data.estimate;

        document.getElementById('resOriginName').innerText = `${est.origin} (${est.originState})`;
        document.getElementById('resDestName').innerText = `${est.destination}, ${est.destinationCountry}`;
        document.getElementById('resTransitDays').innerText = `~${est.transitDays} Days (Ocean Transit)`;
        document.getElementById('resContainerName').innerText = est.containerSpecs.name;
        document.getElementById('resVolume').innerText = `${est.containerSpecs.internalVolume} (Max Payload: ${est.containerSpecs.maxPayload})`;
        document.getElementById('resPallets').innerText = est.containerSpecs.standardPallets;

        const docsList = document.getElementById('resDocsList');
        if (docsList) {
          docsList.innerHTML = est.complianceDocs.map(doc => `<li>✔ ${doc}</li>`).join('');
        }

        resultBox.classList.add('visible');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error('Error calculating freight:', err);
    } finally {
      calculateBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        Calculate Transit & Compliance
      `;
      calculateBtn.disabled = false;
    }
  });

  if (applyQuoteBtn) {
    applyQuoteBtn.addEventListener('click', () => {
      // Navigate to Contact tab
      if (window.navigateToPage) {
        window.navigateToPage('contact');
      }

      // Pre-fill form fields
      setTimeout(() => {
        const prodSelect = document.getElementById('enquiryProduct');
        const qtyInput = document.getElementById('enquiryQuantity');
        const incotermInput = document.getElementById('enquiryIncoterm');
        const msgInput = document.getElementById('enquiryMessage');

        if (categorySelect && prodSelect) {
          // Select matching product or category
          for (let option of prodSelect.options) {
            if (option.text.toLowerCase().includes(categorySelect.value.toLowerCase().split(' ')[0])) {
              prodSelect.value = option.value;
              break;
            }
          }
        }

        if (containerSelect && qtyInput) {
          qtyInput.value = `1 x ${containerSelect.value === '40HC' ? "40' High Cube" : "20' General Purpose"}`;
        }

        if (incotermInput && destSelect) {
          incotermInput.value = `CIF ${destSelect.options[destSelect.selectedIndex].text.split('(')[0].trim()}`;
        }

        if (msgInput) {
          msgInput.value = `Requesting official export quotation for shipping via ${originSelect.options[originSelect.selectedIndex].text} to ${destSelect.options[destSelect.selectedIndex].text}. Please include SGS inspection and ocean freight rates.`;
        }

        const formCard = document.querySelector('.contact-form-card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    });
  }
});
