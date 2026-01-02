// Support Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const mockTickets = [
    {
        id: 'TKT-001',
        category: 'payment',
        subject: 'Payout not received',
        description: 'I have not received my payout for November. Please check.',
        status: 'open',
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        adminResponse: null
    },
    {
        id: 'TKT-002',
        category: 'technical',
        subject: 'Cannot upload photos',
        description: 'Getting error when trying to upload production photos.',
        status: 'in-progress',
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        adminResponse: 'We are looking into this issue. Please try again in a few hours.'
    },
    {
        id: 'TKT-003',
        category: 'order',
        subject: 'Order deadline extension',
        description: 'Need 2 more days for ORD-005 due to machine breakdown.',
        status: 'closed',
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        adminResponse: 'Extension approved. New deadline: Nov 25.'
    }
];

let tickets = [...mockTickets];

/* ---------------------------
   RENDER TICKETS
---------------------------*/
function renderTickets() {
    const ticketsList = document.getElementById('tickets-list');

    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" class="w-12 h-12 text-gray-600 mb-3"></i>
                <p class="text-gray-400">No support tickets yet</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const html = tickets.map(ticket => {
        const statusClass = ticket.status === 'open' ? 'status-open' :
            ticket.status === 'in-progress' ? 'status-progress' : 'status-closed';
        const statusLabel = ticket.status === 'open' ? 'Open' :
            ticket.status === 'in-progress' ? 'In Progress' : 'Closed';
        const dateStr = ticket.createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="ticket-item" onclick="viewTicketDetails('${ticket.id}')">
                <div class="ticket-header">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="ticket-status ${statusClass}">${statusLabel}</span>
                </div>
                <h4 class="ticket-subject">${ticket.subject}</h4>
                <p class="ticket-meta">
                    <span class="ticket-category">${getCategoryLabel(ticket.category)}</span>
                    <span class="ticket-date">${dateStr}</span>
                </p>
            </div>
        `;
    }).join('');

    ticketsList.innerHTML = html;
    lucide.createIcons();
}

function getCategoryLabel(category) {
    const labels = {
        'technical': 'Technical',
        'payment': 'Payment',
        'order': 'Order',
        'verification': 'Verification',
        'other': 'Other'
    };
    return labels[category] || 'Other';
}

/* ---------------------------
   NEW TICKET MODAL
---------------------------*/
function openNewTicketModal() {
    document.getElementById('new-ticket-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeNewTicketModal() {
    document.getElementById('new-ticket-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';

    // Clear form
    document.getElementById('ticket-category').value = 'technical';
    document.getElementById('ticket-subject').value = '';
    document.getElementById('ticket-description').value = '';
}

function submitTicket() {
    const category = document.getElementById('ticket-category').value;
    const subject = document.getElementById('ticket-subject').value;
    const description = document.getElementById('ticket-description').value;

    if (!subject || !description) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const newTicket = {
        id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
        category,
        subject,
        description,
        status: 'open',
        createdDate: new Date(),
        adminResponse: null
    };

    tickets.unshift(newTicket);
    closeNewTicketModal();
    renderTickets();
    showToast('Support ticket created successfully!');
}

/* ---------------------------
   TICKET DETAILS MODAL
---------------------------*/
function viewTicketDetails(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticket-details-modal');
    const title = document.getElementById('ticket-details-title');
    const body = document.getElementById('ticket-details-body');

    title.textContent = `${ticket.id} - ${ticket.subject}`;

    const statusClass = ticket.status === 'open' ? 'status-open' :
        ticket.status === 'in-progress' ? 'status-progress' : 'status-closed';
    const statusLabel = ticket.status === 'open' ? 'Open' :
        ticket.status === 'in-progress' ? 'In Progress' : 'Closed';

    body.innerHTML = `
        <div class="ticket-details">
            <div class="detail-row">
                <span class="detail-label">Ticket ID:</span>
                <span class="detail-value">${ticket.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${getCategoryLabel(ticket.category)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="ticket-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${ticket.createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div class="detail-section">
                <h4 class="detail-section-title">Description</h4>
                <p class="detail-description">${ticket.description}</p>
            </div>
            ${ticket.adminResponse ? `
                <div class="detail-section">
                    <h4 class="detail-section-title">Admin Response</h4>
                    <div class="admin-response">
                        <i data-lucide="message-circle" class="w-5 h-5"></i>
                        <p>${ticket.adminResponse}</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeTicketDetailsModal() {
    document.getElementById('ticket-details-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/* ---------------------------
   FAQ TOGGLE
---------------------------*/
function toggleFaq(element) {
    const isOpen = element.classList.contains('open');

    // Close all FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
    });

    // Open clicked FAQ if it wasn't open
    if (!isOpen) {
        element.classList.add('open');
    }

    lucide.createIcons();
}

/* ---------------------------
   TOAST
---------------------------*/
function showToast(message, type = 'success') {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    messageEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    renderTickets();

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

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNewTicketModal();
            closeTicketDetailsModal();
        }
    });
});
