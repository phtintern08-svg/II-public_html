lucide.createIcons();

const reportData = {
    orders: { total: 72, completed: 48, inProgress: 12, new: 5, rejected: 7 },
    performance: { onTime: 96, avgRating: 4.8, rejectionRate: 3.2 },
    revenue: [8500, 9200, 10650, 11400, 12234, 13100]
};

function initializeCharts() {
    const ordersCtx = document.getElementById('ordersChart');
    new Chart(ordersCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'New', 'Rejected'],
            datasets: [{
                data: [reportData.orders.completed, reportData.orders.inProgress, reportData.orders.new, reportData.orders.rejected],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 15 } },
                tooltip: { backgroundColor: '#1a1f2e', titleColor: '#ffffff', bodyColor: '#9ca3af', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, padding: 12 }
            }
        }
    });

    const revenueCtx = document.getElementById('revenueChart');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: reportData.revenue,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#1a1f2e', titleColor: '#ffffff', bodyColor: '#9ca3af', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, padding: 12, callbacks: { label: (context) => '$' + context.parsed.y.toLocaleString() } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', callback: (value) => '$' + value } }
            }
        }
    });
}

function renderMetrics() {
    document.getElementById('total-orders').textContent = reportData.orders.total;
    document.getElementById('on-time').textContent = reportData.performance.onTime + '%';
    document.getElementById('avg-rating').textContent = reportData.performance.avgRating.toFixed(1);
    document.getElementById('rejection-rate').textContent = reportData.performance.rejectionRate + '%';
}

function changeReportType() {
    showToast('Report type changed');
}

function changePeriod() {
    showToast('Period updated');
}

function exportReport() {
    showToast('Exporting report as PDF...');
}

function showToast(message) {
    const toast = document.getElementById('success-toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeCharts();
        renderMetrics();
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
    }, 300);
});
