// Details Page JavaScript
lucide.createIcons();

const ImpromptuIndianApi = window.ImpromptuIndianApi || (() => {
    const rawBase =
        window.IMPROMPTU_INDIAN_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
        '';

    let base = rawBase.trim().replace(/\/$/, '');
    if (!base) {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) {
            base = origin.replace(/\/$/, '');
        } else {
            base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
        }
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options)
    };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

// Get order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("id");

if (!orderId) {
    window.location.href = "orders.html";
}

// Store order data globally for tracking modal
let currentOrder = null;

// Fetch Order Details
async function fetchOrderDetails() {
    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Order not found");
        }
        const order = await response.json();
        currentOrder = order;
        renderOrderDetails(order);
    } catch (error) {
        console.error("Error fetching order details:", error);
        document.getElementById("order-title").textContent = "Order Not Found";
        document.getElementById("order-description").textContent = "We couldn't find the details for this order.";
    }
}

function renderOrderDetails(order) {
    // Update Header
    document.getElementById("order-title").textContent = `Order #${order.id}`;
    const dateObj = new Date(order.created_at || Date.now());
    const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    document.getElementById("order-description").textContent = `Details for your order placed on ${dateStr}.`;

    // Populate Order Summary (Right Sidebar)
    document.getElementById("sum-order-id").textContent = `#${order.id}`;
    document.getElementById("sum-date").textContent = dateStr;

    // Display Sample Cost only (as per user request)
    const sampleCost = order.sample_cost || 0;
    document.getElementById("sum-sample-cost").textContent = `₹${sampleCost.toLocaleString()}`;

    document.getElementById("sum-qty").textContent = `${order.quantity} pcs`;
    document.getElementById("sum-deadline").textContent = order.delivery_date || "N/A";

    // Product Configuration (Grid Items)
    const specs = [
        { label: "Type", value: order.product_type, icon: "shirt" },
        { label: "Category", value: order.category, icon: "tag" },
        { label: "Neck", value: order.neck_type, icon: "circle" },
        { label: "Color", value: order.color, icon: "palette" },
        { label: "Fabric", value: order.fabric, icon: "layers" },
        { label: "Print", value: order.print_type, icon: "printer" },
        { label: "Sleeve", value: order.sleeve_type, icon: "maximize-2" }
    ];

    const productHtml = specs.map(spec => {
        if (!spec.value) return '';
        return `
            <div class="bg-[#111827] p-3 rounded-lg border border-gray-700">
                <span class="block text-gray-500 text-xs uppercase mb-1">${spec.label}</span>
                <span class="text-gray-200 font-medium text-sm">${spec.value}</span>
            </div>
        `;
    }).join('');

    document.getElementById("product-details").innerHTML = productHtml || '<span class="text-gray-500 italic col-span-2">No product details available</span>';

    // Size Breakdown (if available in sizes field - for now we'll show total quantity)
    // Since the backend doesn't have size breakdown, we'll hide this section or show total only
    const sizeBreakdownCard = document.getElementById("size-breakdown-card");
    if (order.sizes) {
        // If sizes data exists, parse and display it
        try {
            const sizes = JSON.parse(order.sizes);
            const sizeHtml = Object.entries(sizes).map(([size, qty]) => {
                if (qty > 0) {
                    return `
                        <div class="bg-[#111827] p-3 rounded-lg border border-gray-700 text-center">
                            <div class="text-xs text-gray-400 uppercase mb-1">${size}</div>
                            <div class="text-lg font-bold text-white">${qty}</div>
                        </div>
                    `;
                }
                return '';
            }).join('');

            document.getElementById("size-breakdown").innerHTML = sizeHtml || '<span class="text-gray-500 italic">No size breakdown available</span>';
        } catch (e) {
            sizeBreakdownCard.style.display = 'none';
        }
    } else {
        // Hide size breakdown card if no data
        sizeBreakdownCard.style.display = 'none';
    }

    // Address
    const addressParts = [];
    if (order.address_line1) addressParts.push(`<p class="font-medium text-white">${order.address_line1}</p>`);
    if (order.address_line2) addressParts.push(`<p>${order.address_line2}</p>`);
    if (order.city || order.state) {
        addressParts.push(`<p>${[order.city, order.state].filter(Boolean).join(', ')}</p>`);
    }
    if (order.country || order.pincode) {
        addressParts.push(`<p>${[order.country, order.pincode].filter(Boolean).join(' - ')}</p>`);
    }
    if (order.alternative_phone) {
        addressParts.push(`<p class="mt-2 text-xs text-gray-400 flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${order.alternative_phone}</p>`);
    }

    document.getElementById("address-box").innerHTML = addressParts.join('') || '<span class="text-gray-500 italic">No address available</span>';

    // Check for Bulk Order option if delivered (Sample Feedback)
    if (order.status === 'delivered') {
        renderBulkOrderOption();
    }

    // Refresh icons
    lucide.createIcons();
}

