let adminPassword = '';
let services = [];

async function login() {
  const pw = document.getElementById('password').value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    if (data.success) {
      adminPassword = pw;
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      loadServices();
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
  } catch (err) {
    console.error(err);
  }
}

function logout() {
  adminPassword = '';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('password').value = '';
}

document.getElementById('password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

async function loadServices() {
  const res = await fetch('/api/services');
  services = await res.json();
  renderServices();
}

function renderServices() {
  const container = document.getElementById('services-list');
  const mainServices = services.filter(s => s.category === 'main');
  const additionalServices = services.filter(s => s.category === 'additional');

  container.innerHTML = `
    <h3 class="text-xs font-semibold text-electric/60 tracking-wider uppercase mt-2">שירותים מרכזיים</h3>
    ${mainServices.map(s => serviceRow(s)).join('')}
    <h3 class="text-xs font-semibold text-sky-400/60 tracking-wider uppercase mt-6">שירותים נוספים</h3>
    ${additionalServices.map(s => serviceRow(s)).join('')}
  `;
}

function serviceRow(s) {
  return `
    <div class="bg-surface-900 rounded-xl p-4 border border-white/5" id="row-${s.id}">
      <div class="flex items-center justify-between gap-4 mb-2">
        <div class="flex-1 min-w-0">
          <input type="text" value="${s.nameHe || s.name}" class="bg-transparent text-sm text-white font-bold w-full focus:outline-none focus:text-electric transition-colors mb-0.5" id="nameHe-${s.id}">
          <input type="text" value="${s.name}" dir="ltr" class="bg-transparent text-xs text-surface-500 font-en w-full focus:outline-none focus:text-electric transition-colors" id="name-${s.id}">
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="flex items-center gap-1">
            <span class="text-surface-500 text-sm">₪</span>
            <input type="number" value="${s.price}" class="bg-surface-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:outline-none focus:border-electric/50 font-mono font-en" id="price-${s.id}">
          </div>
          <button onclick="updateService('${s.id}')" class="text-xs bg-electric/10 text-electric px-3 py-1.5 rounded-lg hover:bg-electric/20 transition-all">שמור</button>
          <button onclick="deleteService('${s.id}')" class="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all">מחק</button>
        </div>
      </div>
    </div>
  `;
}

async function updateService(id) {
  const nameHe = document.getElementById(`nameHe-${id}`).value;
  const name = document.getElementById(`name-${id}`).value;
  const price = parseInt(document.getElementById(`price-${id}`).value);

  await fetch(`/api/admin/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword, service: { name, nameHe, price } })
  });
  loadServices();
}

async function deleteService(id) {
  if (!confirm('למחוק את השירות הזה?')) return;
  await fetch(`/api/admin/services/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword })
  });
  loadServices();
}

async function addService() {
  const nameHe = document.getElementById('new-nameHe').value.trim();
  const name = document.getElementById('new-name').value.trim();
  const price = parseInt(document.getElementById('new-price').value);
  const category = document.getElementById('new-category').value;
  const descHe = document.getElementById('new-descHe').value.trim();
  const descEn = document.getElementById('new-descEn').value.trim();

  if (!name || !nameHe || !price) return;

  await fetch('/api/admin/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminPassword,
      service: { name, nameHe, descHe, descEn, price, category, icon: 'box' }
    })
  });

  document.getElementById('new-nameHe').value = '';
  document.getElementById('new-name').value = '';
  document.getElementById('new-descHe').value = '';
  document.getElementById('new-descEn').value = '';
  document.getElementById('new-price').value = '';
  loadServices();
}
