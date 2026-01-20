// live-tickets.js - Live Ticket Queue JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock tickets data (will be replaced with API calls)
let ticketsData = [
    {
        id: 'TKT-001',
        userType: 'Customer',
        orderId: 'ORD-12345',
        category: 'Delivery',
        priority: 'Critical',
        timeSince: '2h 15m',
        slaTimer: 'Overdue',
        assignedAgent: 'Agent Smith',
        status: 'open'
    },
    {
        id: 'TKT-002',
        userType: 'Vendor',
        orderId: 'ORD-12346',
        category: 'Payment',
        priority: 'High',
        timeSince: '1h 30m',
        slaTimer: 'At Risk',
        assignedAgent: 'Agent Doe',
        status: 'in-progress'
    }
];

// Fetch tickets from API (placeholder)
async function fetchTickets() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/tickets');
        // if (response.ok) {
        //     ticketsData = await response.json();
        //     renderTickets(ticketsData);
        // }
        
        renderTickets(ticketsData);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        renderTickets(ticketsData);
    }
}

// Render tickets table
function renderTickets(tickets) {
    const tbody = document.getElementById('tickets-table-body');
    if (!tbody) return;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">No tickets found.</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(ticket => {
        const priorityClass = ticket.priority === 'Critical' ? 'status-overdue' : 
                             ticket.priority === 'High' ? 'status-pending' : 
                             ticket.priority === 'Medium' ? 'status-in-progress' : 'status-resolved';
        const slaClass = ticket.slaTimer === 'Overdue' ? 'status-overdue' : 
                        ticket.slaTimer === 'At Risk' ? 'status-pending' : 'status-resolved';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white cursor-pointer" onclick="window.location.href='ticket-details.html?id=${ticket.id}'">${ticket.id}</td>
                <td class="capitalize">${ticket.userType}</td>
                <td>${ticket.orderId || 'N/A'}</td>
                <td class="capitalize">${ticket.category}</td>
                <td><span class="${priorityClass}">${ticket.priority}</span></td>
                <td class="text-gray-400">${ticket.timeSince}</td>
                <td><span class="${slaClass}">${ticket.slaTimer}</span></td>
                <td class="text-gray-300">${ticket.assignedAgent || 'Unassigned'}</td>
                <td>
                    <button class="btn-primary text-xs" onclick="window.location.href='ticket-details.html?id=${ticket.id}'">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter tickets
function filterTickets() {
    const userType = document.getElementById('filterUserType').value;
    const priority = document.getElementById('filterPriority').value;
    const status = document.getElementById('filterStatus').value;
    const category = document.getElementById('filterCategory').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = ticketsData.filter(ticket => {
        if (userType && ticket.userType.toLowerCase() !== userType) return false;
        if (priority && ticket.priority.toLowerCase() !== priority) return false;
        if (status && ticket.status !== status) return false;
        if (category && ticket.category.toLowerCase() !== category) return false;
        if (search && !ticket.id.toLowerCase().includes(search) && !ticket.orderId?.toLowerCase().includes(search)) return false;
        return true;
    });

    renderTickets(filtered);
}

// Refresh tickets
function refreshTickets() {
    showToast('Tickets refreshed!');
    fetchTickets();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchTickets();

    // Bind filter events
    document.getElementById('filterUserType').addEventListener('change', filterTickets);
    document.getElementById('filterPriority').addEventListener('change', filterTickets);
    document.getElementById('filterStatus').addEventListener('change', filterTickets);
    document.getElementById('filterCategory').addEventListener('change', filterTickets);
    document.getElementById('searchInput').addEventListener('input', filterTickets);

    // Bind refresh button
    document.getElementById('refreshBtn').addEventListener('click', refreshTickets);

    // Auto-refresh every 30 seconds
    setInterval(fetchTickets, 30000);
});
