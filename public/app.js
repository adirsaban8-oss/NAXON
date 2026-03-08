let services = [];
let selected = new Set();
let expandedCard = null;
let mobileExpanded = false;

const iconMap = {
  'rocket': 'rocket', 'layout-grid': 'layout-grid', 'message-square': 'message-square',
  'brain': 'brain', 'zap': 'zap', 'cpu': 'cpu', 'bar-chart': 'bar-chart-2',
  'globe': 'globe', 'credit-card': 'credit-card', 'search': 'search',
  'trending-up': 'trending-up', 'message-circle': 'message-circle', 'map-pin': 'map-pin',
  'image': 'image', 'file-text': 'file-text', 'languages': 'languages',
  'users': 'users', 'settings': 'settings', 'box': 'box'
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
  const isExpanded = expandedCard === service.id;
  const iconClass = isAdditional ? 'additional-icon' : 'main-icon';
  const iconColor = isAdditional ? 'text-sky-400' : 'text-electric';
  const nameHe = service.nameHe || service.name;
  const descHe = service.descHe || '';
  const descEn = service.descEn || '';

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
        <h4 class="font-bold text-sm text-white/90 mb-0.5">${nameHe}</h4>
        <p class="text-[11px] text-surface-500 font-en mb-2">${service.name}</p>
        <p class="text-electric font-bold font-mono font-en text-lg">₪${service.price.toLocaleString()}</p>
      </div>
      <div class="service-desc ${isExpanded ? 'open' : ''}" id="desc-${service.id}">
        <div class="service-desc-inner">
          <p class="text-xs text-surface-300 leading-relaxed mb-1">${descHe}</p>
          <p class="text-[10px] text-surface-600 font-en leading-relaxed">${descEn}</p>
        </div>
      </div>
      <button onclick="event.stopPropagation(); toggleDesc('${service.id}')" class="relative z-[1] mt-3 text-[10px] text-electric/60 hover:text-electric transition-colors flex items-center gap-1 group">
        <i data-lucide="${isExpanded ? 'chevron-up' : 'info'}" class="w-3 h-3"></i>
        <span>${isExpanded ? 'הסתר פרטים' : 'פרטים נוספים'}</span>
      </button>
    </div>
  `;
}

function toggleDesc(id) {
  const desc = document.getElementById(`desc-${id}`);
  if (!desc) return;

  if (expandedCard === id) {
    desc.classList.remove('open');
    expandedCard = null;
  } else {
    // Close previous
    if (expandedCard) {
      const prev = document.getElementById(`desc-${expandedCard}`);
      if (prev) prev.classList.remove('open');
    }
    desc.classList.add('open');
    expandedCard = id;
  }

  // Re-render to update button text/icon
  renderServices();
  lucide.createIcons();
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
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const vat = Math.round(subtotal * 0.18);
  const total = subtotal + vat;
  const count = selectedServices.length;

  updatePanel('desktop', selectedServices, subtotal, vat, total, count);
  updatePanel('mobile', selectedServices, subtotal, vat, total, count);

  // Mobile bar
  const mobileBar = document.getElementById('mobile-quote-bar');
  document.getElementById('mobile-count').textContent = count;
  const mobileTotal = document.getElementById('mobile-total');
  mobileTotal.textContent = `₪${total.toLocaleString()}`;
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

function updatePanel(target, selectedServices, subtotal, vat, total, count) {
  const itemsEl = document.getElementById(`quote-items-${target}`);
  const totalsEl = document.getElementById(`quote-totals-${target}`);
  const actionsEl = document.getElementById(`quote-actions-${target}`);

  if (count === 0) {
    itemsEl.innerHTML = `
      <p class="text-surface-600 text-sm">בחר שירותים כדי לבנות הצעת מחיר...</p>
      <p class="text-surface-700 text-xs font-en">Select services to build your quote...</p>
    `;
    if (totalsEl) totalsEl.classList.add('hidden');
    if (actionsEl) actionsEl.classList.add('hidden');
    return;
  }

  itemsEl.innerHTML = selectedServices.map(s => `
    <div class="flex justify-between items-center py-1.5">
      <div>
        <span class="text-sm text-surface-200">${s.nameHe || s.name}</span>
        <span class="text-[10px] text-surface-600 font-en mr-2">${s.name}</span>
      </div>
      <span class="text-sm font-mono font-en text-white/80">₪${s.price.toLocaleString()}</span>
    </div>
  `).join('');

  if (totalsEl) {
    totalsEl.classList.remove('hidden');
    const subEl = document.getElementById(`subtotal-${target}`);
    const vatEl = document.getElementById(`vat-${target}`);
    const totalEl = document.getElementById(`total-${target}`);
    subEl.textContent = `₪${subtotal.toLocaleString()}`;
    vatEl.textContent = `₪${vat.toLocaleString()}`;
    totalEl.textContent = `₪${total.toLocaleString()}`;
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
  expandedCard = null;
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
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const vat = Math.round(subtotal * 0.18);
  const total = subtotal + vat;

  const serviceList = selectedServices.map(s => `• ${s.nameHe || s.name} / ${s.name}`).join('\n');
  const message = `Hello,\n\nI would like a quote for:\n\n${serviceList}\n\nSubtotal: ₪${subtotal.toLocaleString()}\nVAT (18%): ₪${vat.toLocaleString()}\n\nTotal including VAT:\n₪${total.toLocaleString()}`;

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
