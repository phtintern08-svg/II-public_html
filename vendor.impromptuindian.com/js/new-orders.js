// New Orders Page JavaScript
lucide.createIcons();

/* ---------------------------
   STATE
---------------------------*/
let newOrders = [];
let currentOrderId = null;
let filterQuery = '';

/* ---------------------------
   FETCH ORDERS FROM BACKEND
---------------------------*/
async function fetchOrders() {
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/orders?status=new`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showToast('Authentication failed. Please log in again.', 'error');
                window.location.href = 'https://apparels.impromptuindian.com/login.html';
                return;
            }
            throw new Error(`Failed to fetch new orders: ${response.status}`);
        }

        const data = await response.json();

        // Convert dates correctly and enforce sample quantity = 1
        newOrders = data.map(o => ({
            ...o,
            orderType: o.orderType || (o.quantity === 1 ? 'sample' : 'bulk'),
            quantity: (o.orderType === 'sample' || (!o.orderType && o.quantity === 1)) ? 1 : o.quantity,
            deadline: o.deadline ? new Date(o.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedDate: o.assignedDate ? new Date(o.assignedDate) : new Date()
        }));

        renderOrders();
    } catch (e) {
        console.error('Error fetching orders:', e);
        showToast('Error loading orders from server', 'error');
    }
}

/* ---------------------------
   ORDER CARD TEMPLATE
---------------------------*/
function orderCardTemplate(order) {
    const isSample = order.orderType === 'sample';
    const diff = order.deadline - new Date();
    const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const urgencyClass = daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'moderate' : 'normal';

    return `
        <div class="order-card reveal ${urgencyClass} ${isSample ? 'sample-order' : ''}" onclick="openOrderModal('${order.id}')">
            <div class="order-card-header">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="badge ${isSample ? 'badge-sample' : 'badge-bulk'}">
                            ${isSample ? 'Sample Order' : 'Bulk Order'}
                        </span>
                        ${daysRemaining <= 3 ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-tighter">Priority High</span>' : ''}
                    </div>
                    <h3 class="order-id">${order.id}</h3>
                </div>
                <div class="order-deadline ${urgencyClass}">
                    <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                    <span>${daysRemaining}d WINDOW</span>
                </div>
            </div>
            <div class="order-card-body">
                <div class="order-details-summary">
                    <div class="summary-item">
                        <span class="summary-label">Product</span>
                        <span class="summary-value">${order.productType}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Quantity</span>
                        <span class="summary-value">
                            ${isSample ? '1 Unit (Sample)' : order.quantity + ' Units'}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Fabric</span>
                        <span class="summary-value">${order.customization.fabric || 'Standard'}</span>
                    </div>
                    ${!isSample ? `
                        <div class="summary-item">
                            <span class="summary-label">Variant Code</span>
                            <span class="summary-value">${order.color || 'Standard'}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="order-card-footer">
                <div class="flex items-center justify-between w-full">
                    <div class="flex -space-x-2">
                         <div class="w-6 h-6 rounded-full border-2 border-[#030712] bg-blue-500/20 flex items-center justify-center"><i data-lucide="layers" class="w-3 h-3 text-blue-400"></i></div>
                         <div class="w-6 h-6 rounded-full border-2 border-[#030712] bg-purple-500/20 flex items-center justify-center"><i data-lucide="scissors" class="w-3 h-3 text-purple-400"></i></div>
                    </div>
                    <span class="view-details-link">
                        ${isSample ? 'Sample Audit' : 'Technical Audit'}
                        <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                    </span>
                </div>
            </div>
        </div>
    `;
}

/* ---------------------------
   RENDER ORDERS
---------------------------*/
function renderOrders() {
    const ordersGrid = document.getElementById('orders-grid');
    const emptyState = document.getElementById('empty-state');

    const filteredOrders = newOrders.filter(order =>
        order.id.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const sampleOrders = filteredOrders.filter(o => o.orderType === 'sample');
    const bulkOrders = filteredOrders.filter(o => o.orderType === 'bulk');

    if (filteredOrders.length === 0) {
        ordersGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');

        // Dynamic search feedback
        if (filterQuery) {
            emptyState.querySelector('h3').textContent = 'No Matches Found';
            emptyState.querySelector('p').textContent = `The Requisition ID "${filterQuery}" does not exist in your current production queue.`;
        } else {
            emptyState.querySelector('h3').textContent = 'No Active Requisitions';
            emptyState.querySelector('p').textContent = 'Management has not assigned any new technical orders to your production line.';
        }
        return;
    }

    ordersGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    ordersGrid.innerHTML = `
        ${sampleOrders.length ? `
            <div class="section-title">Sample Orders</div>
            <div class="orders-section">
                ${sampleOrders.map(orderCardTemplate).join('')}
            </div>
        ` : ''}

        ${bulkOrders.length ? `
            <div class="section-title mt-10">Bulk Orders</div>
            <div class="orders-section">
                ${bulkOrders.map(orderCardTemplate).join('')}
            </div>
        ` : ''}
    `;

    lucide.createIcons();

    // Trigger reveal animation
    setTimeout(() => {
        document.querySelectorAll('.order-card.reveal').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show');
            }, index * 80);
        });
    }, 50);
}

