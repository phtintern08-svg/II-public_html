// Orders Page JavaScript
lucide.createIcons();

// DO NOT redeclare ImpromptuIndianApi - sidebar.js already creates it
// Use window.ImpromptuIndianApi directly throughout this file

/* Auto-highlight sidebar */
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".menu-item").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) link.classList.add("active");
});

const badgeVariant = {
    pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-xs',
    pending_admin_review: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-xs',
    quotation_sent_to_customer: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs',
    quotation_rejected_by_customer: 'bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs',
    sample_requested: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-1 rounded text-xs',
    sample_rejected: 'bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs',
    awaiting_advance_payment: 'bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded text-xs',
    vendor_assigned: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs',
    assigned: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs',

    // Production Stages - Vendor Pipeline
    accepted_by_vendor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded text-xs',
    material_prep: 'bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded text-xs',
    printing: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-1 rounded text-xs',
    printing_completed: 'bg-lime-500/10 text-lime-400 border border-lime-500/20 px-2 py-1 rounded text-xs',
    quality_check: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs',
    packed_ready: 'bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded text-xs',

    Accepted: 'bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded text-xs',
    'In Progress': 'bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded text-xs',
    in_production: 'bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded text-xs',
    Dispatched: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-1 rounded text-xs',
    Delivered: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-xs',
    completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-xs',
    completed_with_penalty: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-xs',
    Cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs',
    rejected_by_vendor: 'bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs',

    // Rider Delivery Stages
    reached_vendor: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs',
    picked_up: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-1 rounded text-xs',
    out_for_delivery: 'bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded text-xs',
    delivered: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-xs'
};

/* Global Store */
let allOrders = [];

/* Fetch Orders from Backend */
async function fetchOrders() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        console.error("User ID not found");
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            allOrders = data.orders || data; // Handle both formats
            
            // Debug: Log status values to verify API returns status
            if (allOrders.length > 0) {
                console.log('Order statuses from API:', allOrders.map(o => ({ id: o.id, status: o.status })));
            }
            
            renderOrders(allOrders);
        } else {
            console.error('Failed to fetch orders');
            document.getElementById('ordersTable').innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-400">Failed to load orders.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        document.getElementById('ordersTable').innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-400">Error loading orders.</td></tr>';
    }
}

/* Search Functionality */
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allOrders.filter(order => {
        // Search by ID
        if (order.id.toString().includes(term)) return true;
        // Search by Product Type
        if (order.product_type?.toLowerCase().includes(term)) return true;
        // Search by Category
        if (order.category?.toLowerCase().includes(term)) return true;
        // Search by Status
        if (order.status?.toLowerCase().includes(term)) return true;

        return false;
    });
    renderOrders(filtered);
});

