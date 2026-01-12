// Admin Rankings Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const mockOrders = [
    { id: "ORD-001", vendorName: "Creative Prints", status: "Delivered", feedback: { rating: 4 } },
    { id: "ORD-002", vendorName: "Speedy Tees", status: "Delivered", feedback: { rating: 3 } },
    { id: "ORD-003", vendorName: "Creative Prints", status: "Delivered", feedback: { rating: 4 } },
    { id: "ORD-004", vendorName: "Top Threads", status: "Accepted", feedback: null },
    { id: "ORD-005", vendorName: "Creative Prints", status: "In Progress", feedback: null },
    { id: "ORD-006", vendorName: "Speedy Tees", status: "Accepted", feedback: null },
];

const mockVendors = [
    {
        id: "V001",
        name: "Creative Prints",
        avatarUrl: "https://ui-avatars.com/api/?name=Creative+Prints&background=4f46e5",
        status: "Active"
    },
    {
        id: "V002",
        name: "Speedy Tees",
        avatarUrl: "https://ui-avatars.com/api/?name=Speedy+Tees&background=059669",
        status: "Active"
    },
    {
        id: "V003",
        name: "Top Threads",
        avatarUrl: "https://ui-avatars.com/api/?name=Top+Threads&background=dc2626",
        status: "Active"
    },
    {
        id: "V004",
        name: "Inkwell Designs",
        avatarUrl: "https://ui-avatars.com/api/?name=Inkwell+Designs&background=7c3aed",
        status: "Blocked"
    },
    {
        id: "V005",
        name: "Garment Gurus",
        avatarUrl: "https://ui-avatars.com/api/?name=Garment+Gurus&background=0891b2",
        status: "Active"
    },
    {
        id: "V006",
        name: "Stitch Perfect",
        avatarUrl: "https://ui-avatars.com/api/?name=Stitch+Perfect&background=ea580c",
        status: "Active"
    },
    {
        id: "V007",
        name: "T-Shirt Titan",
        avatarUrl: "https://ui-avatars.com/api/?name=T-Shirt+Titan&background=8b5cf6",
        status: "Active"
    },
    {
        id: "V008",
        name: "Hoodie Hub",
        avatarUrl: "https://ui-avatars.com/api/?name=Hoodie+Hub&background=ec4899",
        status: "Blocked"
    }
];

/* ---------------------------
   STATE
---------------------------*/
let vendors = [...mockVendors];
let sortKey = 'avgRating';
let sortDirection = 'desc';
let currentVendorId = null;
let dropdownElement = null;

/* ---------------------------
   HELPER FUNCTIONS
---------------------------*/
function calculateVendorPerformance(vendors, orders) {
    return vendors.map(vendor => {
        const vendorOrders = orders.filter(o => o.vendorName === vendor.name);
        const completedOrders = vendorOrders.filter(o => o.status === 'Delivered');
        const activeOrders = vendorOrders.filter(o => ['Accepted', 'In Progress'].includes(o.status));
        const feedbackOrders = completedOrders.filter(o => o.feedback);

        const avgRating = feedbackOrders.length > 0
            ? feedbackOrders.reduce((acc, o) => acc + o.feedback.rating, 0) / feedbackOrders.length
            : 0;

        // Mock average delivery days
        const avgDeliveryDays = parseFloat(((vendor.name.length % 5) + 2 + Math.random()).toFixed(1));

        return {
            id: vendor.id,
            name: vendor.name,
            avatarUrl: vendor.avatarUrl,
            status: vendor.status,
            avgRating: parseFloat(avgRating.toFixed(1)),
            completedOrders: completedOrders.length,
            activeOrders: activeOrders.length,
            avgDeliveryDays: avgDeliveryDays
        };
    });
}

