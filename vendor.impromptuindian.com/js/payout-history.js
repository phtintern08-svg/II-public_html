// Payout History JavaScript
lucide.createIcons();

const mockPayouts = [
    { id: 'TXN-2024-011', date: new Date('2024-11-15'), amount: 8500, method: 'Bank Transfer', status: 'paid', account: '••••1234' },
    { id: 'TXN-2024-010', date: new Date('2024-11-01'), amount: 7200, method: 'UPI', status: 'paid', account: 'vendor@upi' },
    { id: 'TXN-2024-009', date: new Date('2024-10-15'), amount: 9100, method: 'Bank Transfer', status: 'paid', account: '••••1234' },
    { id: 'TXN-2024-008', date: new Date('2024-10-01'), amount: 6800, method: 'UPI', status: 'paid', account: 'vendor@upi' },
    { id: 'TXN-2024-007', date: new Date('2024-09-15'), amount: 7500, method: 'Bank Transfer', status: 'paid', account: '••••1234' },
    { id: 'TXN-2024-006', date: new Date('2024-09-01'), amount: 2450, method: 'UPI', status: 'processing', account: 'vendor@upi' }
];

let payouts = [...mockPayouts];
let filteredPayouts = [...mockPayouts];
let currentPayoutId = null;

function renderSummary() {
    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const inProcess = payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);
    const lastPayout = payouts.find(p => p.status === 'paid');

    document.getElementById('total-paid').textContent = '$' + totalPaid.toLocaleString();
    document.getElementById('in-process').textContent = '$' + inProcess.toLocaleString();
    document.getElementById('last-payout-date').textContent = lastPayout ? lastPayout.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
    document.getElementById('total-count').textContent = payouts.length;
}

function filterPayouts() {
    const dateFilter = document.getElementById('date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredPayouts = payouts.filter(payout => {
        const daysDiff = Math.floor((new Date() - payout.date) / (1000 * 60 * 60 * 24));
        let dateMatch = true;

        if (dateFilter === 'month' && daysDiff > 30) dateMatch = false;
        if (dateFilter === 'quarter' && daysDiff > 90) dateMatch = false;
        if (dateFilter === 'year' && daysDiff > 365) dateMatch = false;

        const statusMatch = statusFilter === 'all' || payout.status === statusFilter;
        const searchMatch = payout.id.toLowerCase().includes(searchTerm);

        return dateMatch && statusMatch && searchMatch;
    });

    document.getElementById('results-count').textContent = `Showing ${filteredPayouts.length} of ${payouts.length} payouts`;
    renderPayouts();
}

function renderPayouts() {
    const tbody = document.getElementById('payout-table');

    const html = filteredPayouts.map(payout => {
        const statusClass = payout.status === 'paid' ? 'status-paid' : payout.status === 'processing' ? 'status-processing' : 'status-hold';
        const statusLabel = payout.status === 'paid' ? 'Paid' : payout.status === 'processing' ? 'Processing' : 'On Hold';

        return `
            <tr>
                <td class="font-medium">${payout.id}</td>
                <td>${payout.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td class="font-semibold">$${payout.amount.toLocaleString()}</td>
                <td>${payout.method}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td class="text-right">
                    <button class="action-btn" onclick="viewDetails('${payout.id}')">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
    lucide.createIcons();
}

function viewDetails(payoutId) {
    const payout = payouts.find(p => p.id === payoutId);
    currentPayoutId = payoutId;

    const modal = document.getElementById('details-modal');
    document.getElementById('modal-title').textContent = `Payout ${payout.id}`;
    document.getElementById('modal-body').innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Transaction ID:</span><span class="detail-value">${payout.id}</span></div>
            <div class="detail-item"><span class="detail-label">Date:</span><span class="detail-value">${payout.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
            <div class="detail-item"><span class="detail-label">Amount:</span><span class="detail-value font-semibold text-green-400">$${payout.amount.toLocaleString()}</span></div>
            <div class="detail-item"><span class="detail-label">Method:</span><span class="detail-value">${payout.method}</span></div>
            <div class="detail-item"><span class="detail-label">Account:</span><span class="detail-value">${payout.account}</span></div>
            <div class="detail-item"><span class="detail-label">Status:</span><span class="status-badge ${payout.status === 'paid' ? 'status-paid' : 'status-processing'}">${payout.status === 'paid' ? 'Paid' : 'Processing'}</span></div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function closeDisputeModal() {
    document.getElementById('dispute-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function submitDispute() {
    const reason = document.getElementById('dispute-reason').value;
    if (!reason) {
        showToast('Please provide a reason for the dispute', 'error');
        return;
    }
    closeDisputeModal();
    showToast('Dispute submitted successfully!');
}

function downloadReceipt() {
    showToast('Downloading receipt...');
}

function downloadPayoutReport() {
    showToast('Downloading payout report...');
}

function showToast(message) {
    const toast = document.getElementById('success-toast');
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

    const revealEls = document.querySelectorAll(".reveal");
    setTimeout(() => revealEls.forEach(el => el.classList.add("show")), 100);
});
