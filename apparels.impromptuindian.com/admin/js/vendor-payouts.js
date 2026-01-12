lucide.createIcons();

const mockPayouts = [
    { id: 1, vendor: 'Creative Printz', orderId: 'ORD-001', gross: 500, commission: 75, penalty: 0, net: 425, status: 'pending', commissionRate: 15 },
    { id: 2, vendor: 'Print Masters', orderId: 'ORD-002', gross: 680, commission: 102, penalty: 25, net: 553, status: 'pending', commissionRate: 15 },
    { id: 3, vendor: 'Design Hub', orderId: 'ORD-003', gross: 920, commission: 138, penalty: 0, net: 782, status: 'approved', commissionRate: 15 },
    { id: 4, vendor: 'Quick Print', orderId: 'ORD-004', gross: 1200, commission: 180, penalty: 50, net: 970, status: 'on-hold', commissionRate: 15 },
    { id: 5, vendor: 'Elite Designs', orderId: 'ORD-005', gross: 540, commission: 81, penalty: 0, net: 459, status: 'pending', commissionRate: 15 }
];

let payouts = [...mockPayouts];
let filteredPayouts = [...mockPayouts];
let selectedPayouts = new Set();
let currentPayoutId = null;

function renderSummary() {
    const pending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.net, 0);
    const processedToday = payouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.net, 0);
    const commission = payouts.reduce((sum, p) => sum + p.commission, 0);
    const penalties = payouts.reduce((sum, p) => sum + p.penalty, 0);

    document.getElementById('pending-payouts').textContent = '$' + pending.toLocaleString();
    document.getElementById('processed-today').textContent = '$' + processedToday.toLocaleString();
    document.getElementById('commission-earned').textContent = '$' + commission.toLocaleString();
    document.getElementById('penalties-collected').textContent = '$' + penalties.toLocaleString();
}

function filterPayouts() {
    const status = document.getElementById('status-filter').value;
    const search = document.getElementById('search-vendor').value.toLowerCase();

    filteredPayouts = payouts.filter(p => {
        const statusMatch = status === 'all' || p.status === status;
        const searchMatch = p.vendor.toLowerCase().includes(search) || p.orderId.toLowerCase().includes(search);
        return statusMatch && searchMatch;
    });

    document.getElementById('results-count').textContent = `Showing ${filteredPayouts.length} of ${payouts.length} payouts`;
    renderPayouts();
}

function renderPayouts() {
    const tbody = document.getElementById('payouts-table');

    tbody.innerHTML = filteredPayouts.map(p => {
        const statusClass = p.status === 'pending' ? 'status-pending' : p.status === 'approved' ? 'status-approved' : p.status === 'on-hold' ? 'status-hold' : 'status-rejected';
        const statusLabel = p.status === 'pending' ? 'Pending' : p.status === 'approved' ? 'Approved' : p.status === 'on-hold' ? 'On Hold' : 'Rejected';

        return `
            <tr>
                <td><input type="checkbox" class="payout-checkbox" data-id="${p.id}" ${selectedPayouts.has(p.id) ? 'checked' : ''} onchange="toggleSelect(${p.id})"></td>
                <td class="font-medium">${p.vendor}</td>
                <td>${p.orderId}</td>
                <td>$${p.gross.toLocaleString()}</td>
                <td class="text-red-400">-$${p.commission}</td>
                <td class="text-red-400">${p.penalty > 0 ? '-$' + p.penalty : '-'}</td>
                <td class="font-semibold text-green-400">$${p.net.toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td class="text-right">
                    <button class="action-btn" onclick="viewPayout(${p.id})"><i data-lucide="eye" class="w-4 h-4"></i>View</button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function toggleSelect(id) {
    if (selectedPayouts.has(id)) {
        selectedPayouts.delete(id);
    } else {
        selectedPayouts.add(id);
    }
}

function toggleSelectAll() {
    const checked = document.getElementById('select-all').checked;
    selectedPayouts.clear();
    if (checked) {
        filteredPayouts.forEach(p => selectedPayouts.add(p.id));
    }
    renderPayouts();
}

function viewPayout(id) {
    const payout = payouts.find(p => p.id === id);
    currentPayoutId = id;

    document.getElementById('modal-title').textContent = `Payout for ${payout.orderId}`;
    document.getElementById('modal-body').innerHTML = `
        <div class="payout-breakdown">
            <div class="breakdown-section">
                <h4 class="breakdown-title">Vendor Information</h4>
                <div class="breakdown-item"><span>Vendor Name:</span><span class="font-semibold">${payout.vendor}</span></div>
                <div class="breakdown-item"><span>Order ID:</span><span class="font-semibold">${payout.orderId}</span></div>
            </div>
            <div class="breakdown-section">
                <h4 class="breakdown-title">Payment Calculation</h4>
                <div class="breakdown-item"><span>Gross Amount:</span><span class="text-green-400 font-semibold">$${payout.gross.toLocaleString()}</span></div>
                <div class="breakdown-item"><span>Commission (${payout.commissionRate}%):</span><span class="text-red-400">-$${payout.commission}</span></div>
                ${payout.penalty > 0 ? `<div class="breakdown-item"><span>Late Penalty:</span><span class="text-red-400">-$${payout.penalty}</span></div>` : ''}
                <div class="breakdown-separator"></div>
                <div class="breakdown-item breakdown-total"><span>Net Payout:</span><span class="text-green-400 font-bold text-xl">$${payout.net.toLocaleString()}</span></div>
            </div>
            <div class="breakdown-section">
                <h4 class="breakdown-title">Status</h4>
                <div class="breakdown-item"><span>Current Status:</span><span class="status-badge ${payout.status === 'pending' ? 'status-pending' : payout.status === 'approved' ? 'status-approved' : 'status-hold'}">${payout.status.toUpperCase()}</span></div>
            </div>
        </div>
    `;

    document.getElementById('payout-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closePayoutModal() {
    document.getElementById('payout-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentPayoutId = null;
}

function approvePayout() {
    if (!currentPayoutId) return;
    const payout = payouts.find(p => p.id === currentPayoutId);
    payout.status = 'approved';
    closePayoutModal();
    renderSummary();
    filterPayouts();
    showToast('Payout approved successfully!');
}

function holdPayout() {
    if (!currentPayoutId) return;
    const payout = payouts.find(p => p.id === currentPayoutId);
    payout.status = 'on-hold';
    closePayoutModal();
    filterPayouts();
    showToast('Payout put on hold');
}

function rejectPayout() {
    if (!currentPayoutId) return;
    const payout = payouts.find(p => p.id === currentPayoutId);
    payout.status = 'rejected';
    closePayoutModal();
    filterPayouts();
    showToast('Payout rejected');
}

function bulkApprove() {
    if (selectedPayouts.size === 0) {
        showToast('No payouts selected', 'error');
        return;
    }

    selectedPayouts.forEach(id => {
        const payout = payouts.find(p => p.id === id);
        if (payout) payout.status = 'approved';
    });

    selectedPayouts.clear();
    renderSummary();
    filterPayouts();
    showToast(`${selectedPayouts.size} payouts approved!`);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    filterPayouts();
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('show')), 100);
});
