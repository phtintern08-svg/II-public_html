// home.js - Support Dashboard JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock dashboard data (will be replaced with API calls later)
const dashboardData = {
    metrics: {
        openTickets: 24,
        inProgress: 12,
        overdueTickets: 5,
        resolvedToday: 18,
        activeAgents: 8,
        deliveryIssues: 9,
        paymentIssues: 7,
        vendorIssues: 8
    },
    status: {
        open: 24,
        inProgress: 12,
        overdue: 5,
        resolved: 18
    },
    categories: {
        delivery: 9,
        payment: 7,
        production: 8,
        account: 0
    },
    criticalTickets: [
        {
            id: 'TKT-001',
            userType: 'Customer',
            category: 'Delivery',
            priority: 'Critical',
            timeSince: '2h 15m',
            slaStatus: 'Overdue',
            assignedAgent: 'Agent Smith'
        },
        {
            id: 'TKT-002',
            userType: 'Vendor',
            category: 'Payment',
            priority: 'High',
            timeSince: '1h 30m',
            slaStatus: 'At Risk',
            assignedAgent: 'Agent Doe'
        }
    ]
};

// Fetch dashboard stats from API (placeholder for now)
async function fetchDashboardStats() {
    try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await ImpromptuIndianApi.fetch('/api/support/dashboard/stats');
        // if (response.ok) {
        //     const stats = await response.json();
        //     updateDashboard(stats);
        // }
        
        // For now, use mock data
        updateDashboard(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Use mock data on error
        updateDashboard(dashboardData);
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update metrics
    document.getElementById('open-tickets').textContent = data.metrics.openTickets || 0;
    document.getElementById('in-progress').textContent = data.metrics.inProgress || 0;
    document.getElementById('overdue-tickets').textContent = data.metrics.overdueTickets || 0;
    document.getElementById('resolved-today').textContent = data.metrics.resolvedToday || 0;
    document.getElementById('active-agents').textContent = data.metrics.activeAgents || 0;
    document.getElementById('delivery-issues').textContent = data.metrics.deliveryIssues || 0;
    document.getElementById('payment-issues').textContent = data.metrics.paymentIssues || 0;
    document.getElementById('vendor-issues').textContent = data.metrics.vendorIssues || 0;

    // Update status overview
    document.getElementById('status-open').textContent = data.status.open || 0;
    document.getElementById('status-in-progress').textContent = data.status.inProgress || 0;
    document.getElementById('status-overdue').textContent = data.status.overdue || 0;
    document.getElementById('status-resolved').textContent = data.status.resolved || 0;

    // Update category breakdown
    document.getElementById('category-delivery').textContent = data.categories.delivery || 0;
    document.getElementById('category-payment').textContent = data.categories.payment || 0;
    document.getElementById('category-production').textContent = data.categories.production || 0;
    document.getElementById('category-account').textContent = data.categories.account || 0;

    // Render critical tickets
    renderCriticalTickets(data.criticalTickets || []);
}

// Render critical tickets table
function renderCriticalTickets(tickets) {
    const tbody = document.getElementById('critical-tickets-table-body');
    if (!tbody) return;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center">No critical tickets at the moment.</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(ticket => {
        const priorityClass = ticket.priority === 'Critical' ? 'status-overdue' : 
                             ticket.priority === 'High' ? 'status-pending' : 'status-in-progress';
        const slaClass = ticket.slaStatus === 'Overdue' ? 'status-overdue' : 
                        ticket.slaStatus === 'At Risk' ? 'status-pending' : 'status-resolved';

        return `
            <tr class="hover:bg-gray-800 transition-colors cursor-pointer" onclick="window.location.href='ticket-details.html?id=${ticket.id}'">
                <td class="px-6 py-4 whitespace-nowrap font-medium text-white">${ticket.id}</td>
                <td class="px-6 py-4 capitalize">${ticket.userType}</td>
                <td class="px-6 py-4 capitalize">${ticket.category}</td>
                <td class="px-6 py-4">
                    <span class="${priorityClass}">${ticket.priority}</span>
                </td>
                <td class="px-6 py-4 text-gray-400">${ticket.timeSince}</td>
                <td class="px-6 py-4">
                    <span class="${slaClass}">${ticket.slaStatus}</span>
                </td>
                <td class="px-6 py-4 text-gray-300">${ticket.assignedAgent}</td>
            </tr>
        `;
    }).join('');
}

// Refresh dashboard
function refreshDashboard() {
    showToast('Dashboard refreshed successfully!');

    // Add pulse animation to all cards
    document.querySelectorAll('.stat-card, .info-card').forEach(card => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = '';
        }, 10);
    });

    // Re-fetch data
    fetchDashboardStats();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Fetch dashboard stats
    fetchDashboardStats();

    // Bind refresh button
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    // Add stagger animation to cards
    const cards = document.querySelectorAll('[data-delay]');
    cards.forEach(card => {
        const delay = card.getAttribute('data-delay');
        card.style.animationDelay = delay + 'ms';
    });

    // Auto-refresh every 30 seconds
    setInterval(fetchDashboardStats, 30000);
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-card, .info-card, .action-card').forEach(el => {
        observer.observe(el);
    });
});
