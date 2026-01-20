// reports.js - Support Reports JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock reports data
let reportsData = {
    mostCommonIssue: 'Delivery',
    avgResolutionTime: '2h 30m',
    customerSatisfaction: 92,
    reports: [
        {
            type: 'Monthly Report',
            period: 'January 2025',
            vendorComplaints: 12,
            riderIssues: 8,
            refundTrends: '$2,450'
        },
        {
            type: 'Weekly Report',
            period: 'Week 3, Jan 2025',
            vendorComplaints: 3,
            riderIssues: 2,
            refundTrends: '$650'
        }
    ]
};

// Chart instances
let issueTypesChart = null;
let resolutionTimeChart = null;

// Fetch reports from API (placeholder)
async function fetchReports() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/reports');
        // if (response.ok) {
        //     reportsData = await response.json();
        //     updateReportsDisplay(reportsData);
        // }
        
        updateReportsDisplay(reportsData);
    } catch (error) {
        console.error('Error fetching reports:', error);
        updateReportsDisplay(reportsData);
    }
}

// Update reports display
function updateReportsDisplay(data) {
    document.getElementById('most-common-issue').textContent = data.mostCommonIssue || 'N/A';
    document.getElementById('avg-resolution-time').textContent = data.avgResolutionTime || '0h';
    document.getElementById('customer-satisfaction').textContent = `${data.customerSatisfaction || 0}%`;
    
    renderCharts(data);
    renderReportsTable(data.reports || []);
}

// Render charts
function renderCharts(data) {
    // Issue Types Chart
    const issueTypesCtx = document.getElementById('issueTypesChart');
    if (issueTypesCtx && !issueTypesChart) {
        issueTypesChart = new Chart(issueTypesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Delivery', 'Payment', 'Production', 'Account', 'Refund'],
                datasets: [{
                    data: [35, 25, 20, 10, 10],
                    backgroundColor: [
                        '#a855f7',
                        '#06b6d4',
                        '#6366f1',
                        '#6b7280',
                        '#fbbf24'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#cbd5e1' }
                    }
                }
            }
        });
    }

    // Resolution Time Chart
    const resolutionTimeCtx = document.getElementById('resolutionTimeChart');
    if (resolutionTimeCtx && !resolutionTimeChart) {
        resolutionTimeChart = new Chart(resolutionTimeCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Avg Resolution Time (hours)',
                    data: [3.2, 2.8, 2.5, 2.3],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#cbd5e1' }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }
}

// Render reports table
function renderReportsTable(reports) {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No reports found.</td></tr>';
        return;
    }

    tbody.innerHTML = reports.map(report => {
        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white">${report.type}</td>
                <td class="text-gray-300">${report.period}</td>
                <td class="text-gray-300">${report.vendorComplaints}</td>
                <td class="text-gray-300">${report.riderIssues}</td>
                <td class="font-semibold text-yellow-400">${report.refundTrends}</td>
                <td>
                    <button class="btn-export text-xs" onclick="exportReport('${report.type}', '${report.period}')">Export</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Export report
async function exportReport(type, period) {
    try {
        // TODO: Implement export functionality
        showToast(`Exporting ${type} for ${period}...`);
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Failed to export report');
    }
}

// Refresh reports
function refreshReports() {
    showToast('Reports refreshed!');
    fetchReports();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchReports();

    document.getElementById('refreshBtn').addEventListener('click', refreshReports);
    document.getElementById('exportBtn').addEventListener('click', () => {
        showToast('Exporting all reports...');
    });
});
