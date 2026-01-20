// payment-issues.js - Payment Issues JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock payment issues data
let paymentData = {
    paymentIssues: 7,
    pendingRefunds: 3,
    processedRefunds: 15,
    totalRefundAmount: 2450,
    issues: [
        {
            id: 'TKT-003',
            user: 'Customer: John Doe',
            orderId: 'ORD-12345',
            issueType: 'Payment Failed',
            amount: 150.00,
            vendorPayoutStatus: 'Pending',
            refundEligibility: 'Eligible',
            status: 'Open'
        },
        {
            id: 'TKT-004',
            user: 'Vendor: ABC Prints',
            orderId: 'ORD-12346',
            issueType: 'Payout Delay',
            amount: 500.00,
            vendorPayoutStatus: 'Frozen',
            refundEligibility: 'N/A',
            status: 'In Progress'
        }
    ]
};

// Fetch payment issues from API (placeholder)
async function fetchPaymentIssues() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/payment-issues');
        // if (response.ok) {
        //     paymentData = await response.json();
        //     updatePaymentDisplay(paymentData);
        // }
        
        updatePaymentDisplay(paymentData);
    } catch (error) {
        console.error('Error fetching payment issues:', error);
        updatePaymentDisplay(paymentData);
    }
}

// Update payment display
function updatePaymentDisplay(data) {
    document.getElementById('payment-issues-count').textContent = data.paymentIssues || 0;
    document.getElementById('pending-refunds').textContent = data.pendingRefunds || 0;
    document.getElementById('processed-refunds').textContent = data.processedRefunds || 0;
    document.getElementById('total-refund-amount').textContent = `$${data.totalRefundAmount?.toLocaleString() || 0}`;
    
    renderPaymentIssuesTable(data.issues || []);
}

// Render payment issues table
function renderPaymentIssuesTable(issues) {
    const tbody = document.getElementById('payment-issues-table-body');
    if (!tbody) return;

    if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">No payment issues found.</td></tr>';
        return;
    }

    tbody.innerHTML = issues.map(issue => {
        const statusClass = issue.status === 'Open' ? 'status-open' : 
                           issue.status === 'In Progress' ? 'status-in-progress' : 'status-resolved';
        const payoutClass = issue.vendorPayoutStatus === 'Frozen' ? 'status-overdue' : 
                           issue.vendorPayoutStatus === 'Pending' ? 'status-pending' : 'status-resolved';
        const refundClass = issue.refundEligibility === 'Eligible' ? 'status-resolved' : 'status-closed';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white cursor-pointer" onclick="window.location.href='ticket-details.html?id=${issue.id}'">${issue.id}</td>
                <td class="text-gray-300">${issue.user}</td>
                <td>${issue.orderId}</td>
                <td class="capitalize">${issue.issueType}</td>
                <td class="font-semibold">$${issue.amount.toFixed(2)}</td>
                <td><span class="${payoutClass}">${issue.vendorPayoutStatus}</span></td>
                <td><span class="${refundClass}">${issue.refundEligibility}</span></td>
                <td><span class="${statusClass}">${issue.status}</span></td>
                <td>
                    <button class="btn-primary text-xs" onclick="window.location.href='ticket-details.html?id=${issue.id}'">View</button>
                    ${issue.refundEligibility === 'Eligible' ? `<button class="btn-warning text-xs ml-2" onclick="openRefundModal('${issue.id}', ${issue.amount})">Refund</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Open refund modal
function openRefundModal(ticketId, amount) {
    const modal = document.getElementById('refundModal');
    const modalBody = document.getElementById('refund-modal-body');
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label class="form-label">Ticket ID</label>
                <input type="text" class="form-input" value="${ticketId}" readonly />
            </div>
            <div class="form-group">
                <label class="form-label">Refund Amount</label>
                <input type="number" class="form-input" id="refund-amount" value="${amount}" step="0.01" min="0" max="${amount}" />
            </div>
            <div class="form-group">
                <label class="form-label">Refund Type</label>
                <select class="form-select" id="refund-type">
                    <option value="full">Full Refund</option>
                    <option value="partial">Partial Refund</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Reason</label>
                <textarea class="form-textarea" id="refund-reason" placeholder="Enter refund reason..."></textarea>
            </div>
            <div class="flex gap-2">
                <button class="btn-primary flex-1" onclick="processRefund('${ticketId}')">Process Refund</button>
                <button class="btn-secondary" onclick="closeRefundModal()">Cancel</button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close refund modal
function closeRefundModal() {
    document.getElementById('refundModal').classList.add('hidden');
}

// Process refund
async function processRefund(ticketId) {
    const amount = parseFloat(document.getElementById('refund-amount').value);
    const type = document.getElementById('refund-type').value;
    const reason = document.getElementById('refund-reason').value;

    if (!amount || amount <= 0) {
        showToast('Please enter a valid refund amount');
        return;
    }

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch(`/api/support/payment-issues/${ticketId}/refund`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ amount, type, reason })
        // });
        
        showToast('Refund processed successfully!');
        closeRefundModal();
        fetchPaymentIssues();
    } catch (error) {
        console.error('Error processing refund:', error);
        showToast('Failed to process refund');
    }
}

// Refresh payment issues
function refreshPaymentIssues() {
    showToast('Payment issues refreshed!');
    fetchPaymentIssues();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchPaymentIssues();

    document.getElementById('refreshBtn').addEventListener('click', refreshPaymentIssues);

    // Auto-refresh every 30 seconds
    setInterval(fetchPaymentIssues, 30000);
});
