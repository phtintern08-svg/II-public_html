// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Check authentication (TEMPORARILY DISABLED FOR TESTING)
// const riderId = localStorage.getItem('rider_id');
// if (!riderId) {
//     window.location.href = '../login.html';
// }

// Global state
let currentPage = 1;
let currentFilters = {
    fromDate: '',
    toDate: '',
    status: 'all',
    minRating: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    loadStatistics();
});

// Load delivery history
async function loadHistory() {
    const tableBody = document.getElementById('historyTableBody');

    // Sample data for testing
    tableBody.innerHTML = `
        <tr>
            <td>#DL001</td>
            <td>#ORD123</td>
            <td>28 Nov, 10:00 AM</td>
            <td>28 Nov, 02:30 PM</td>
            <td>4h 30m</td>
            <td>⭐⭐⭐⭐⭐</td>
            <td>₹150.00</td>
            <td><span class="status-badge completed">Completed</span></td>
            <td>
                <button onclick="viewDetails(1)" class="btn-secondary text-xs">View</button>
            </td>
        </tr>
        <tr>
            <td>#DL002</td>
            <td>#ORD124</td>
            <td>27 Nov, 09:00 AM</td>
            <td>27 Nov, 01:15 PM</td>
            <td>4h 15m</td>
            <td>⭐⭐⭐⭐</td>
            <td>₹120.00</td>
            <td><span class="status-badge completed">Completed</span></td>
            <td>
                <button onclick="viewDetails(2)" class="btn-secondary text-xs">View</button>
            </td>
        </tr>
    `;
}

// Load statistics
function loadStatistics() {
    document.getElementById('total-deliveries').textContent = '45';
    document.getElementById('successful-deliveries').textContent = '42';
    document.getElementById('average-rating').textContent = '4.7';
    document.getElementById('failed-deliveries').textContent = '3';
}

// Apply filters
function applyFilters() {
    currentFilters.fromDate = document.getElementById('fromDate').value;
    currentFilters.toDate = document.getElementById('toDate').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.minRating = document.getElementById('ratingFilter').value;

    loadHistory();
    showToast('Filters applied', 'success');
}

// Reset filters
function resetFilters() {
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('ratingFilter').value = '0';

    currentFilters = {
        fromDate: '',
        toDate: '',
        status: 'all',
        minRating: 0
    };

    loadHistory();
    showToast('Filters reset', 'info');
}

// Export history
function exportHistory() {
    showToast('Exporting delivery history...', 'info');
    // TODO: Implement export functionality
}

// View delivery details
function viewDetails(deliveryId) {
    document.getElementById('detailsModal').classList.remove('hidden');
    // TODO: Load actual delivery details
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}

// View proof image
function viewProof(deliveryId, type) {
    document.getElementById('proofModal').classList.remove('hidden');
    document.getElementById('proofTitle').textContent = type === 'pickup' ? 'Pickup Proof' : 'Delivery Proof';
    // TODO: Load actual proof image
}

function closeProofModal() {
    document.getElementById('proofModal').classList.add('hidden');
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
