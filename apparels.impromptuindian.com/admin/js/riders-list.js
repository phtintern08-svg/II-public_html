// riders-list.js – admin rider management

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let riders = [];

async function fetchRiders() {
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/riders');
        if (response.ok) {
            let allRiders = await response.json();
            // Filter to show only approved (active) riders as requested
            riders = allRiders.filter(r => r.verification_status === 'active');
            document.getElementById('list-total-count').textContent = `(${riders.length})`;
            renderRiders();
        } else {
            showToast('Failed to fetch riders');
        }
    } catch (error) {
        console.error('Error fetching riders:', error);
        showToast('Network error');
    }
}

function renderRiders() {
    const tbody = document.getElementById('riders-table');
    tbody.innerHTML = '';

    const term = document.getElementById('search-rider').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;

    const filtered = riders.filter(r => {
        const matchTerm = (r.name || '').toLowerCase().includes(term) || (r.service_zone || '').toLowerCase().includes(term);
        const matchStatus = statusFilter === 'all' || r.verification_status === statusFilter;
        return matchTerm && matchStatus;
    });

    filtered.forEach(r => {
        const tr = document.createElement('tr');

        let actions = '';
        if (r.verification_status === 'verification_submitted' || r.verification_status === 'pending_verification') {
            actions += `<button class="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded mr-2 transition" onclick="approveRider(${r.id})" title="Approve"><i data-lucide="check" class="w-4 h-4"></i></button>`;
        }
        actions += `<button class="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition" onclick="editRider(${r.id})" title="Edit"><i data-lucide="edit" class="w-4 h-4"></i></button>`;

        // Status styling
        let statusClass = 'bg-gray-700 text-gray-300';
        if (r.verification_status === 'active') statusClass = 'bg-green-900/50 text-green-400 border border-green-700/50';
        else if (r.verification_status === 'offline') statusClass = 'bg-gray-700 text-gray-400';
        else if (r.verification_status === 'suspended') statusClass = 'bg-red-900/50 text-red-400 border border-red-700/50';
        else if (r.verification_status === 'verification_submitted') statusClass = 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50';
        else if (r.verification_status === 'pending_verification') statusClass = 'bg-orange-900/50 text-orange-400 border border-orange-700/50';

        tr.innerHTML = `
      <td class="py-3 px-4">${r.name}</td>
      <td class="py-3 px-4">${r.service_zone || '-'}</td>
      <td class="py-3 px-4"><span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${formatStatus(r.verification_status)}</span></td>
      <td class="py-3 px-4 text-right">${actions}</td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function formatStatus(status) {
    if (!status) return 'Unknown';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function filterRiders() {
    renderRiders();
}

async function approveRider(id) {
    if (!confirm('Are you sure you want to approve this rider?')) return;

    try {
        const response = await ImpromptuIndianApi.fetch(`/rider/approve/${id}`, { method: 'POST' });
        if (response.ok) {
            showToast('Rider approved successfully');
            fetchRiders();
        } else {
            showToast('Failed to approve rider');
        }
    } catch (error) {
        console.error('Error approving rider:', error);
        showToast('Network error');
    }
}

function openAddRiderModal() {
    document.getElementById('rider-name').value = '';
    document.getElementById('rider-zone').value = '';
    document.getElementById('rider-status').value = 'active';
    document.getElementById('modal-title').textContent = 'Add New Rider';
    document.getElementById('rider-modal').classList.remove('hidden');
}

function editRider(id) {
    const rider = riders.find(r => r.id === id);
    if (!rider) return;

    document.getElementById('rider-name').value = rider.name;
    document.getElementById('rider-zone').value = rider.service_zone || '';
    document.getElementById('rider-status').value = rider.verification_status;
    document.getElementById('modal-title').textContent = 'Edit Rider';
    document.getElementById('rider-modal').classList.remove('hidden');
    // Store ID for save
    document.getElementById('rider-modal').dataset.riderId = id;
}

function closeRiderModal() {
    document.getElementById('rider-modal').classList.add('hidden');
    delete document.getElementById('rider-modal').dataset.riderId;
}

async function saveRider() {
    // This is a placeholder for save functionality. 
    // Implementing full edit/add would require more backend endpoints.
    // For now, we'll just close the modal.
    showToast('Save functionality not fully implemented yet');
    closeRiderModal();
}

function refreshRiders() {
    fetchRiders();
    showToast('Riders list refreshed');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchRiders();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
