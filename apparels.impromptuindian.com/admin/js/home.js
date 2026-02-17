// home.js - Modern Admin Dashboard with Animations

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock dashboard data
const dashboardData = {
    orders: {
        today: 12,
        week: 85,
        month: 320,
        pending: 14,
        inProduction: 27,
        readyDispatch: 9,
        delivered: 260,
        cancelled: 5
    },
    vendors: {
        pending: 4,
        approved: 38,
        rejected: 2,
        suspended: 1,
        missingDeadlines: 3
    },
    riders: {
        active: 12,
        delivering: 5,
        idle: 7,
        performanceScore: 87
    },
    finance: {
        platformRevenue: 45230,
        paymentsToday: 1240,
        escrowHeld: 8300,
        commissionToday: 6780,
        penalties: 320
    },
    alerts: [
        {
            id: 1,
            title: 'Unassigned Orders',
            message: '3 orders are waiting for vendor assignment',
            type: 'warning'
        },
        {
            id: 2,
            title: 'Delayed Production',
            message: '2 vendors have delayed production beyond SLA',
            type: 'danger'
        }
    ]
};

// Fetch dashboard stats from API
async function fetchDashboardStats() {
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/dashboard/stats');
        if (response.ok) {
            const stats = await response.json();
            // Update with real data
            document.getElementById('pending-orders').textContent = stats.pending_orders || 0;
            document.getElementById('in-production').textContent = stats.in_production || 0;
            document.getElementById('ready-dispatch').textContent = stats.ready_dispatch || 0;
            document.getElementById('delivered').textContent = stats.completed_orders || 0;
            // Update vendor counts
            document.getElementById('vendor-pending').textContent = stats.vendor_pending || 0;
            document.getElementById('vendor-approved').textContent = stats.total_vendors || 0;
            // Update rider counts
            document.getElementById('rider-active').textContent = stats.total_riders || 0;
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// Populate dashboard on load
function populateDashboard() {
    // Order Statistics (use mock data as fallback)
    document.getElementById('orders-today').textContent = dashboardData.orders.today;
    document.getElementById('orders-week').textContent = dashboardData.orders.week;
    document.getElementById('orders-month').textContent = dashboardData.orders.month;
    document.getElementById('pending-orders').textContent = dashboardData.orders.pending;
    document.getElementById('in-production').textContent = dashboardData.orders.inProduction;
    document.getElementById('ready-dispatch').textContent = dashboardData.orders.readyDispatch;
    document.getElementById('delivered').textContent = dashboardData.orders.delivered;
    document.getElementById('cancelled').textContent = dashboardData.orders.cancelled;

    // Vendor Status
    document.getElementById('vendor-pending').textContent = dashboardData.vendors.pending;
    document.getElementById('vendor-approved').textContent = dashboardData.vendors.approved;
    document.getElementById('vendor-rejected').textContent = dashboardData.vendors.rejected;
    document.getElementById('vendor-suspended').textContent = dashboardData.vendors.suspended;
    document.getElementById('vendor-missing').textContent = dashboardData.vendors.missingDeadlines;

    // Rider Status
    document.getElementById('rider-active').textContent = dashboardData.riders.active;
    document.getElementById('rider-delivering').textContent = dashboardData.riders.delivering;
    document.getElementById('rider-idle').textContent = dashboardData.riders.idle;
    document.getElementById('rider-score').textContent = dashboardData.riders.performanceScore + '%';

    // Financial Overview
    document.getElementById('platform-revenue').textContent = '$' + dashboardData.finance.platformRevenue.toLocaleString();
    document.getElementById('payments-today').textContent = '$' + dashboardData.finance.paymentsToday.toLocaleString();
    document.getElementById('escrow-held').textContent = '$' + dashboardData.finance.escrowHeld.toLocaleString();
    document.getElementById('commission-today').textContent = '$' + dashboardData.finance.commissionToday.toLocaleString();
    document.getElementById('penalties').textContent = '$' + dashboardData.finance.penalties.toLocaleString();

    // Render alerts
    renderAlerts();

    // Animate numbers
    animateNumbers();
}

// Render critical alerts
function renderAlerts() {
    const alertsSection = document.getElementById('alerts-section');

    if (dashboardData.alerts.length === 0) {
        alertsSection.innerHTML = '';
        return;
    }

    let alertsHTML = '<h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #f1f5f9;">Critical Alerts</h3>';

    dashboardData.alerts.forEach(alert => {
        alertsHTML += `
      <div class="alert-card">
        <div class="alert-icon">
          <i data-lucide="alert-triangle" class="w-6 h-6 text-white"></i>
        </div>
        <div class="alert-content">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-message">${alert.message}</div>
        </div>
      </div>
    `;
    });

    alertsSection.innerHTML = alertsHTML;

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Animate numbers on load
function animateNumbers() {
    const animateValue = (element, start, end, duration) => {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }

            const text = element.textContent;
            if (text.includes('$')) {
                element.textContent = '$' + Math.floor(current).toLocaleString();
            } else if (text.includes('%')) {
                element.textContent = Math.floor(current) + '%';
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    };

    // Animate all stat values
    document.querySelectorAll('.stat-value, .info-value, .finance-value').forEach(el => {
        const text = el.textContent.replace(/[$,%]/g, '').replace(/,/g, '');
        const value = parseInt(text);
        if (!isNaN(value)) {
            el.textContent = '0';
            setTimeout(() => {
                animateValue(el, 0, value, 1000);
            }, 100);
        }
    });
}

// Refresh dashboard
function refreshDashboard() {
    showToast('Dashboard refreshed successfully!');

    // Add pulse animation to all cards
    document.querySelectorAll('.stat-card, .info-card, .finance-card').forEach(card => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = '';
        }, 10);
    });

    // Re-animate numbers
    setTimeout(() => {
        animateNumbers();
    }, 300);
}