function sortVendors(vendors, key, direction) {
    return [...vendors].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/* ---------------------------
   RENDER FUNCTIONS
---------------------------*/
function renderTopVendors() {
    const vendorPerformance = calculateVendorPerformance(vendors, mockOrders);
    const topVendors = [...vendorPerformance].sort((a, b) => b.avgRating - a.avgRating).slice(0, 3);

    const html = topVendors.map(vendor => `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full overflow-hidden border border-gray-700">
                    <img src="${vendor.avatarUrl}" alt="${vendor.name}" class="h-full w-full object-cover" />
                </div>
                <span class="font-medium text-sm">${vendor.name}</span>
            </div>
            <div class="flex items-center gap-1 text-sm font-bold text-yellow-500">
                <i data-lucide="star" class="w-4 h-4"></i>
                <span>${vendor.avgRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('top-vendors-list').innerHTML = html;
    lucide.createIcons();
}

function renderLowestVendors() {
    const vendorPerformance = calculateVendorPerformance(vendors, mockOrders);
    const lowestVendors = [...vendorPerformance]
        .filter(v => v.avgRating > 0) // Only show vendors with ratings
        .sort((a, b) => a.avgRating - b.avgRating)
        .slice(0, 3);

    const html = lowestVendors.length > 0 ? lowestVendors.map(vendor => `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full overflow-hidden border border-gray-700">
                    <img src="${vendor.avatarUrl}" alt="${vendor.name}" class="h-full w-full object-cover" />
                </div>
                <span class="font-medium text-sm">${vendor.name}</span>
            </div>
            <div class="flex items-center gap-1 text-sm font-bold text-red-500">
                <i data-lucide="star" class="w-4 h-4"></i>
                <span>${vendor.avgRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('') : '<p class="text-sm text-gray-400 text-center py-5">No rated vendors found.</p>';

    document.getElementById('lowest-vendors-list').innerHTML = html;
    lucide.createIcons();
}

function renderVendorTable() {
    const vendorPerformance = calculateVendorPerformance(vendors, mockOrders);
    const sortedVendors = sortVendors(vendorPerformance, sortKey, sortDirection);

    const html = sortedVendors.map(vendor => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full overflow-hidden border border-gray-700">
                        <img src="${vendor.avatarUrl}" alt="${vendor.name}" class="h-full w-full object-cover" />
                    </div>
                    <span class="font-medium">${vendor.name}</span>
                </div>
            </td>
            <td>
                <div class="flex items-center gap-1">
                    <i data-lucide="star" class="w-4 h-4 text-yellow-400"></i>
                    <span class="font-semibold">${vendor.avgRating.toFixed(1)}</span>
                </div>
            </td>
            <td>${vendor.completedOrders}</td>
            <td>${vendor.activeOrders}</td>
            <td>${vendor.avgDeliveryDays} days</td>
            <td>
                <span class="badge ${vendor.status === 'Active' ? 'badge-active' : 'badge-blocked'}">
                    ${vendor.status}
                </span>
            </td>
            <td class="text-right">
                <button class="action-btn" onclick="showVendorActions(event, '${vendor.id}', '${vendor.status}')">
                    <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('vendor-table-body').innerHTML = html;

    // Update sort button states
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-sort="${sortKey}"] .sort-btn`);
    if (activeBtn) activeBtn.classList.add('active');

    lucide.createIcons();
}

function renderAll() {
    renderTopVendors();
    renderLowestVendors();
    renderVendorTable();
}

/* ---------------------------
   SORTING
---------------------------*/
function handleSort(key) {
    if (sortKey === key) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey = key;
        sortDirection = 'desc';
    }
    renderVendorTable();
}

/* ---------------------------
   VENDOR ACTIONS
---------------------------*/
function showVendorActions(event, vendorId, status) {
    event.stopPropagation();

    currentVendorId = vendorId;
    dropdownElement = document.getElementById('vendor-dropdown');

    // Update button text based on status
    const toggleBtn = document.getElementById('toggle-status-btn');
    toggleBtn.textContent = status === 'Active' ? 'Block Account' : 'Approve Account';
    toggleBtn.className = status === 'Active' ? 'dropdown-item dropdown-item-danger' : 'dropdown-item';

    // Position dropdown
    const rect = event.currentTarget.getBoundingClientRect();
    dropdownElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
    dropdownElement.style.left = `${rect.left + window.scrollX - 150}px`;

    dropdownElement.classList.remove('hidden');
}

function hideDropdown() {
    if (dropdownElement) {
        dropdownElement.classList.add('hidden');
    }
}

function viewPerformanceReport() {
    const vendor = vendors.find(v => v.id === currentVendorId);
    if (vendor) {
        alert(`Performance report for ${vendor.name} would be displayed here.`);
    }
    hideDropdown();
}

function toggleVendorStatus() {
    const vendor = vendors.find(v => v.id === currentVendorId);
    if (!vendor) return;

    const newStatus = vendor.status === 'Active' ? 'Blocked' : 'Active';

    vendors = vendors.map(v =>
        v.id === currentVendorId ? { ...v, status: newStatus } : v
    );

    hideDropdown();
    renderAll();

    alert(`Vendor ${vendor.name} has been ${newStatus === 'Active' ? 'approved' : 'blocked'}.`);
}

/* ---------------------------
   EVENT LISTENERS
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Sortable headers
    document.querySelectorAll('.sortable').forEach(th => {
        const sortBtn = th.querySelector('.sort-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                const key = th.dataset.sort;
                handleSort(key);
            });
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownElement && !dropdownElement.contains(e.target)) {
            hideDropdown();
        }
    });

    // Initial render
    renderAll();

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
});
