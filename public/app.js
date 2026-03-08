let services = [];
let selected = new Set();
let expandedCards = new Set();
let mobileExpanded = false;

const iconMap = {
  'rocket': 'rocket', 'layout-grid': 'layout-grid', 'message-square': 'message-square',
  'brain': 'brain', 'zap': 'zap', 'cpu': 'cpu', 'bar-chart': 'bar-chart-2',
  'globe': 'globe', 'credit-card': 'credit-card', 'search': 'search',
  'trending-up': 'trending-up', 'message-circle': 'message-circle', 'map-pin': 'map-pin',
  'image': 'image', 'file-text': 'file-text', 'languages': 'languages',
  'users': 'users', 'settings': 'settings', 'layout-dashboard': 'layout-dashboard',
  'smartphone': 'smartphone', 'box': 'box'
};

async function init() {
  try {
    const res = await fetch('/api/services');
    services = await res.json();
    renderServices();
    lucide.createIcons();
  } catch (err) {
    console.error('Failed to load services:', err);
  }
}

function renderServices() {
  const mainContainer = document.getElementById('main-services');
  const additionalContainer = document.getElementById('additional-services');
  const mainServices = services.filter(s => s.category === 'main');
  const additionalServices = services.filter(s => s.category === 'additional');
  mainContainer.innerHTML = mainServices.map(s => createCard(s, false)).join('');
  additionalContainer.innerHTML = additionalServices.map(s => createCard(s, true)).join('');
}

function createCard(service, isAdditional) {
  const iconName = iconMap[service.icon] || 'box';
  const isSelected = selected.has(service.id);
  const isExpanded = expandedCards.has(service.id);
  const iconClass = isAdditional ? 'additional-icon' : 'main-icon';
  const iconColor = isAdditional ? 'text-sky-400' : 'text-electric';
  const nameHe = service.nameHe || service.name;
  const descHe = service.descHe || '';
  const descEn = service.descEn || '';

  let priceHtml;
  if (service.customPrice) {
    priceHtml = `<span class="text-[10px] sm:text-xs font-sans">${service.priceLabel || 'בהתאמה אישית'}</span>`;
  } else {
    priceHtml = `<span class="text-[8px] sm:text-[10px] text-electric/50 font-sans font-normal block leading-tight">החל מ־</span>₪${service.price.toLocaleString()}`;
  }

  return `
    <div class="service-card ${isAdditional ? 'additional-card' : ''} ${isSelected ? 'selected' : ''}"
         id="card-${service.id}">
      <div class="check-indicator" onclick="event.stopPropagation(); toggleService('${service.id}')">
        ${isSelected ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}
      </div>
      <div onclick="toggleService('${service.id}')" class="relative z-[1]">
        <div class="card-icon ${iconClass}">
          <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor}"></i>
        </div>
        <h4 class="font-bold text-xs sm:text-sm text-white/90 mb-0.5 leading-tight">${nameHe}</h4>
        <p class="text-[9px] sm:text-[11px] text-surface-500 font-en mb-1.5">${service.name}</p>
        <p class="text-electric font-bold font-mono font-en text-base sm:text-lg">${priceHtml}</p>
      </div>
      <div class="service-desc ${isExpanded ? 'open' : ''}" id="desc-${service.id}">
        <div class="service-desc-inner">
          <p class="text-xs text-surface-300 leading-relaxed mb-1">${descHe}</p>
          <p class="text-[10px] text-surface-600 font-en leading-relaxed">${descEn}</p>
        </div>
      </div>
      <button onclick="event.stopPropagation(); toggleDesc('${service.id}')" class="desc-toggle-btn relative z-[1] mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-electric/60 hover:text-electric transition-colors flex items-center gap-1 group">
        <i data-lucide="${isExpanded ? 'chevron-up' : 'info'}" class="w-3 h-3"></i>
        <span>${isExpanded ? 'הסתר פרטים' : 'פרטים נוספים'}</span>
      </button>
    </div>
  `;
}

