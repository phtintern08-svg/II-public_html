// completed-orders.js – admin view of delivered orders (mock)

function showToast(msg, type = 'info') {
    // Use the new alert system (matching login page)
    if (typeof showAlert === 'function') {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        showAlert(titles[type] || 'Info', msg, type);
    } else {
        // Fallback
        alert(msg);
    }
}

// Mock completed orders
let completed = [
    { id: 1001, vendor: 'DTF Prints Co.', customer: 'Alice', deliveryHours: 48, amount: 500, commission: 75, penalty: 0 },
    { id: 1002, vendor: 'Screen Masters', customer: 'Bob', deliveryHours: 36, amount: 800, commission: 120, penalty: 20 },
    { id: 1003, vendor: 'Sublime Studios', customer: 'Charlie', deliveryHours: 60, amount: 650, commission: 97.5, penalty: 0 },
    { id: 1004, vendor: 'Embroidery Hub', customer: 'David', deliveryHours: 72, amount: 900, commission: 135, penalty: 50 }
];

function renderCompleted() {
    const tbody = document.getElementById('completed-table');
    tbody.innerHTML = '';
    completed.forEach(o => {
        const payout = o.amount - o.commission - o.penalty;
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.vendor}</td>
      <td>${o.customer}</td>
      <td>${o.deliveryHours}h</td>
      <td>$${o.amount.toFixed(2)}</td>
      <td>$${o.commission.toFixed(2)}</td>
      <td>$${o.penalty.toFixed(2)}</td>
      <td>$${(o.commission + o.penalty).toFixed(2)}</td>
    `;
        tbody.appendChild(tr);
    });
}

function filterCompleted() {
    const term = document.getElementById('search-completed').value.toLowerCase();
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    let filtered = completed.filter(o => {
        const matchesSearch = o.id.toString().includes(term) || o.customer.toLowerCase().includes(term);
        
        // If date filters are set, filter by date range (mock: using order ID as date proxy for demo)
        // In real implementation, you would compare with actual order date
        if (dateFrom || dateTo) {
            // For demo purposes, we'll just show all if date is selected
            // In production, you'd compare: 
            // if (dateFrom && order.date < dateFrom) return false;
            // if (dateTo && order.date > dateTo) return false;
            return matchesSearch;
        }
        
        return matchesSearch;
    });
    
    const tbody = document.getElementById('completed-table');
    tbody.innerHTML = '';
    filtered.forEach(o => {
        const payout = o.amount - o.commission - o.penalty;
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.vendor}</td>
      <td>${o.customer}</td>
      <td>${o.deliveryHours}h</td>
      <td>$${o.amount.toFixed(2)}</td>
      <td>$${o.commission.toFixed(2)}</td>
      <td>$${o.penalty.toFixed(2)}</td>
      <td>$${(o.commission + o.penalty).toFixed(2)}</td>
    `;
        tbody.appendChild(tr);
    });
}

function exportCSV() {
    let csv = 'Order ID,Vendor,Customer,Delivery Hours,Amount,Commission,Penalty,Total Earned\n';
    completed.forEach(o => {
        const earned = o.commission + o.penalty;
        csv += `${o.id},${o.vendor},${o.customer},${o.deliveryHours},${o.amount},${o.commission},${o.penalty},${earned}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'completed_orders.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const labels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'];
    const data = [1200, 1500, 1800, 2100, 2500, 3000, 3500];
    new Chart(ctx, {
        type: 'line',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Revenue', 
                data, 
                borderColor: '#2563eb', 
                backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }] 
        },
        options: { 
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { 
                    labels: { 
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    } 
                } 
            }, 
            scales: { 
                x: { 
                    ticks: { 
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }, 
                y: { 
                    ticks: { 
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                } 
            } 
        }
    });
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // Show all reveal elements immediately (they're already in view on page load)
    requestAnimationFrame(() => {
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('show');
        });
    });
    
    // Set max date to today (blocks future dates) for both date inputs
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Function to open date picker
    function openDatePicker(input) {
        if (input && typeof input.showPicker === 'function') {
            try {
                input.showPicker();
            } catch (e) {
                // Fallback: focus and click if showPicker is not supported
                input.focus();
                input.click();
            }
        } else {
            // Fallback for older browsers
            input.focus();
            input.click();
        }
    }
    
    if (dateFrom) {
        dateFrom.setAttribute('max', todayString);
        // Make calendar icon clickable
        const dateFromIcon = dateFrom.parentElement.querySelector('.date-filter-icon');
        if (dateFromIcon) {
            dateFromIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openDatePicker(dateFrom);
            });
        }
        // Also open on input focus
        dateFrom.addEventListener('focus', function() {
            openDatePicker(this);
        });
    }
    
    if (dateTo) {
        dateTo.setAttribute('max', todayString);
        // Make calendar icon clickable
        const dateToIcon = dateTo.parentElement.querySelector('.date-filter-icon');
        if (dateToIcon) {
            dateToIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openDatePicker(dateTo);
            });
        }
        // Also open on input focus
        dateTo.addEventListener('focus', function() {
            openDatePicker(this);
        });
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    try {
        renderCompleted();
        renderRevenueChart();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
    
    // Also set up scroll listener for any elements that come into view later
    onScroll();
    window.addEventListener('scroll', onScroll);
});
