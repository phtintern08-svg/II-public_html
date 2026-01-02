// reports.js – admin advanced analytics & reporting (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let currentTab = 'orders';
let currentChart = null;

// Mock report data
const reportData = {
    orders: {
        total: 320,
        completed: 260,
        pending: 14,
        cancelled: 5,
        revenue: 45230
    },
    vendors: {
        total: 38,
        active: 35,
        avgProductionTime: 48,
        lateDeliveries: 12,
        topPerformer: 'DTF Prints Co.'
    },
    riders: {
        total: 12,
        active: 10,
        avgDeliveryTime: 2.5,
        completionRate: 94,
        topPerformer: 'John Doe'
    },
    revenue: {
        total: 45230,
        commission: 6780,
        penalties: 320,
        netRevenue: 7100
    },
    customers: {
        total: 156,
        activeThisMonth: 89,
        avgOrderValue: 850,
        repeatCustomers: 67
    }
};

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderReport();
}

function renderReport() {
    const container = document.getElementById('report-content');

    switch (currentTab) {
        case 'orders':
            container.innerHTML = `
        <div class="report-section">
          <h2 class="report-title">Orders Report</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-card-label">Total Orders</div>
              <div class="report-card-value">${reportData.orders.total}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Completed</div>
              <div class="report-card-value">${reportData.orders.completed}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Pending</div>
              <div class="report-card-value">${reportData.orders.pending}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Total Revenue</div>
              <div class="report-card-value">$${reportData.orders.revenue}</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
        </div>
      `;
            renderOrdersChart();
            break;

        case 'vendors':
            container.innerHTML = `
        <div class="report-section">
          <h2 class="report-title">Vendor Performance Report</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-card-label">Total Vendors</div>
              <div class="report-card-value">${reportData.vendors.total}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Active Vendors</div>
              <div class="report-card-value">${reportData.vendors.active}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Avg Production Time</div>
              <div class="report-card-value">${reportData.vendors.avgProductionTime}h</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Late Deliveries</div>
              <div class="report-card-value">${reportData.vendors.lateDeliveries}</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
        </div>
      `;
            renderVendorsChart();
            break;

        case 'riders':
            container.innerHTML = `
        <div class="report-section">
          <h2 class="report-title">Rider Performance Report</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-card-label">Total Riders</div>
              <div class="report-card-value">${reportData.riders.total}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Active Riders</div>
              <div class="report-card-value">${reportData.riders.active}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Avg Delivery Time</div>
              <div class="report-card-value">${reportData.riders.avgDeliveryTime}h</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Completion Rate</div>
              <div class="report-card-value">${reportData.riders.completionRate}%</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
        </div>
      `;
            renderRidersChart();
            break;

        case 'revenue':
            container.innerHTML = `
        <div class="report-section">
          <h2 class="report-title">Revenue Report</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-card-label">Total Revenue</div>
              <div class="report-card-value">$${reportData.revenue.total}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Commission Earned</div>
              <div class="report-card-value">$${reportData.revenue.commission}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Penalties Collected</div>
              <div class="report-card-value">$${reportData.revenue.penalties}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Net Revenue</div>
              <div class="report-card-value">$${reportData.revenue.netRevenue}</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
        </div>
      `;
            renderRevenueChart();
            break;

        case 'customers':
            container.innerHTML = `
        <div class="report-section">
          <h2 class="report-title">Customer Analytics</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-card-label">Total Customers</div>
              <div class="report-card-value">${reportData.customers.total}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Active This Month</div>
              <div class="report-card-value">${reportData.customers.activeThisMonth}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Avg Order Value</div>
              <div class="report-card-value">$${reportData.customers.avgOrderValue}</div>
            </div>
            <div class="report-card">
              <div class="report-card-label">Repeat Customers</div>
              <div class="report-card-value">${reportData.customers.repeatCustomers}</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
        </div>
      `;
            renderCustomersChart();
            break;
    }

    if (window.lucide) lucide.createIcons();
}

function renderOrdersChart() {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Orders',
                data: [65, 78, 85, 92],
                borderColor: '#1273EB',
                backgroundColor: 'rgba(18,115,235,0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' }, beginAtZero: true }
            }
        }
    });
}

function renderVendorsChart() {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['DTF Prints', 'Screen Masters', 'Sublime Studios', 'Embroidery Hub'],
            datasets: [{
                label: 'Orders Completed',
                data: [45, 38, 32, 28],
                backgroundColor: '#1273EB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' }, beginAtZero: true }
            }
        }
    });
}

function renderRidersChart() {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'],
            datasets: [{
                label: 'Deliveries Completed',
                data: [52, 48, 35, 41],
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' }, beginAtZero: true }
            }
        }
    });
}

function renderRevenueChart() {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [12000, 15000, 18000, 22000, 28000, 32000],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' }, beginAtZero: true }
            }
        }
    });
}

function renderCustomersChart() {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['New Customers', 'Repeat Customers'],
            datasets: [{
                data: [89, 67],
                backgroundColor: ['#1273EB', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

function updateReport() {
    renderReport();
    showToast('Report updated');
}

function exportPDF() {
    showToast('Exporting to PDF...');
}

function exportCSV() {
    showToast('Exporting to CSV...');
}

function exportXLSX() {
    showToast('Exporting to XLSX...');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    renderReport();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