function renderBulkOrderOption() {
    const sidebar = document.querySelector('.lg\\:col-span-1 > div');
    const bulkCard = document.createElement('div');
    bulkCard.className = 'mt-6 pt-6 border-t border-gray-700';
    bulkCard.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <i data-lucide="package-check" class="w-5 h-5 text-green-400"></i>
            Sample Feedback
        </h3>
        <p class="text-sm text-gray-400 mb-4">Are you satisfied with this sample? You can now proceed to bulk production.</p>
        
        <div class="space-y-3">
            <button onclick="requestBulkOrder()" class="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                Satisfied & Order Bulk
            </button>
            <button onclick="reportSampleIssue()" class="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-gray-600">
                <i data-lucide="x-circle" class="w-4 h-4"></i>
                Not Satisfied
            </button>
        </div>
    `;
    sidebar.appendChild(bulkCard);
    lucide.createIcons();
}

async function requestBulkOrder() {
    // For now, simplify flow: Just confirm and create new dummy bulk order or update status?
    // User requested: "he wants to do bulk order"
    // Ideally we redirect to a "Convert to Bulk" page or just open a modal.
    // Let's create a simple action for now.

    if (!confirm("Proceed to place a bulk order based on this sample?")) return;

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${orderId}/request-bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Great! Your request for a bulk order has been sent. Our team will contact you shortly with the final quotation.");
            // Optionally redirect to orders page or refresh
        } else {
            alert("Failed to submit request.");
        }
    } catch (e) {
        console.error(e);
        alert("Error requesting bulk order.");
    }
}

function reportSampleIssue() {
    // Redirect to support with context
    window.location.href = `support.html?category=quality_issue&order_id=${orderId}`;
}


// =====================================================
// TRACKING MODAL
// =====================================================

async function openTrackingModal() {
    const modal = document.getElementById('tracking-modal');
    const timeline = document.getElementById('tracking-timeline');
    const orderIdLabel = document.getElementById('tracking-order-id');

    modal.classList.remove('hidden');
    orderIdLabel.textContent = `Order #${orderId}`;
    timeline.innerHTML = '<div class="text-center py-8 text-gray-400"><i data-lucide="loader-2" class="w-8 h-8 animate-spin inline-block"></i><p class="mt-2">Loading tracking data...</p></div>';
    lucide.createIcons();

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${orderId}/tracking`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch tracking data');

        const data = await response.json();
        renderTrackingTimeline(data);
    } catch (error) {
        console.error('Error fetching tracking data:', error);
        timeline.innerHTML = '<div class="text-center py-8 text-red-400"><i data-lucide="alert-circle" class="w-8 h-8 inline-block"></i><p class="mt-2">Failed to load tracking data</p></div>';
        lucide.createIcons();
    }
}

function closeTrackingModal() {
    document.getElementById('tracking-modal').classList.add('hidden');
}

function renderTrackingTimeline(data) {
    const timeline = document.getElementById('tracking-timeline');
    const { stages, current_stage_index, history } = data;

    // Create a map of status to history entry for quick lookup
    const historyMap = {};
    history.forEach(h => {
        if (!historyMap[h.status]) {
            historyMap[h.status] = h;
        }
    });

    // HORIZONTAL TIMELINE
    let timelineHtml = '';

    stages.forEach((stage, index) => {
        const isCompleted = index <= current_stage_index;
        const isCurrent = index === current_stage_index;
        const historyEntry = historyMap[stage.id];

        const statusColor = isCompleted ? (isCurrent ? 'bg-blue-500' : 'bg-green-500') : 'bg-gray-700';
        const textColor = isCompleted ? 'text-white' : 'text-gray-500';
        const lineColor = index < current_stage_index ? 'bg-green-500' : 'bg-gray-700';
        const isLast = index === stages.length - 1;

        // Format timestamp if available
        let timestampStr = '';
        if (historyEntry) {
            const date = new Date(historyEntry.timestamp);
            timestampStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }

        timelineHtml += `
            <div class="flex flex-col items-center relative flex-shrink-0 w-48 group">
                <!-- Connecting Line (Behind) -->
                ${!isLast ? `<div class="absolute top-6 left-1/2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full ${lineColor} transition-all duration-500"></div>
                </div>` : ''}
                
                <!-- Stage Circle -->
                <div class="w-12 h-12 rounded-full ${isCompleted ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30' : (isCurrent ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 pulse-ring' : 'bg-gray-800 border border-gray-700')} flex items-center justify-center flex-shrink-0 z-10 transition-transform duration-300 group-hover:scale-110">
                    <i data-lucide="${isCompleted ? 'check' : stage.icon}" class="w-5 h-5 ${textColor}"></i>
                </div>
                
                <!-- Stage Label -->
                <div class="mt-4 text-center px-2">
                    <p class="text-sm font-semibold ${isCompleted ? 'text-white' : 'text-gray-400'} leading-tight min-h-[40px] flex items-center justify-center">${stage.label}</p>
                    ${isCurrent ? '<span class="inline-block mt-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase border border-blue-500/30">Current</span>' : ''}
                    ${timestampStr && !isCurrent ? `<p class="text-[10px] text-gray-500 mt-1 font-mono">${timestampStr}</p>` : ''}
                </div>
            </div>
        `;
    });

    timeline.innerHTML = timelineHtml;
    lucide.createIcons();
}

// Action Buttons
document.getElementById("track-order-btn")?.addEventListener("click", () => {
    openTrackingModal();
});

document.getElementById("contact-support-btn")?.addEventListener("click", () => {
    window.location.href = "support.html";
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTrackingModal();
    }
});

// Sidebar Active State Handling
document.addEventListener("DOMContentLoaded", () => {
    // Manually set "My Orders" as active since we are in details page
    setTimeout(() => {
        const sidebarLinks = document.querySelectorAll(".menu-item");
        sidebarLinks.forEach(link => {
            if (link.getAttribute("href") === "orders.html") {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }, 100);

    fetchOrderDetails();
    updateCartBadge();
});

function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (total > 0) {
        badge.textContent = total;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}
