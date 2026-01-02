// rider-assignments.js – admin delivery assignment tracking (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock assignments data
let assignments = [
    { id: 1031, vendor: 'DTF Prints Co.', rider: 'John Doe', status: 'pending', address: '123 Main St, North Zone' },
    { id: 1032, vendor: 'Screen Masters', rider: 'Jane Smith', status: 'picked-up', address: '456 Oak Ave, South Zone' },
    { id: 1033, vendor: 'Sublime Studios', rider: 'Mike Johnson', status: 'out-for-delivery', address: '789 Pine Rd, East Zone' },
    { id: 1034, vendor: 'Embroidery Hub', rider: 'Sarah Williams', status: 'delivered', address: '321 Elm St, West Zone' }
];

function renderAssignments() {
    const tbody = document.getElementById('assignments-table');
    tbody.innerHTML = '';
    assignments.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.vendor}</td>
      <td>${a.rider}</td>
      <td><span class="status-badge status-${a.status}">${a.status.replace('-', ' ')}</span></td>
      <td>${a.address}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewAssignment(${a.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function filterAssignments() {
    const status = document.getElementById('status-filter').value;
    const term = document.getElementById('search-assignment').value.toLowerCase();
    const filtered = assignments.filter(a => {
        const matchStatus = status === 'all' || a.status === status;
        const matchTerm = a.id.toString().includes(term) || a.vendor.toLowerCase().includes(term) || a.rider.toLowerCase().includes(term);
        return matchStatus && matchTerm;
    });
    const tbody = document.getElementById('assignments-table');
    tbody.innerHTML = '';
    filtered.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.vendor}</td>
      <td>${a.rider}</td>
      <td><span class="status-badge status-${a.status}">${a.status.replace('-', ' ')}</span></td>
      <td>${a.address}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewAssignment(${a.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function viewAssignment(id) {
    const assignment = assignments.find(a => a.id === id);
    const body = document.getElementById('modal-body');
    body.innerHTML = `
    <div class="space-y-3">
      <p><strong>Order ID:</strong> ${assignment.id}</p>
      <p><strong>Vendor:</strong> ${assignment.vendor}</p>
      <p><strong>Rider:</strong> ${assignment.rider}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${assignment.status}">${assignment.status.replace('-', ' ')}</span></p>
      <p><strong>Customer Address:</strong> ${assignment.address}</p>
      <div class="mt-4">
        <label class="block mb-2 font-semibold">Delivery Instructions:</label>
        <textarea id="delivery-instructions" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Enter special delivery instructions..."></textarea>
      </div>
      <div class="mt-4">
        <label class="block mb-2 font-semibold">Admin Notes:</label>
        <textarea id="admin-notes" class="w-full p-2 bg-gray-800 text-white rounded" rows="2" placeholder="Internal notes (not visible to rider)..."></textarea>
      </div>
    </div>
  `;
    document.getElementById('modal-title').textContent = `Assignment #${assignment.id}`;
    document.getElementById('assignment-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeAssignmentModal() {
    document.getElementById('assignment-modal').classList.add('hidden');
}

function reassignRider() {
    showToast('Rider reassignment initiated');
    closeAssignmentModal();
}

function sendInstructions() {
    const instructions = document.getElementById('delivery-instructions')?.value;
    if (!instructions) {
        showToast('Please enter delivery instructions');
        return;
    }
    showToast('Instructions sent to rider');
    closeAssignmentModal();
}

function refreshAssignments() {
    renderAssignments();
    showToast('Assignments refreshed');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    renderAssignments();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
