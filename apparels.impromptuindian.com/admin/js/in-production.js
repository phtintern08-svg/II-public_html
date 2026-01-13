// in-production.js – admin production monitoring 

function showToast(msg) {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  if (!toast || !txt) return;
  txt.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Global production data
let production = [];

async function fetchProduction() {
  try {
    const response = await ImpromptuIndianApi.fetch('/admin/production-orders');
    if (!response.ok) throw new Error('Failed to fetch production data');
    production = await response.json();
    renderProduction();
  } catch (e) {
    console.error('Error fetching production:', e);
    showToast('Failed to load production data');
  }
}

function renderProduction() {
  const tbody = document.getElementById('production-table');
  if (!tbody) return;
  tbody.innerHTML = '';
  production.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/5 transition-colors duration-200';
    tr.innerHTML = `
      <td class="px-4 py-4 font-mono text-sm text-blue-400">#${p.id}</td>
      <td class="px-4 py-4 font-semibold text-gray-100">${p.vendor}</td>
      <td class="px-4 py-4">
        <span class="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase tracking-wider border border-yellow-500/20">${p.stage}</span>
      </td>
      <td class="px-4 py-4">
        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-400"></i>
          ${p.deadline}
        </div>
      </td>
      <td class="px-4 py-4">
        <div class="w-full max-w-[120px]">
          <div class="flex justify-between items-center mb-1">
             <span class="text-[10px] font-bold text-gray-500 uppercase">${p.progress}% Complete</span>
          </div>
          <div class="progress-bar h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="progress-fill h-full bg-blue-500" style="width:${p.progress}%"></div>
          </div>
        </div>
      </td>
      <td class="px-4 py-4 text-right">
        <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" onclick="openProdModal(${p.id})">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterProduction() {
  const stage = document.getElementById('stage-filter').value;
  const term = document.getElementById('search-prod').value.toLowerCase();
  const filtered = production.filter(p => {
    const matchStage = stage === 'all' || p.stage.toLowerCase().includes(stage.toLowerCase().replace('_', ' '));
    const matchTerm = p.id.toString().includes(term) || p.vendor.toLowerCase().includes(term);
    return matchStage && matchTerm;
  });
  const tbody = document.getElementById('production-table');
  if (!tbody) return;
  tbody.innerHTML = '';
  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.vendor}</td>
      <td>${p.stage}</td>
      <td>${p.deadline}</td>
      <td>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
        <span>${p.progress}%</span>
      </td>
      <td class="text-right">
        <button class="btn-primary" onclick="openProdModal(${p.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function openProdModal(id) {
  const prod = production.find(p => p.id === id);
  const body = document.getElementById('modal-body');
  if (!body || !prod) return;
  body.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-6">
        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="activity" class="w-4 h-4"></i> Tracking Status
          </h3>
          <div class="grid grid-cols-2 gap-y-4 text-sm">
            <div class="text-gray-500">Assignment ID</div>
            <div class="font-mono text-blue-300">#${prod.id}</div>
            
            <div class="text-gray-500">Contracted Vendor</div>
            <div class="font-semibold text-gray-100">${prod.vendor}</div>
            
            <div class="text-gray-500">Current Phase</div>
            <div>
               <span class="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase border border-yellow-500/20">${prod.stage}</span>
            </div>
            
            <div class="text-gray-500">Deadline</div>
            <div class="flex items-center gap-2 text-blue-200">
               <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
               ${prod.deadline}
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-green-400 mb-4 uppercase tracking-widest">
            <i data-lucide="trending-up" class="w-4 h-4"></i> Completion Ratio
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-end">
               <span class="text-2xl font-bold text-white">${prod.progress}%</span>
               <span class="text-xs text-gray-500 font-medium pb-1 uppercase tracking-tighter">Production Completion</span>
            </div>
            <div class="progress-bar h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5 p-0.5">
               <div class="progress-fill h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style="width: ${prod.progress}%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="message-square" class="w-4 h-4"></i> Operations Log
          </h3>
          <textarea id="admin-notes" class="w-full p-4 bg-gray-900 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" rows="4" placeholder="Log details of vendor communication or production issues..."></textarea>
        </div>

        <div class="bg-blue-600/5 rounded-xl p-5 border border-blue-500/20">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="camera" class="w-4 h-4"></i> Visual Proofs
          </h3>
          <div class="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
             <i data-lucide="image" class="w-6 h-6 text-gray-600 mb-2"></i>
             <p class="text-xs text-gray-500 font-medium">No production photos uploaded yet</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-title').textContent = `Production #${prod.id}`;
  document.getElementById('prod-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeProdModal() {
  document.getElementById('prod-modal').classList.add('hidden');
}

function reassignVendor() {
  showToast('Vendor reassignment initiated');
  closeProdModal();
}

function sendReminder() {
  showToast('Reminder sent to vendor');
  closeProdModal();
}

function refreshProduction() {
  fetchProduction();
  showToast('Production data refreshed');
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fetchProduction();
  onScroll();
  window.addEventListener('scroll', onScroll);
});
