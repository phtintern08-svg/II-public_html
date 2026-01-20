// disputes.js - Dispute Resolution Tools JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock disputes data
let disputesData = {
    active: 8,
    pendingReview: 3,
    resolved: 25,
    disputes: [
        {
            id: 'DSP-001',
            type: 'Vendor vs Customer',
            parties: 'Vendor: ABC Prints, Customer: John Doe',
            orderId: 'ORD-12345',
            status: 'Active',
            created: '2025-01-20 10:00:00'
        },
        {
            id: 'DSP-002',
            type: 'Rider vs Vendor',
            parties: 'Rider: Rider-001, Vendor: XYZ Apparel',
            orderId: 'ORD-12346',
            status: 'Pending Review',
            created: '2025-01-20 11:30:00'
        }
    ]
};

// Fetch disputes from API (placeholder)
async function fetchDisputes() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/disputes');
        // if (response.ok) {
        //     disputesData = await response.json();
        //     updateDisputesDisplay(disputesData);
        // }
        
        updateDisputesDisplay(disputesData);
    } catch (error) {
        console.error('Error fetching disputes:', error);
        updateDisputesDisplay(disputesData);
    }
}

// Update disputes display
function updateDisputesDisplay(data) {
    document.getElementById('active-disputes').textContent = data.active || 0;
    document.getElementById('pending-review').textContent = data.pendingReview || 0;
    document.getElementById('resolved-disputes').textContent = data.resolved || 0;
    
    renderDisputesTable(data.disputes || []);
}

// Render disputes table
function renderDisputesTable(disputes) {
    const tbody = document.getElementById('disputes-table-body');
    if (!tbody) return;

    if (disputes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">No disputes found.</td></tr>';
        return;
    }

    tbody.innerHTML = disputes.map(dispute => {
        const statusClass = dispute.status === 'Active' ? 'status-overdue' : 
                           dispute.status === 'Pending Review' ? 'status-pending' : 'status-resolved';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white">${dispute.id}</td>
                <td class="capitalize">${dispute.type}</td>
                <td class="text-gray-300">${dispute.parties}</td>
                <td>${dispute.orderId}</td>
                <td><span class="${statusClass}">${dispute.status}</span></td>
                <td class="text-gray-400">${dispute.created}</td>
                <td>
                    <button class="btn-primary text-xs" onclick="openDisputeModal('${dispute.id}')">Actions</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Open dispute actions modal
function openDisputeModal(disputeId) {
    const modal = document.getElementById('disputeModal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = `Dispute Actions - ${disputeId}`;
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label class="form-label">Dispute Resolution Actions</label>
                <div class="space-y-2">
                    <button class="btn-warning w-full" onclick="freezeVendorPayout('${disputeId}')">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                        Freeze Vendor Payout
                    </button>
                    <button class="btn-warning w-full" onclick="pauseRiderEarnings('${disputeId}')">
                        <i data-lucide="pause" class="w-4 h-4"></i>
                        Pause Rider Earnings
                    </button>
                    <button class="btn-primary w-full" onclick="flagForAdminReview('${disputeId}')">
                        <i data-lucide="flag" class="w-4 h-4"></i>
                        Flag for Admin Review
                    </button>
                    <button class="btn-secondary w-full" onclick="requestAdditionalProof('${disputeId}')">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                        Request Additional Proof
                    </button>
                    <button class="btn-danger w-full" onclick="markVendorAtFault('${disputeId}')">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                        Mark Vendor at Fault
                    </button>
                    <button class="btn-danger w-full" onclick="markRiderAtFault('${disputeId}')">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                        Mark Rider at Fault
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Close dispute modal
function closeDisputeModal() {
    document.getElementById('disputeModal').classList.add('hidden');
}

// Dispute action functions (placeholders)
async function freezeVendorPayout(disputeId) {
    // TODO: Implement API call
    showToast('Vendor payout frozen');
    closeDisputeModal();
}

async function pauseRiderEarnings(disputeId) {
    // TODO: Implement API call
    showToast('Rider earnings paused');
    closeDisputeModal();
}

async function flagForAdminReview(disputeId) {
    // TODO: Implement API call
    showToast('Dispute flagged for admin review');
    closeDisputeModal();
}

async function requestAdditionalProof(disputeId) {
    // TODO: Implement API call
    showToast('Additional proof requested');
    closeDisputeModal();
}

async function markVendorAtFault(disputeId) {
    // TODO: Implement API call
    showToast('Vendor marked at fault');
    closeDisputeModal();
}

async function markRiderAtFault(disputeId) {
    // TODO: Implement API call
    showToast('Rider marked at fault');
    closeDisputeModal();
}

// Refresh disputes
function refreshDisputes() {
    showToast('Disputes refreshed!');
    fetchDisputes();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchDisputes();

    document.getElementById('refreshBtn').addEventListener('click', refreshDisputes);

    // Auto-refresh every 30 seconds
    setInterval(fetchDisputes, 30000);
});
