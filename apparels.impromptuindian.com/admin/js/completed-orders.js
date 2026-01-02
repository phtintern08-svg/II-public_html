// completed-orders.js – admin view of delivered orders (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
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
    const filtered = completed.filter(o => o.id.toString().includes(term) || o.customer.toLowerCase().includes(term));
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
    showToast('CSV exported successfully');
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const labels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'];
    const data = [1200, 1500, 1800, 2100, 2500, 3000, 3500];
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Revenue', data, borderColor: '#1273EB', backgroundColor: 'rgba(18,115,235,0.2)', tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }
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
    renderCompleted();
    renderRevenueChart();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