/* ---------------------------
   ORDER MODAL
---------------------------*/
function openOrderModal(orderId) {
    const order = newOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    const modal = document.getElementById('order-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-order-id');

    const isSample = order.orderType === 'sample';
    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    const deadlineFormatted = isValidDate(order.deadline)
        ? order.deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Not Specified';

    const assignedFormatted = isValidDate(order.assignedDate)
        ? order.assignedDate.toLocaleDateString()
        : 'Recently';

    modalTitle.innerHTML = `
        <div class="flex flex-col">
            <div class="flex items-center gap-3 mb-1">
                <span class="confidential-badge">
                    <i data-lucide="shield-alert" class="w-3 h-3"></i>
                    ${isSample ? 'Sample Development Audit' : 'Confidential Technical Audit'}
                </span>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-tighter">${isSample ? 'Sample Docket' : 'Manufacturing Docket'}</span>
            </div>
            <span class="text-2xl font-black tracking-tight text-white">REQUISITION ${order.id}</span>
        </div>
    `;

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <i data-lucide="info" class="w-4 h-4"></i>
                    ${isSample ? 'Sample Specifications' : 'Manufacturing Specifications'}
                </h4>
                <div class="detail-item">
                    <span class="detail-label">Order Type</span>
                    <span class="detail-value font-bold ${isSample ? 'text-yellow-400' : 'text-blue-400'}">
                        ${isSample ? 'Sample Development Order' : 'Bulk Production Order'}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Quantity</span>
                    <span class="detail-value font-bold text-blue-400">
                        ${isSample ? '1 Unit (Mandatory Sample)' : order.quantity + ' Units'}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Product SKU</span>
                    <span class="detail-value">${order.productType}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Base Color</span>
                    <span class="detail-value">${order.color || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${isSample ? 'Sample Size' : 'Size'}</span>
                    <span class="detail-value">${order.size || 'N/A'}</span>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                    Customization Matrix
                </h4>
                <div class="detail-item">
                    <span class="detail-label">Print Method</span>
                    <span class="detail-value">${order.customization.printType || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Neck Variant</span>
                    <span class="detail-value">${order.customization.neckType || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fabric Grade</span>
                    <span class="detail-value">${order.customization.fabric || 'N/A'}</span>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    Production Timeline
                </h4>
                <div class="detail-item">
                    <span class="detail-label">Fulfillment Deadline</span>
                    <span class="detail-value text-blue-400 font-semibold">${deadlineFormatted}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dispatch From</span>
                    <span class="detail-value">Admin Warehouse (Default)</span>
                </div>
                ${!isSample ? `
                    <div class="detail-item">
                        <span class="detail-label">Assignment Log</span>
                        <span class="detail-value">${assignedFormatted}</span>
                    </div>
                ` : ''}
            </div>

            ${order.specialInstructions ? `
                <div class="detail-section col-span-2">
                    <h4 class="detail-section-title">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                        Administrative Notes
                    </h4>
                    <p class="special-instructions">${order.specialInstructions}</p>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentOrderId = null;
}

/* ---------------------------
   MOVE TO PRODUCTION
---------------------------*/
async function moveToProduction() {
    if (!currentOrderId) return;

    try {
        // 🔥 FIX: Use correct endpoint - POST /api/vendor/orders/<id>/move-to-production
        // Status is set to 'in_production' by backend, no acceptance stage
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/orders/${currentOrderId}/move-to-production`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to move order to production');
        }

        const data = await response.json();

        // Remove from local list
        newOrders = newOrders.filter(o => o.id !== currentOrderId);

        closeOrderModal();
        showToast(data.message || `Order ${currentOrderId} moved to production successfully!`, 'success');
        renderOrders();

        // Update sidebar count if available
        if (window.renderSidebarNav && window.localStorage) {
            let count = parseInt(localStorage.getItem('vendorNewOrdersCount') || '0');
            if (count > 0) {
                localStorage.setItem('vendorNewOrdersCount', count - 1);
                window.renderSidebarNav();
            }
        }

    } catch (e) {
        console.error('Error moving order to production:', e);
        showToast(e.message || 'Error moving order to production', 'error');
    }
}

// 🔥 REMOVED: Reject functionality - vendors must compulsorily produce, no rejection allowed

/* ---------------------------
   TOAST NOTIFICATION
---------------------------*/
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();

    // Technical Search Implementation
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterQuery = e.target.value;
            renderOrders();
        });
    }

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOrderModal();
            closeRejectModal();
        }
    });
});