function toggleDesc(id) {
  const desc = document.getElementById(`desc-${id}`);
  if (!desc) return;

  const card = document.getElementById(`card-${id}`);
  const btn = card ? card.querySelector('.desc-toggle-btn') : null;

  if (expandedCards.has(id)) {
    desc.classList.remove('open');
    expandedCards.delete(id);
    if (btn) {
      btn.innerHTML = '<i data-lucide="info" class="w-3 h-3"></i><span>פרטים נוספים</span>';
      lucide.createIcons({ nodes: [btn] });
    }
  } else {
    desc.classList.add('open');
    expandedCards.add(id);
    if (btn) {
      btn.innerHTML = '<i data-lucide="chevron-up" class="w-3 h-3"></i><span>הסתר פרטים</span>';
      lucide.createIcons({ nodes: [btn] });
    }
  }
}

function toggleService(id) {
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    selected.add(id);
  }

  const card = document.getElementById(`card-${id}`);
  if (card) {
    const service = services.find(s => s.id === id);
    const isAdditional = service.category === 'additional';
    card.className = `service-card ${isAdditional ? 'additional-card' : ''} ${selected.has(id) ? 'selected' : ''}`;
    const indicator = card.querySelector('.check-indicator');
    indicator.innerHTML = selected.has(id) ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : '';
    lucide.createIcons({ nodes: [indicator] });
  }

  updateQuote();
}

function updateQuote() {
  const selectedServices = services.filter(s => selected.has(s.id));
  const hasCustomPrice = selectedServices.some(s => s.customPrice);
  // Prices are VAT-inclusive. Extract VAT from total (exclude custom-priced items).
  const total = selectedServices.filter(s => !s.customPrice).reduce((sum, s) => sum + s.price, 0);
  const beforeVat = Math.round(total / 1.18);
  const vat = total - beforeVat;
  const subtotal = beforeVat;
  const count = selectedServices.length;

  updatePanel('desktop', selectedServices, subtotal, vat, total, count, hasCustomPrice);
  updatePanel('mobile', selectedServices, subtotal, vat, total, count, hasCustomPrice);

  // Mobile bar
  const mobileBar = document.getElementById('mobile-quote-bar');
  const countEl = document.getElementById('mobile-count');
  countEl.textContent = count;
  countEl.classList.add('count-animate');
  setTimeout(() => countEl.classList.remove('count-animate'), 300);

  const mobileTotal = document.getElementById('mobile-total');
  mobileTotal.textContent = total > 0 ? `₪${total.toLocaleString()}${hasCustomPrice ? '+' : ''}` : (hasCustomPrice ? 'בהתאמה אישית' : '₪0');
  mobileTotal.classList.add('price-animate');
  setTimeout(() => mobileTotal.classList.remove('price-animate'), 350);

  if (count > 0) {
    mobileBar.classList.remove('translate-y-full');
  } else {
    mobileBar.classList.add('translate-y-full');
    mobileExpanded = false;
    document.getElementById('mobile-panel-expanded').classList.add('hidden');
    document.getElementById('mobile-chevron').style.transform = '';
  }
}

