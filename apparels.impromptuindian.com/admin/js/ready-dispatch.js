// ready-dispatch.js – admin dispatch queue (mock)

function showToast(msg) {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  txt.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock dispatch data
let dispatchQueue = [
  { id: 1028, vendor: 'DTF Prints Co.', qc: 'pending', readySince: '2025-11-20' },
  { id: 1029, vendor: 'Screen Masters', qc: 'approved', readySince: '2025-11-19' },
  { id: 1030, vendor: 'Sublime Studios', qc: 'pending', readySince: '2025-11-21' },
  { id: 1031, vendor: 'Embroidery Hub', qc: 'approved', readySince: '2025-11-22' }
];

function renderDispatch() {
  const tbody = document.getElementById('dispatch-table');
  tbody.innerHTML = '';
  dispatchQueue.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.vendor}</td>
      <td><span class="status-${d.qc}">${d.qc}</span></td>
      <td>${d.readySince}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="openDispatchModal(${d.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterDispatch() {
  const qc = document.getElementById('qc-filter').value;
  const term = document.getElementById('search-dispatch').value.toLowerCase();
  const filtered = dispatchQueue.filter(d => {
    const matchQC = qc === 'all' || d.qc === qc;
    const matchTerm = d.id.toString().includes(term) || d.vendor.toLowerCase().includes(term);
    return matchQC && matchTerm;
  });
  const tbody = document.getElementById('dispatch-table');
  tbody.innerHTML = '';
  filtered.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.vendor}</td>
      <td><span class="status-${d.qc}">${d.qc}</span></td>
      <td>${d.readySince}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="openDispatchModal(${d.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function openDispatchModal(id) {
  const order = dispatchQueue.find(d => d.id === id);
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div class="space-y-4">
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Vendor:</strong> ${order.vendor}</p>
      <p><strong>QC Status:</strong> <span class="status-${order.qc}">${order.qc}</span></p>
      <p><strong>Ready Since:</strong> ${order.readySince}</p>
      <div class="mt-4">
        <label class="block mb-2 font-semibold">Assign Rider</label>
        <select id="rider-select" class="w-full p-2 bg-gray-800 rounded">
          <option value="">Select rider</option>
          <option value="John Doe">John Doe</option>
          <option value="Jane Smith">Jane Smith</option>
          <option value="Mike Johnson">Mike Johnson</option>
        </select>
      </div>
      <div class="mt-4">
        <label class="block mb-2 font-semibold">Admin Notes</label>
        <textarea id="admin-notes" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Add notes..."></textarea>
      </div>
    </div>
  `;
  document.getElementById('modal-title').textContent = `Dispatch #${order.id}`;
  document.getElementById('dispatch-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeDispatchModal() {
  document.getElementById('dispatch-modal').classList.add('hidden');
}

function assignRider() {
  const rider = document.getElementById('rider-select')?.value;
  if (!rider) {
    showToast('Please select a rider');
    return;
  }
  showToast(`Rider ${rider} assigned`);
  closeDispatchModal();
}

function failQC() {
  showToast('QC failed - vendor notified');
  closeDispatchModal();
}

function refreshDispatch() {
  renderDispatch();
  showToast('Dispatch queue refreshed');
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderDispatch();
  onScroll();
  window.addEventListener('scroll', onScroll);
});
