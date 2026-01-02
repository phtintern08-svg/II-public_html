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
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTickets();
});

// Load support tickets
function loadTickets() {
    const container = document.getElementById('ticketsContainer');

    // Sample tickets
    const tickets = [
        {
            id: 1,
            category: 'delivery_issue',
            subject: 'Package was damaged',
            description: 'The package I picked up from the vendor was already damaged. I took photos as proof.',
            status: 'in_progress',
            created_at: '02 Dec, 01:00 PM',
            admin_response: 'We are investigating this issue. Please provide the delivery ID.'
        },
        {
            id: 2,
            category: 'payment_issue',
            subject: 'Payment not received',
            description: 'My last payout was supposed to be released on 25th Nov but I haven\'t received it yet.',
            status: 'resolved',
            created_at: '28 Nov, 10:00 AM',
            resolved_at: '29 Nov, 03:00 PM',
            admin_response: 'The payment has been processed. Please check your account.'
        },
        {
            id: 3,
            category: 'technical_issue',
            subject: 'App keeps crashing',
            description: 'The app crashes when I try to upload delivery proof photos.',
            status: 'open',
            created_at: '01 Dec, 05:00 PM',
            admin_response: null
        }
    ];

    displayTickets(tickets);
}

// Display tickets
function displayTickets(tickets) {
    const container = document.getElementById('ticketsContainer');

    const filtered = currentFilter === 'all' ? tickets :
        tickets.filter(t => t.status === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="info-card text-center py-12">
                <i data-lucide="inbox" class="w-16 h-16 mx-auto mb-4 text-muted"></i>
                <p class="text-lg text-muted">No tickets found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map(ticket => `
        <div class="ticket-card" onclick="viewTicketDetails(${ticket.id})">
            <div class="ticket-header">
                <div>
                    <p class="ticket-id">#TICKET-${String(ticket.id).padStart(3, '0')}</p>
                    <div class="ticket-category">
                        <i data-lucide="${getCategoryIcon(ticket.category)}" class="w-3 h-3"></i>
                        ${formatCategory(ticket.category)}
                    </div>
                </div>
                <span class="ticket-status ${ticket.status}">${formatStatus(ticket.status)}</span>
            </div>
            <div class="ticket-subject">${ticket.subject}</div>
            <div class="ticket-description">${ticket.description}</div>
            ${ticket.admin_response ? `
                <div class="admin-response">
                    <div class="admin-response-header">
                        <i data-lucide="user" class="w-4 h-4"></i>
                        Admin Response
                    </div>
                    <p class="text-sm">${ticket.admin_response}</p>
                </div>
            ` : ''}
            <div class="ticket-meta">
                <span><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${ticket.created_at}</span>
                ${ticket.resolved_at ? `<span><i data-lucide="check-circle" class="w-3 h-3 inline"></i> Resolved: ${ticket.resolved_at}</span>` : ''}
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

// Filter tickets
function filterTickets(status) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    loadTickets();
}

// Open create ticket modal
function openCreateTicketModal() {
    document.getElementById('createTicketModal').classList.remove('hidden');
}

function closeCreateTicketModal() {
    document.getElementById('createTicketModal').classList.add('hidden');
    document.getElementById('createTicketForm').reset();
}

// Create ticket
function createTicket(event) {
    event.preventDefault();

    const category = document.getElementById('ticketCategory').value;
    const subject = document.getElementById('ticketSubject').value;
    const description = document.getElementById('ticketDescription').value;
    const attachment = document.getElementById('ticketAttachment').files[0];

    if (!category || !subject || !description) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    showToast('Support ticket created successfully', 'success');
    closeCreateTicketModal();
    loadTickets();
}

// View ticket details
function viewTicketDetails(ticketId) {
    document.getElementById('ticketDetailsModal').classList.remove('hidden');
    document.getElementById('ticketDetailsContent').innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-muted">Ticket ID</p>
                    <p class="font-semibold">#TICKET-${String(ticketId).padStart(3, '0')}</p>
                </div>
                <div>
                    <p class="text-sm text-muted">Status</p>
                    <span class="ticket-status in_progress">In Progress</span>
                </div>
            </div>
            <div>
                <p class="text-sm text-muted mb-1">Subject</p>
                <p class="font-semibold">Package was damaged</p>
            </div>
            <div>
                <p class="text-sm text-muted mb-1">Description</p>
                <p class="text-sm">The package I picked up from the vendor was already damaged. I took photos as proof.</p>
            </div>
            <div class="admin-response">
                <div class="admin-response-header">
                    <i data-lucide="user" class="w-4 h-4"></i>
                    Admin Response
                </div>
                <p class="text-sm">We are investigating this issue. Please provide the delivery ID.</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function closeTicketDetailsModal() {
    document.getElementById('ticketDetailsModal').classList.add('hidden');
}

// Helper functions
function getCategoryIcon(category) {
    switch (category) {
        case 'delivery_issue': return 'package';
        case 'payment_issue': return 'dollar-sign';
        case 'technical_issue': return 'alert-circle';
        default: return 'help-circle';
    }
}

function formatCategory(category) {
    return category.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatStatus(status) {
    return status.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