function updatePanel(target, selectedServices, subtotal, vat, total, count, hasCustomPrice) {
  const itemsEl = document.getElementById(`quote-items-${target}`);
  const totalsEl = document.getElementById(`quote-totals-${target}`);
  const actionsEl = document.getElementById(`quote-actions-${target}`);

  if (count === 0) {
    itemsEl.innerHTML = `
      <div class="text-center py-4">
        <i data-lucide="package" class="w-8 h-8 text-surface-700 mx-auto mb-2"></i>
        <p class="text-surface-500 text-sm font-medium">לא נבחרו שירותים עדיין</p>
        <p class="text-surface-600 text-[11px] mt-1">סמנו שירותים מהרשימה כדי לבנות הצעת מחיר</p>
        <p class="text-surface-700 text-[10px] font-en mt-0.5">Select services above to build your quote</p>
      </div>
    `;
    lucide.createIcons({ nodes: [itemsEl] });
    if (totalsEl) totalsEl.classList.add('hidden');
    if (actionsEl) actionsEl.classList.add('hidden');
    return;
  }

  itemsEl.innerHTML = selectedServices.map((s, i) => `
    <div class="quote-item-enter flex justify-between items-center py-1.5" style="animation-delay: ${i * 50}ms">
      <div>
        <span class="text-sm text-surface-200">${s.nameHe || s.name}</span>
        <span class="text-[10px] text-surface-600 font-en mr-2">${s.name}</span>
      </div>
      <span class="text-sm font-mono font-en text-white/80">${s.customPrice ? '<span class="text-[10px] font-sans text-electric/70">בהתאמה אישית</span>' : `₪${s.price.toLocaleString()}`}</span>
    </div>
  `).join('');

  if (totalsEl) {
    totalsEl.classList.remove('hidden');
    const subEl = document.getElementById(`subtotal-${target}`);
    const vatEl = document.getElementById(`vat-${target}`);
    const totalEl = document.getElementById(`total-${target}`);
    subEl.textContent = `₪${subtotal.toLocaleString()}`;
    vatEl.textContent = `₪${vat.toLocaleString()}`;
    const suffix = hasCustomPrice ? '+' : '';
    totalEl.textContent = total > 0 ? `₪${total.toLocaleString()}${suffix}` : (hasCustomPrice ? 'בהתאמה אישית' : '₪0');
    totalEl.classList.add('price-animate');
    setTimeout(() => totalEl.classList.remove('price-animate'), 350);
  }

  if (actionsEl) actionsEl.classList.remove('hidden');
}

function toggleMobilePanel() {
  mobileExpanded = !mobileExpanded;
  const panel = document.getElementById('mobile-panel-expanded');
  const chevron = document.getElementById('mobile-chevron');
  if (mobileExpanded) {
    panel.classList.remove('hidden');
    chevron.style.transform = 'rotate(180deg)';
  } else {
    panel.classList.add('hidden');
    chevron.style.transform = '';
  }
}

function resetSelection() {
  selected.clear();
  expandedCards.clear();
  renderServices();
  updateQuote();
  lucide.createIcons();
}

async function downloadPDF() {
  if (selected.size === 0) return;
  try {
    const res = await fetch('/api/quote/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedServices: Array.from(selected) })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NAXON-Quote.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF download failed:', err);
  }
}

function sendQuote() {
  if (selected.size === 0) return;
  const selectedServices = services.filter(s => selected.has(s.id));
  const pricedServices = selectedServices.filter(s => !s.customPrice);
  const customServices = selectedServices.filter(s => s.customPrice);
  const total = pricedServices.reduce((sum, s) => sum + s.price, 0);
  const beforeVat = Math.round(total / 1.18);
  const vatAmount = total - beforeVat;

  const serviceList = selectedServices.map(s =>
    `• ${s.nameHe || s.name} / ${s.name}${s.customPrice ? ' (בהתאמה אישית)' : ''}`
  ).join('\n');

  let pricing = '';
  if (total > 0) {
    pricing = `\n\nסה״כ כולל מע״מ: ₪${total.toLocaleString()}${customServices.length ? '+' : ''}\nמתוכם מע״מ (18%): ₪${vatAmount.toLocaleString()}\nלפני מע״מ: ₪${beforeVat.toLocaleString()}`;
  }
  if (customServices.length) {
    pricing += `\n\n* ${customServices.map(s => s.nameHe).join(', ')} — תמחור בהתאמה אישית`;
  }

  const message = `שלום,\n\nאשמח לקבל הצעת מחיר עבור:\n\n${serviceList}${pricing}`;

  document.getElementById('quote-message').value = message;
  const encoded = encodeURIComponent(message);
  document.getElementById('whatsapp-link').href = `https://wa.me/?text=${encoded}`;

  const modal = document.getElementById('send-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeModal() {
  const modal = document.getElementById('send-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function copyMessage() {
  const textarea = document.getElementById('quote-message');
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> הועתק!';
    lucide.createIcons({ nodes: [btn] });
    setTimeout(() => {
      btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i> העתק הודעה';
      lucide.createIcons({ nodes: [btn] });
    }, 2000);
  });
}

document.getElementById('send-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

init();