/* Render Orders Table & Mobile Cards */
function renderOrders(data) {
    const table = document.getElementById('ordersTable');
    const mobileList = document.getElementById('ordersListMobile');

    // Clear both
    if (table) table.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';

        if (!data || data.length === 0) {
        const emptyState = `
            <tr>
                <td colspan="8" class="text-center py-12 text-gray-400">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="package-open" class="w-10 h-10 opacity-50"></i>
                        <p>No orders found yet</p>
                    </div>
                </td>
            </tr>`;

        if (table) table.innerHTML = emptyState;
        if (mobileList) {
            mobileList.innerHTML = `
                <div class="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                    <i data-lucide="package-open" class="w-10 h-10 opacity-50"></i>
                    <p>No orders found yet</p>
                </div>
             `;
        }
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Sort by ID descending (newest first)
    data.sort((a, b) => b.id - a.id);

    data.forEach((order, index) => {
        // Build full product details
        const productParts = [
            order.product_type,
            order.category,
            order.neck_type,
            order.fabric,
            order.color,
            order.print_type
        ].filter(Boolean);

        const productDetails = productParts.join(' • ');

        // Bulk Handling - Show bulk info if bulk_quantity exists
        let bulkInfo = '';
        if (order.bulk_quantity) {
            let parsedSizes = '';
            if (order.size_distribution) {
                try {
                    const sizes = typeof order.size_distribution === 'string'
                        ? JSON.parse(order.size_distribution)
                        : order.size_distribution;

                    parsedSizes = Object.entries(sizes)
                        .map(([size, qty]) => `${size}:${qty}`)
                        .join(', ');
                } catch (e) {
                    console.error("Invalid size distribution", e);
                }
            }
            
            bulkInfo = parsedSizes
                ? `<div class="text-xs text-gray-400 mt-1">
                      Bulk: ${order.bulk_quantity} pcs<br>
                      Sizes: ${parsedSizes}
                   </div>`
                : `<div class="text-xs text-gray-400 mt-1">
                      Bulk: ${order.bulk_quantity} pcs
                   </div>`;
        }

        // Only show Sample Cost
        const sampleCost = order.sample_cost || 0;
        const sampleCostDisplay = sampleCost > 0
            ? `₹${sampleCost.toLocaleString()}`
            : '—';

        // Status Badge Class - Use status directly from orders table
        // Ensure we're using the actual status from the database
        const orderStatus = order.status || order.order_status || 'pending';
        const normalizedStatus = orderStatus.toString().toLowerCase();
        
        // Fallback to a generic style if status not found in map
        const statusClass = badgeVariant[normalizedStatus] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-1 rounded text-xs';

        // Format status label for display
        const statusLabel = normalizedStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        // 1. DESKTOP ROW
        if (table) {
            const row = document.createElement('tr');
            row.className = 'hover:bg-[#1e293b]/50 border-b border-gray-800 last:border-none transition-all duration-300 opacity-0 translate-y-2';
            // Staggered animation
            setTimeout(() => row.classList.remove('opacity-0', 'translate-y-2'), index * 50);

            row.innerHTML = `
                <td class="px-4 py-4 font-medium text-white">#${order.id}</td>
                <td class="px-4 py-4 text-gray-300">${productDetails}</td>
                <td class="px-4 py-4"><span class="${statusClass} whitespace-nowrap">${statusLabel}</span></td>
                <td class="px-4 py-4 text-gray-300 text-sm">
                    <div>Sample: ${order.sample_size || '—'}</div>
                    ${
                        order.bulk_quantity
                        ? `<div class="text-xs text-gray-400 mt-1">
                              Bulk: ${order.bulk_quantity} pcs
                              ${
                                  order.size_distribution
                                  ? `<br>Sizes: ${
                                        Object.entries(
                                            typeof order.size_distribution === 'string'
                                            ? JSON.parse(order.size_distribution)
                                            : order.size_distribution
                                        )
                                        .map(([s,q]) => `${s}:${q}`)
                                        .join(', ')
                                    }`
                                  : ''
                              }
                           </div>`
                        : ''
                    }
                </td>
                <td class="px-4 py-4 text-gray-300">${order.delivery_date || '—'}</td>
                <td class="px-4 py-4 text-gray-400 text-xs">
                    ${
                        order.address_line1
                        ? `${order.address_line1}<br>
                           ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}`
                        : '—'
                    }
                    ${
                        order.status === 'dispatched' && (order.rider_name || order.delivery_method)
                        ? `<div class="mt-2 pt-2 border-t border-gray-700">
                             <div class="text-xs text-blue-400 font-semibold mb-1">Delivery Info:</div>
                             ${
                                 order.delivery_method === 'inhouse' && order.rider_name
                                 ? `<div class="text-xs">Rider: ${order.rider_name}</div>
                                    ${order.rider_phone ? `<div class="text-xs">Phone: ${order.rider_phone}</div>` : ''}
                                    ${order.expected_delivery ? `<div class="text-xs text-green-400">ETA: ${order.expected_delivery}</div>` : ''}`
                                 : order.delivery_method === 'platform'
                                 ? `<div class="text-xs">Platform Rider Assigned</div>`
                                 : ''
                             }
                           </div>`
                        : ''
                    }
                </td>
                <td class="px-4 py-4 text-right text-white font-medium">${sampleCostDisplay}</td>
                <td class="px-4 py-4 text-right">
                    <button onclick="goDetails(${order.id})" 
                        class="group px-3 py-1.5 bg-[#1273EB]/10 hover:bg-[#1273EB] text-[#1273EB] hover:text-white border border-[#1273EB]/50 hover:border-transparent text-xs font-semibold rounded transition-all duration-300 flex items-center gap-1 ml-auto">
                        View
                        <i data-lucide="arrow-right" class="w-3 h-3 transition-transform group-hover:translate-x-1"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        }

        // 2. MOBILE CARD (Box Layout)
        if (mobileList) {
            const card = document.createElement('div');
            card.className = "bg-[#1f2937]/40 border border-gray-700 rounded-lg p-3 flex flex-col gap-3";
            card.innerHTML = `
                <!-- Header Box: Order ID & Status -->
                <div class="flex justify-between items-center bg-[#0f172a] rounded p-2 border border-gray-700">
                    <span class="text-xs font-mono text-gray-400">#${order.id}</span>
                    <span class="${statusClass} text-[10px] uppercase font-bold tracking-wide">${statusLabel}</span>
                </div>

                <!-- Product Box -->
                <div class="bg-[#111827] rounded p-3 border border-gray-700">
                    <h3 class="font-bold text-white text-base">${order.product_type}</h3>
                    <p class="text-xs text-gray-400 mt-1">${productDetails}</p>
                </div>

                ${bulkInfo ? `
                <div class="bg-[#111827] rounded p-2 border border-gray-700 text-xs text-gray-400">
                    ${bulkInfo}
                </div>
                ` : ''}

                <!-- Metrics Grid Boxes -->
                <div class="grid grid-cols-2 gap-2">
                    <div class="bg-[#111827] rounded p-2 border border-gray-700 flex flex-col items-center justify-center">
                         <span class="text-[10px] text-gray-500 uppercase">Sample Size</span>
                         <span class="text-sm font-semibold text-white">${order.sample_size || '—'}</span>
                    </div>
                    <div class="bg-[#111827] rounded p-2 border border-gray-700 flex flex-col items-center justify-center">
                         <span class="text-[10px] text-gray-500 uppercase">Sample Cost</span>
                         <span class="text-sm font-semibold text-white">${sampleCostDisplay}</span>
                    </div>
                </div>

                <!-- Address Box -->
                <div class="bg-[#111827] rounded p-2 border border-gray-700 text-xs text-gray-400">
                    <span class="text-[10px] text-gray-500 uppercase block mb-1">Delivery Address</span>
                    ${order.address_line1 || ''}<br>
                    ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}
                </div>

                <!-- Deadline Box -->
                 <div class="bg-[#111827] rounded p-2 border border-gray-700 flex justify-between items-center px-3">
                     <span class="text-[10px] text-gray-500 uppercase">Deadline</span>
                     <span class="text-sm font-medium text-gray-300">${order.delivery_date || '—'}</span>
                </div>

                ${
                    order.status === 'dispatched' && (order.rider_name || order.delivery_method)
                    ? `
                <!-- Delivery Info Box -->
                <div class="bg-[#111827] rounded p-3 border border-gray-700">
                    <div class="text-[10px] text-blue-400 font-semibold uppercase mb-2">Delivery Info</div>
                    ${
                        order.delivery_method === 'inhouse' && order.rider_name
                        ? `<div class="text-xs text-gray-300 space-y-1">
                             <div>Rider: <span class="text-white font-medium">${order.rider_name}</span></div>
                             ${order.rider_phone ? `<div>Phone: <span class="text-white font-medium">${order.rider_phone}</span></div>` : ''}
                             ${order.expected_delivery ? `<div class="text-green-400 font-medium">ETA: ${order.expected_delivery}</div>` : ''}
                           </div>`
                        : order.delivery_method === 'platform'
                        ? `<div class="text-xs text-gray-300">Platform Rider Assigned</div>`
                        : ''
                    }
                </div>
                    `
                    : ''
                }

                <!-- Action Button -->
                <button onclick="goDetails(${order.id})" 
                    class="w-full mt-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-400 text-black text-sm font-bold rounded shadow-md transition-all flex items-center justify-center gap-2">
                    View Details
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            `;
            mobileList.appendChild(card);
        }
    });

    if (window.lucide) lucide.createIcons();
}

/* Redirect Functions */
function goDetails(orderId) {
    window.location.href = `details.html?id=${orderId}`;
}

/* Update Cart Badge */
function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
    const total = cart.reduce((s, i) => s + i.quantity, 0);

    badge.textContent = total;
    badge.classList.toggle("hidden", total === 0);
}

/* Auto-refresh orders to update status */
let ordersRefreshInterval = null;

function startOrdersAutoRefresh() {
    // Clear existing interval if any
    if (ordersRefreshInterval) {
        clearInterval(ordersRefreshInterval);
    }
    
    // Refresh orders every 30 seconds to update status
    ordersRefreshInterval = setInterval(() => {
        fetchOrders();
    }, 30000); // 30 seconds
}

function stopOrdersAutoRefresh() {
    if (ordersRefreshInterval) {
        clearInterval(ordersRefreshInterval);
        ordersRefreshInterval = null;
    }
}

/* Initialize */
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    updateCartBadge();
    startOrdersAutoRefresh();
    
    // Stop auto-refresh when page is hidden (save resources)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopOrdersAutoRefresh();
        } else {
            startOrdersAutoRefresh();
            fetchOrders(); // Refresh immediately when page becomes visible
        }
    });
});
