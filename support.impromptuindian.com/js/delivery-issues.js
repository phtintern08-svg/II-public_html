// delivery-issues.js - Delivery Issues JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock delivery issues data
let deliveryData = {
    deliveryIssues: 9,
    activeRiders: 12,
    lostDamaged: 2,
    issues: [
        {
            id: 'TKT-005',
            orderId: 'ORD-12347',
            rider: 'Rider-001',
            customer: 'John Doe',
            issueType: 'Delayed Delivery',
            riderLocation: '12.9716°N, 77.5946°E',
            status: 'Open'
        },
        {
            id: 'TKT-006',
            orderId: 'ORD-12348',
            rider: 'Rider-002',
            customer: 'Jane Smith',
            issueType: 'Wrong Address',
            riderLocation: '12.9352°N, 77.6245°E',
            status: 'In Progress'
        }
    ]
};

// Fetch delivery issues from API (placeholder)
async function fetchDeliveryIssues() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/delivery-issues');
        // if (response.ok) {
        //     deliveryData = await response.json();
        //     updateDeliveryDisplay(deliveryData);
        // }
        
        updateDeliveryDisplay(deliveryData);
    } catch (error) {
        console.error('Error fetching delivery issues:', error);
        updateDeliveryDisplay(deliveryData);
    }
}

// Update delivery display
function updateDeliveryDisplay(data) {
    document.getElementById('delivery-issues-count').textContent = data.deliveryIssues || 0;
    document.getElementById('active-riders').textContent = data.activeRiders || 0;
    document.getElementById('lost-damaged').textContent = data.lostDamaged || 0;
    
    renderDeliveryIssuesTable(data.issues || []);
}

// Render delivery issues table
function renderDeliveryIssuesTable(issues) {
    const tbody = document.getElementById('delivery-issues-table-body');
    if (!tbody) return;

    if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">No delivery issues found.</td></tr>';
        return;
    }

    tbody.innerHTML = issues.map(issue => {
        const statusClass = issue.status === 'Open' ? 'status-open' : 
                           issue.status === 'In Progress' ? 'status-in-progress' : 'status-resolved';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white cursor-pointer" onclick="window.location.href='ticket-details.html?id=${issue.id}'">${issue.id}</td>
                <td>${issue.orderId}</td>
                <td class="text-gray-300">${issue.rider}</td>
                <td class="text-gray-300">${issue.customer}</td>
                <td class="capitalize">${issue.issueType}</td>
                <td class="text-gray-400 text-sm">${issue.riderLocation}</td>
                <td><span class="${statusClass}">${issue.status}</span></td>
                <td>
                    <button class="btn-primary text-xs" onclick="openDeliveryModal('${issue.id}')">Actions</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Open delivery actions modal
function openDeliveryModal(ticketId) {
    const modal = document.getElementById('deliveryModal');
    const modalBody = document.getElementById('delivery-modal-body');
    const modalTitle = document.getElementById('delivery-modal-title');
    
    modalTitle.textContent = `Delivery Actions - ${ticketId}`;
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label class="form-label">Delivery Actions</label>
                <div class="space-y-2">
                    <button class="btn-primary w-full" onclick="trackRiderLocation('${ticketId}')">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                        Track Rider Location
                    </button>
                    <button class="btn-secondary w-full" onclick="callVendorOrRider('${ticketId}')">
                        <i data-lucide="phone" class="w-4 h-4"></i>
                        Call Vendor / Rider
                    </button>
                    <button class="btn-warning w-full" onclick="rescheduleDelivery('${ticketId}')">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                        Reschedule Delivery
                    </button>
                    <button class="btn-danger w-full" onclick="cancelAndReassign('${ticketId}')">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                        Cancel & Reassign Rider
                    </button>
                    <button class="btn-danger w-full" onclick="markAsLost('${ticketId}')">
                        <i data-lucide="package-x" class="w-4 h-4"></i>
                        Mark as Lost / Damaged
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Close delivery modal
function closeDeliveryModal() {
    document.getElementById('deliveryModal').classList.add('hidden');
}

// Delivery action functions (placeholders)
async function trackRiderLocation(ticketId) {
    // TODO: Implement API call
    showToast('Opening rider location tracker...');
    closeDeliveryModal();
}

async function callVendorOrRider(ticketId) {
    // TODO: Implement API call
    showToast('Initiating call...');
    closeDeliveryModal();
}

async function rescheduleDelivery(ticketId) {
    // TODO: Implement API call
    showToast('Opening reschedule dialog...');
    closeDeliveryModal();
}

async function cancelAndReassign(ticketId) {
    // TODO: Implement API call
    showToast('Cancelling and reassigning rider...');
    closeDeliveryModal();
    fetchDeliveryIssues();
}

async function markAsLost(ticketId) {
    // TODO: Implement API call
    showToast('Marked as lost/damaged');
    closeDeliveryModal();
    fetchDeliveryIssues();
}

// Refresh delivery issues
function refreshDeliveryIssues() {
    showToast('Delivery issues refreshed!');
    fetchDeliveryIssues();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchDeliveryIssues();

    document.getElementById('refreshBtn').addEventListener('click', refreshDeliveryIssues);

    // Auto-refresh every 30 seconds
    setInterval(fetchDeliveryIssues, 30000);
});
