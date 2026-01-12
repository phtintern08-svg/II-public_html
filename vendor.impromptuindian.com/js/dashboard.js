// Vendor Dashboard Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const dashboardData = {
    orderSummary: {
        newOrders: 5,
        inProduction: 12,
        readyForDispatch: 3,
        completed: 48
    },
    workloadData: [
        { day: 'Mon', orders: 8 },
        { day: 'Tue', orders: 12 },
        { day: 'Wed', orders: 10 },
        { day: 'Thu', orders: 15 },
        { day: 'Fri', orders: 11 },
        { day: 'Sat', orders: 6 },
        { day: 'Sun', orders: 4 }
    ],
    payments: {
        pendingPayout: 2450,
        monthEarnings: 12234,
        lastPayout: 8500,
        nextPayoutDate: '2025-12-01'
    },
    upcomingDeadlines: [
        {
            orderId: 'ORD-001',
            customer: 'Alice Johnson',
            deadline: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours
            priority: 'high'
        },
        {
            orderId: 'ORD-005',
            customer: 'Ethan Hunt',
            deadline: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours
            priority: 'medium'
        },
        {
            orderId: 'ORD-003',
            customer: 'Charlie Brown',
            deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
            priority: 'low'
        }
    ]
};

/* ---------------------------
   RENDER ORDER SUMMARY
---------------------------*/
async function fetchDashboardStats() {
    const vId = localStorage.getItem('user_id');
    if (!vId) return;

    try {
        const response = await ThreadlyApi.fetch(`/vendor/dashboard-stats/${vId}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();

        dashboardData.orderSummary = data;
        renderOrderSummary();
    } catch (e) {
        console.error('Stats error:', e);
    }
}

async function fetchUpcomingDeadlines() {
    const vId = localStorage.getItem('user_id');
    if (!vId) return;

    try {
        const response = await ThreadlyApi.fetch(`/vendor/new-orders/${vId}`);
        if (!response.ok) throw new Error('Failed to fetch deadlines');
        const data = await response.json();

        dashboardData.upcomingDeadlines = data
            .map(o => ({
                orderId: o.id,
                customer: o.customerName,
                deadline: new Date(o.deadline || Date.now()),
                priority: checkPriority(o.deadline)
            }))
            .sort((a, b) => a.deadline - b.deadline)
            .slice(0, 3);

        renderUpcomingDeadlines();
    } catch (e) {
        console.error('Deadline error:', e);
    }
}

function checkPriority(dateStr) {
    if (!dateStr) return 'low';
    const diff = new Date(dateStr) - new Date();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days <= 2) return 'high';
    if (days <= 5) return 'medium';
    return 'low';
}
function renderOrderSummary() {
    const { newOrders, inProduction, readyForDispatch, completed } = dashboardData.orderSummary;

    animateCounter('new-orders-count', newOrders || 0);
    animateCounter('in-production-count', inProduction || 0);
    animateCounter('ready-dispatch-count', readyForDispatch || 0);
    animateCounter('completed-count', completed || 0);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const increment = targetValue / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

/* ---------------------------
   WORKLOAD CHART
---------------------------*/
function initializeWorkloadChart() {
    const ctx = document.getElementById('workloadChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dashboardData.workloadData.map(d => d.day),
            datasets: [{
                label: 'Orders',
                data: dashboardData.workloadData.map(d => d.orders),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 12 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 12 },
                        stepSize: 5
                    }
                }
            }
        }
    });
}

/* ---------------------------
   PAYMENT SNAPSHOT
---------------------------*/
function renderPaymentSnapshot() {
    const { pendingPayout, monthEarnings, lastPayout, nextPayoutDate } = dashboardData.payments;

    document.getElementById('pending-payout').textContent = '$' + pendingPayout.toLocaleString();
    document.getElementById('month-earnings').textContent = '$' + monthEarnings.toLocaleString();
    document.getElementById('last-payout').textContent = '$' + lastPayout.toLocaleString();

    const date = new Date(nextPayoutDate);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('payout-date').textContent = formattedDate;
}

/* ---------------------------
   UPCOMING DEADLINES
---------------------------*/
function renderUpcomingDeadlines() {
    const deadlineList = document.getElementById('deadline-list');
    if (!deadlineList) return;

    if (dashboardData.upcomingDeadlines.length === 0) {
        deadlineList.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">No upcoming deadlines</p>';
        return;
    }

    const html = dashboardData.upcomingDeadlines.map(item => {
        const timeRemaining = getTimeRemaining(item.deadline);
        const priorityClass = item.priority === 'high' ? 'deadline-high' :
            item.priority === 'medium' ? 'deadline-medium' : 'deadline-low';

        return `
            <div class="deadline-item ${priorityClass}">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="deadline-order">${item.orderId}</p>
                        <p class="deadline-customer">${item.customer}</p>
                    </div>
                    <div class="deadline-time">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        <span>${timeRemaining}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    deadlineList.innerHTML = html;
    lucide.createIcons();
}

function getTimeRemaining(deadline) {
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) return 'Overdue';

    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
        return `${hours}h remaining`;
    } else {
        const days = Math.floor(hours / 24);
        return `${days}d remaining`;
    }
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch from backend
    fetchDashboardStats();
    fetchUpcomingDeadlines();

    // Render other sections with slight delay for animation
    setTimeout(() => {
        renderOrderSummary();
        renderPaymentSnapshot();
        renderUpcomingDeadlines();
        initializeWorkloadChart();
    }, 300);

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
});