// Clear alerts
function clearAlerts() {
    dashboardData.alerts = [];
    renderAlerts();
    showToast('All alerts cleared');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    populateDashboard();
    fetchDashboardStats(); // Fetch real stats from API

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Bind event listeners (replaces inline onclick handlers)
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    const refreshBtnDesktop = document.getElementById('refreshDashboardBtnDesktop');
    if (refreshBtnDesktop) {
        refreshBtnDesktop.addEventListener('click', refreshDashboard);
    }

    const refreshActivityBtn = document.getElementById('refreshActivityBtn');
    if (refreshActivityBtn) {
        refreshActivityBtn.addEventListener('click', fetchActivityLogs);
    }

    // Fetch activity logs
    fetchActivityLogs();

    // Fetch system stats
    fetchSystemStats();

    // Auto-refresh system stats every 5 seconds
    setInterval(fetchSystemStats, 5000);

    // Add stagger animation to cards
    const cards = document.querySelectorAll('[data-delay]');
    cards.forEach(card => {
        const delay = card.getAttribute('data-delay');
        card.style.animationDelay = delay + 'ms';
    });
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

// Observe all animated elements
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-card, .info-card, .finance-card, .action-card').forEach(el => {
        observer.observe(el);
    });
});

// Fetch and display activity logs
async function fetchActivityLogs() {
    const tbody = document.getElementById('activity-logs-table-body');
    if (!tbody) return;

    try {
        const fetchFn = window.ImpromptuIndianApi ? window.ImpromptuIndianApi.fetch : fetch;
        const response = await fetchFn('/api/admin/activity-logs?limit=10');

        if (response.ok) {
            const data = await response.json();
            const activities = data.activities || [];

            if (activities.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-400">No activity logs found.</td></tr>';
                return;
            }

            tbody.innerHTML = activities.map(activity => {
                const timestamp = activity.timestamp ? new Date(activity.timestamp + 'Z').toLocaleString() : 'N/A';
                
                // Format action with icon based on action type
                let actionIcon = 'activity';
                let actionColor = 'text-blue-400';
                
                if (activity.action_type === 'order_status_change') {
                    actionIcon = 'package';
                    actionColor = 'text-purple-400';
                } else if (activity.action_type === 'verification') {
                    actionIcon = 'user-check';
                    if (activity.action.includes('Approved')) {
                        actionColor = 'text-green-400';
                    } else if (activity.action.includes('Rejected')) {
                        actionColor = 'text-red-400';
                    }
                } else if (activity.action_type === 'admin_action') {
                    actionIcon = 'settings';
                    actionColor = 'text-yellow-400';
                }

                return `
                    <tr class="hover:bg-gray-800 transition-colors">
                        <td class="px-3 sm:px-6 py-3 sm:py-4">
                            <div class="flex items-center gap-2">
                                <i data-lucide="${actionIcon}" class="w-4 h-4 ${actionColor}"></i>
                                <span class="font-medium text-white">${activity.user_name || 'Admin'}</span>
                            </div>
                        </td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4">
                            <span class="text-gray-300">${activity.action || 'N/A'}</span>
                            ${activity.details ? `<div class="text-xs text-gray-500 mt-1">${activity.details}</div>` : ''}
                        </td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-gray-400 text-xs sm:text-sm">${timestamp}</td>
                    </tr>
                `;
            }).join('');

            // Re-initialize Lucide icons for the new icons
            if (window.lucide) {
                lucide.createIcons();
            }

        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-400">Failed to load activity logs.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-400">Error loading activity logs.</td></tr>';
    }
}

// Fetch and display system statistics
async function fetchSystemStats() {
    try {
        const fetchFn = window.ImpromptuIndianApi ? window.ImpromptuIndianApi.fetch : fetch;
        // 🔥 FIX: This endpoint doesn't exist in backend - commenting out for now
        // TODO: Implement /api/admin/system-stats endpoint in backend if needed
        // For now, skip this call to prevent 404 errors
        return; // Disable until backend endpoint is implemented
        // const response = await fetchFn('/api/admin/system-stats');

        if (response.ok) {
            const stats = await response.json();

            // Update CPU
            const cpuPercent = stats.cpu.percent;
            document.getElementById('cpu-percent').textContent = cpuPercent + '%';
            document.getElementById('cpu-cores').textContent = stats.cpu.cores + ' Cores Available';
            updateCircularProgress('cpu-progress', cpuPercent);

            // Update RAM
            const ramPercent = stats.ram.percent;
            document.getElementById('ram-percent').textContent = ramPercent.toFixed(1) + '%';
            document.getElementById('ram-usage').textContent = `${stats.ram.used_mb} MB Used`;
            updateCircularProgress('ram-progress', ramPercent);

            // Update I/O
            document.getElementById('io-read').textContent = stats.io.read_mb.toLocaleString() + ' MB';
            document.getElementById('io-written').textContent = stats.io.written_mb.toLocaleString() + ' MB';
            document.getElementById('io-total').textContent = stats.io.total_mb.toLocaleString() + ' MB';

            // Update Process Info
            if (stats.process) {
                document.getElementById('process-threads').textContent = stats.process.threads + ' Threads';
                document.getElementById('process-uptime').textContent = `Uptime: ${stats.process.uptime_hours}h`;
                document.getElementById('process-pid').textContent = `PID: ${stats.process.pid}`;
            }

        } else {
            console.error('Failed to fetch system stats');
        }
    } catch (error) {
        console.error('Error loading system stats:', error);
    }
}

// Update circular progress indicator
function updateCircularProgress(elementId, percent) {
    const circle = document.getElementById(elementId);
    if (!circle) return;

    const circumference = 2 * Math.PI * 56; // radius = 56
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Change color based on usage
    if (percent >= 90) {
        circle.setAttribute('stroke', '#ef4444'); // red
    } else if (percent >= 70) {
        circle.setAttribute('stroke', '#f59e0b'); // orange
    } else if (elementId === 'cpu-progress') {
        circle.setAttribute('stroke', '#3b82f6'); // blue
    } else {
        circle.setAttribute('stroke', '#10b981'); // green
    }
}
