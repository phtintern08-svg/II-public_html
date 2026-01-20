// sla-monitor.js - SLA Monitor JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock SLA data
let slaData = {
    overdue: 5,
    atRisk: 12,
    onTime: 45,
    avgResolution: '2h 30m',
    tickets: [
        {
            id: 'TKT-001',
            priority: 'Critical',
            maxTime: '4h',
            timeRemaining: '-30m',
            status: 'Overdue',
            autoEscalated: true
        },
        {
            id: 'TKT-002',
            priority: 'High',
            maxTime: '8h',
            timeRemaining: '1h 15m',
            status: 'At Risk',
            autoEscalated: false
        }
    ]
};

// Fetch SLA data from API (placeholder)
async function fetchSLAData() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/sla-monitor');
        // if (response.ok) {
        //     slaData = await response.json();
        //     updateSLADisplay(slaData);
        // }
        
        updateSLADisplay(slaData);
    } catch (error) {
        console.error('Error fetching SLA data:', error);
        updateSLADisplay(slaData);
    }
}

// Update SLA display
function updateSLADisplay(data) {
    document.getElementById('overdue-count').textContent = data.overdue || 0;
    document.getElementById('at-risk-count').textContent = data.atRisk || 0;
    document.getElementById('on-time-count').textContent = data.onTime || 0;
    document.getElementById('avg-resolution').textContent = data.avgResolution || '0h';
    
    renderSLATickets(data.tickets || []);
}

// Render SLA tickets table
function renderSLATickets(tickets) {
    const tbody = document.getElementById('sla-tickets-table-body');
    if (!tbody) return;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">No tickets found.</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(ticket => {
        const priorityClass = ticket.priority === 'Critical' ? 'status-overdue' : 
                             ticket.priority === 'High' ? 'status-pending' : 'status-in-progress';
        const statusClass = ticket.status === 'Overdue' ? 'status-overdue' : 
                           ticket.status === 'At Risk' ? 'status-pending' : 'status-resolved';
        const timeClass = ticket.timeRemaining.startsWith('-') ? 'text-red-400' : 
                         ticket.timeRemaining.includes('h') && parseInt(ticket.timeRemaining) < 2 ? 'text-yellow-400' : 'text-green-400';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white cursor-pointer" onclick="window.location.href='ticket-details.html?id=${ticket.id}'">${ticket.id}</td>
                <td><span class="${priorityClass}">${ticket.priority}</span></td>
                <td class="text-gray-300">${ticket.maxTime}</td>
                <td class="${timeClass} font-semibold">${ticket.timeRemaining}</td>
                <td><span class="${statusClass}">${ticket.status}</span></td>
                <td>${ticket.autoEscalated ? '<span class="status-overdue">Yes</span>' : '<span class="status-resolved">No</span>'}</td>
                <td>
                    <button class="btn-primary text-xs" onclick="window.location.href='ticket-details.html?id=${ticket.id}'">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Refresh SLA data
function refreshSLAData() {
    showToast('SLA data refreshed!');
    fetchSLAData();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchSLAData();

    document.getElementById('refreshBtn').addEventListener('click', refreshSLAData);

    // Auto-refresh every 30 seconds
    setInterval(fetchSLAData, 30000);
});
