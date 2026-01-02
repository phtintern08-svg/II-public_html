// Completed Orders Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const mockCompletedOrders = [
    {
        id: "ORD-002",
        customerName: "Bob Williams",
        productType: "T-Shirt",
        quantity: 150,
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deliveryStatus: "delivered",
        rating: 5,
        proofFiles: ["proof_002_1.jpg", "proof_002_2.jpg"]
    },
    {
        id: "ORD-004",
        customerName: "Diana Prince",
        productType: "Hoodie",
        quantity: 80,
        completedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        deliveryStatus: "picked-up",
        rating: 4,
        proofFiles: ["proof_004.jpg"]
    },
    {
        id: "ORD-006",
        customerName: "Frank Miller",
        productType: "Cap",
        quantity: 120,
        completedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        deliveryStatus: "delivered",
        rating: 5,
        proofFiles: ["proof_006_1.jpg", "proof_006_2.jpg", "proof_006_3.jpg"]
    },
    {
        id: "ORD-007",
        customerName: "Grace Lee",
        productType: "T-Shirt",
        quantity: 200,
        completedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        deliveryStatus: "delivered",
        rating: null,
        proofFiles: ["proof_007.jpg"]
    },
    {
        id: "ORD-011",
        customerName: "Henry Ford",
        productType: "Hoodie",
        quantity: 60,
        completedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        deliveryStatus: "picked-up",
        rating: 4,
        proofFiles: ["proof_011.jpg"]
    },
    {
        id: "ORD-012",
        customerName: "Ivy Chen",
        productType: "T-Shirt",
        quantity: 95,
        completedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        deliveryStatus: "delivered",
        rating: 5,
        proofFiles: ["proof_012.jpg"]
    }
];

/* ---------------------------
   STATE
---------------------------*/
let allOrders = [...mockCompletedOrders];
let filteredOrders = [...mockCompletedOrders];
let currentOrderId = null;

/* ---------------------------
   FILTER ORDERS
---------------------------*/
function filterOrders() {
    const dateFilter = document.getElementById('date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        // Date filter
        const daysDiff = Math.floor((new Date() - order.completedDate) / (1000 * 60 * 60 * 24));
        let dateMatch = true;

        if (dateFilter === 'week' && daysDiff > 7) dateMatch = false;
        if (dateFilter === 'month' && daysDiff > 30) dateMatch = false;
        if (dateFilter === 'quarter' && daysDiff > 90) dateMatch = false;

        // Status filter
        const statusMatch = statusFilter === 'all' || order.deliveryStatus === statusFilter;

        // Search filter
        const searchMatch = order.id.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm);

        return dateMatch && statusMatch && searchMatch;
    });

    updateResultsCount();
    renderCompletedTable();
}

function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    resultsCount.textContent = `Showing ${filteredOrders.length} of ${allOrders.length} orders`;
}

/* ---------------------------
   RENDER TABLE
---------------------------*/
function renderCompletedTable() {
    const tbody = document.getElementById('completed-table-body');

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-gray-400 py-8">
                    No completed orders found matching your filters.
                </td>
            </tr>
        `;
        return;
    }

    const html = filteredOrders.map(order => {
        const completedDate = order.completedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const statusBadge = order.deliveryStatus === 'delivered'
            ? '<span class="status-badge status-delivered">Delivered</span>'
            : '<span class="status-badge status-picked-up">Picked Up</span>';

        const ratingStars = order.rating
            ? generateStars(order.rating)
            : '<span class="text-gray-500 text-xs">No rating</span>';

        return `
            <tr>
                <td class="font-medium">${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.productType}</td>
                <td>${order.quantity}</td>
                <td>${completedDate}</td>
                <td>${statusBadge}</td>
                <td>${ratingStars}</td>
                <td class="text-right">
                    <button class="action-btn" onclick="openDetailsModal('${order.id}')">
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

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i data-lucide="star" class="w-4 h-4 star-filled"></i>';
        } else {
            stars += '<i data-lucide="star" class="w-4 h-4 star-empty"></i>';
        }
    }
    return `<div class="rating-stars">${stars}</div>`;
}

/* ---------------------------
   DETAILS MODAL
---------------------------*/
function openDetailsModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    const modal = document.getElementById('details-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-order-id');

    modalTitle.textContent = `${order.id} - Completed Order`;

    const completedDate = order.completedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-section">
                <h4 class="detail-section-title">Order Information</h4>
                <div class="detail-item">
                    <span class="detail-label">Order ID:</span>
                    <span class="detail-value">${order.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">${order.customerName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Product:</span>
                    <span class="detail-value">${order.productType}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value">${order.quantity} units</span>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">Completion Details</h4>
                <div class="detail-item">
                    <span class="detail-label">Completed On:</span>
                    <span class="detail-value">${completedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Delivery Status:</span>
                    <span class="detail-value">${order.deliveryStatus === 'delivered' ? 'Delivered' : 'Picked Up'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Rating:</span>
                    <span class="detail-value">${order.rating ? order.rating + ' / 5' : 'Not rated yet'}</span>
                </div>
            </div>

            <div class="detail-section full-width">
                <h4 class="detail-section-title">Proof Files (${order.proofFiles.length})</h4>
                <div class="proof-files-grid">
                    ${order.proofFiles.map(file => `
                        <div class="proof-file">
                            <div class="proof-file-icon">
                                <i data-lucide="file-image" class="w-8 h-8 text-blue-400"></i>
                            </div>
                            <p class="proof-file-name">${file}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeDetailsModal() {
    const modal = document.getElementById('details-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentOrderId = null;
}

/* ---------------------------
   DOWNLOAD PROOF
---------------------------*/
function downloadProof() {
    if (!currentOrderId) return;

    const order = allOrders.find(o => o.id === currentOrderId);
    if (!order) return;

    showToast(`Downloading proof files for ${order.id}...`);
    // In real app, this would trigger actual download
}

/* ---------------------------
   EXPORT HISTORY
---------------------------*/
function exportHistory() {
    showToast('Exporting order history as PDF...');
    // In real app, this would generate and download PDF/Excel
}

/* ---------------------------
   TOAST
---------------------------*/
function showToast(message) {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    messageEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    filterOrders();

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add("show");
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener("scroll", revealOnScroll);

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailsModal();
        }
    });
});
