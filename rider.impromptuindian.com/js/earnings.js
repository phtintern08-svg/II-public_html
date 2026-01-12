// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Check authentication (TEMPORARILY DISABLED FOR TESTING)
// const riderId = localStorage.getItem('rider_id');
// if (!riderId) {
//     window.location.href = '../login.html';
// }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEarnings();
    loadBreakdown();
    loadPayoutHistory();
});

// Load earnings summary
function loadEarnings() {
    document.getElementById('total-earnings').textContent = '₹45,000';
    document.getElementById('earnings-today').textContent = '₹450';
    document.getElementById('earnings-week').textContent = '₹2,800';
    document.getElementById('earnings-month').textContent = '₹12,500';

    document.getElementById('pending-amount').textContent = '₹3,200.00';
    document.getElementById('pending-deliveries').textContent = '25';
    document.getElementById('next-payout-date').textContent = '25 Dec 2025';
    document.getElementById('payment-method').textContent = 'Bank Transfer';
}

// Load earnings breakdown
function loadBreakdown() {
    const tableBody = document.getElementById('breakdownTableBody');

    // Sample data
    tableBody.innerHTML = `
        <tr>
            <td>#DL001</td>
            <td>#ORD123</td>
            <td>02 Dec 2025</td>
            <td>₹100.00</td>
            <td>₹30.00</td>
            <td>₹20.00</td>
            <td class="font-bold text-green-400">₹150.00</td>
            <td><span class="status-badge completed">Released</span></td>
        </tr>
        <tr>
            <td>#DL002</td>
            <td>#ORD124</td>
            <td>01 Dec 2025</td>
            <td>₹100.00</td>
            <td>₹20.00</td>
            <td>₹0.00</td>
            <td class="font-bold text-green-400">₹120.00</td>
            <td><span class="status-badge pending">Pending</span></td>
        </tr>
    `;

    // Update totals
    document.getElementById('breakdown-count').textContent = '25';
    document.getElementById('breakdown-base').textContent = '₹2,500';
    document.getElementById('breakdown-bonus').textContent = '₹500';
    document.getElementById('breakdown-total').textContent = '₹3,200';
}

// Load payout history
function loadPayoutHistory() {
    const tableBody = document.getElementById('payoutHistoryBody');

    // Sample data
    tableBody.innerHTML = `
        <tr>
            <td>#PAY001</td>
            <td>25 Nov 2025</td>
            <td class="font-bold text-green-400">₹5,000.00</td>
            <td>40</td>
            <td>Bank Transfer</td>
            <td><span class="status-badge completed">Completed</span></td>
            <td>
                <button onclick="viewPayoutDetails(1)" class="btn-secondary text-xs">View</button>
            </td>
        </tr>
        <tr>
            <td>#PAY002</td>
            <td>25 Oct 2025</td>
            <td class="font-bold text-green-400">₹4,800.00</td>
            <td>38</td>
            <td>Bank Transfer</td>
            <td><span class="status-badge completed">Completed</span></td>
            <td>
                <button onclick="viewPayoutDetails(2)" class="btn-secondary text-xs">View</button>
            </td>
        </tr>
    `;
}

// View payout details
function viewPayoutDetails(payoutId) {
    document.getElementById('payoutModal').classList.remove('hidden');
    document.getElementById('payoutContent').innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-muted">Payout ID</p>
                    <p class="font-semibold">#PAY00${payoutId}</p>
                </div>
                <div>
                    <p class="text-sm text-muted">Date</p>
                    <p class="font-semibold">25 Nov 2025</p>
                </div>
                <div>
                    <p class="text-sm text-muted">Amount</p>
                    <p class="font-semibold text-green-400">₹5,000.00</p>
                </div>
                <div>
                    <p class="text-sm text-muted">Deliveries</p>
                    <p class="font-semibold">40</p>
                </div>
            </div>
            <div class="border-t border-gray-700 pt-4">
                <p class="text-sm text-muted mb-2">Payment Method</p>
                <p class="font-semibold">Bank Transfer - XXXX1234</p>
            </div>
        </div>
    `;
}

function closePayoutModal() {
    document.getElementById('payoutModal').classList.add('hidden');
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
                type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
        } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
