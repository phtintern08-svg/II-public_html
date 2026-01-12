// support-tickets.js – admin support ticket management (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock tickets data
let tickets = [
    {
        id: 'TKT-1001',
        userType: 'customer',
        userName: 'Alice Johnson',
        subject: 'Order not received',
        priority: 'high',
        status: 'open',
        created: '2025-11-23',
        messages: [
            { sender: 'Alice Johnson', text: 'I placed order #1045 but haven\'t received it yet.', time: '10:30 AM', isAdmin: false },
            { sender: 'Admin', text: 'We are looking into this. Please allow 24 hours.', time: '11:00 AM', isAdmin: true }
        ]
    },
    {
        id: 'TKT-1002',
        userType: 'vendor',
        userName: 'DTF Prints Co.',
        subject: 'Payment delay issue',
        priority: 'medium',
        status: 'pending',
        created: '2025-11-22',
        messages: [
            { sender: 'DTF Prints Co.', text: 'My payout for order #1028 is delayed.', time: '2:15 PM', isAdmin: false }
        ]
    },
    {
        id: 'TKT-1003',
        userType: 'rider',
        userName: 'John Doe',
        subject: 'Vehicle breakdown',
        priority: 'high',
        status: 'open',
        created: '2025-11-24',
        messages: [
            { sender: 'John Doe', text: 'My bike broke down. Cannot complete delivery.', time: '9:00 AM', isAdmin: false }
        ]
    },
    {
        id: 'TKT-1004',
        userType: 'customer',
        userName: 'Bob Smith',
        subject: 'Quality issue with product',
        priority: 'low',
        status: 'resolved',
        created: '2025-11-20',
        messages: [
            { sender: 'Bob Smith', text: 'The print quality is not good.', time: '3:00 PM', isAdmin: false },
            { sender: 'Admin', text: 'We will arrange a replacement.', time: '3:30 PM', isAdmin: true },
            { sender: 'Bob Smith', text: 'Thank you! Issue resolved.', time: '4:00 PM', isAdmin: false }
        ]
    }
];

let currentTicketId = null;

function calculateSummary() {
    const open = tickets.filter(t => t.status === 'open').length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const resolved = tickets.filter(t => t.status === 'resolved' && t.created === '2025-11-24').length;

    document.getElementById('open-tickets').textContent = open;
    document.getElementById('pending-tickets').textContent = pending;
    document.getElementById('resolved-tickets').textContent = resolved;
    document.getElementById('avg-response').textContent = '2.5h';
}

function renderTickets() {
    const tbody = document.getElementById('tickets-table');
    tbody.innerHTML = '';
    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.userType}</td>
      <td>${t.subject}</td>
      <td><span class="priority-${t.priority}">${t.priority}</span></td>
      <td><span class="status-${t.status}">${t.status}</span></td>
      <td>${t.created}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewTicket('${t.id}')"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function filterTickets() {
    const priority = document.getElementById('priority-filter').value;
    const type = document.getElementById('type-filter').value;
    const status = document.getElementById('status-filter').value;
    const term = document.getElementById('search-ticket').value.toLowerCase();

    const filtered = tickets.filter(t => {
        const matchPriority = priority === 'all' || t.priority === priority;
        const matchType = type === 'all' || t.userType === type;
        const matchStatus = status === 'all' || t.status === status;
        const matchTerm = t.id.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term) || t.userName.toLowerCase().includes(term);
        return matchPriority && matchType && matchStatus && matchTerm;
    });

    const tbody = document.getElementById('tickets-table');
    tbody.innerHTML = '';
    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.userType}</td>
      <td>${t.subject}</td>
      <td><span class="priority-${t.priority}">${t.priority}</span></td>
      <td><span class="status-${t.status}">${t.status}</span></td>
      <td>${t.created}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewTicket('${t.id}')"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function viewTicket(id) {
    currentTicketId = id;
    const ticket = tickets.find(t => t.id === id);
    const body = document.getElementById('modal-body');

    let messagesHTML = '';
    ticket.messages.forEach(msg => {
        messagesHTML += `
      <div class="chat-message ${msg.isAdmin ? 'admin' : ''}">
        <div class="chat-sender">${msg.sender}</div>
        <div class="chat-text">${msg.text}</div>
        <div class="chat-time">${msg.time}</div>
      </div>
    `;
    });

    body.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Ticket Information</h3>
        <p><strong>Ticket ID:</strong> ${ticket.id}</p>
        <p><strong>User Type:</strong> ${ticket.userType}</p>
        <p><strong>User Name:</strong> ${ticket.userName}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> <span class="priority-${ticket.priority}">${ticket.priority}</span></p>
        <p><strong>Status:</strong> <span class="status-${ticket.status}">${ticket.status}</span></p>
        <p><strong>Created:</strong> ${ticket.created}</p>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-2">Conversation</h3>
        <div class="chat-container">
          ${messagesHTML}
        </div>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Reply to User</label>
        <textarea id="ticket-reply" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Type your response..."></textarea>
        <button class="btn-primary mt-2" onclick="sendReply()"><i data-lucide="send" class="w-4 h-4"></i>Send Reply</button>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Internal Notes</label>
        <textarea id="internal-notes" class="w-full p-2 bg-gray-800 text-white rounded" rows="2" placeholder="Add internal notes (not visible to user)..."></textarea>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Assign to Staff</label>
        <select id="assign-staff" class="w-full p-2 bg-gray-800 rounded">
          <option value="">Select staff member</option>
          <option value="staff1">Support Agent 1</option>
          <option value="staff2">Support Agent 2</option>
          <option value="staff3">Support Agent 3</option>
        </select>
      </div>
    </div>
  `;

    document.getElementById('modal-title').textContent = `Ticket ${ticket.id} - ${ticket.subject}`;
    document.getElementById('ticket-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.add('hidden');
    currentTicketId = null;
}

function sendReply() {
    const reply = document.getElementById('ticket-reply')?.value;
    if (!reply) {
        showToast('Please enter a reply');
        return;
    }

    const ticket = tickets.find(t => t.id === currentTicketId);
    ticket.messages.push({
        sender: 'Admin',
        text: reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isAdmin: true
    });

    showToast('Reply sent successfully');
    viewTicket(currentTicketId);
}

function assignStaff() {
    const staff = document.getElementById('assign-staff')?.value;
    if (!staff) {
        showToast('Please select a staff member');
        return;
    }
    showToast('Ticket assigned to staff');
}

function resolveTicket() {
    if (!currentTicketId) return;
    const ticket = tickets.find(t => t.id === currentTicketId);
    ticket.status = 'resolved';
    showToast('Ticket marked as resolved');
    closeTicketModal();
    renderTickets();
    calculateSummary();
}

function refreshTickets() {
    renderTickets();
    calculateSummary();
    showToast('Tickets refreshed');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    calculateSummary();
    renderTickets();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
