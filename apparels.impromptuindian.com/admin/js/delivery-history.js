// delivery-history.js – admin delivery tracking & analytics (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock delivery history data
let deliveries = [
    { id: 1001, rider: 'John Doe', customer: 'Alice', deliveryTime: 2.5, status: 'delivered', rating: 4.5, feedback: 'Great service!' },
    { id: 1002, rider: 'Jane Smith', customer: 'Bob', deliveryTime: 3.0, status: 'delivered', rating: 5.0, feedback: 'Perfect delivery' },
    { id: 1003, rider: 'Mike Johnson', customer: 'Charlie', deliveryTime: 0, status: 'failed', rating: 0, feedback: 'Customer not available' },
    { id: 1004, rider: 'Sarah Williams', customer: 'David', deliveryTime: 1.8, status: 'delivered', rating: 4.8, feedback: 'Very fast' },
    { id: 1005, rider: 'John Doe', customer: 'Eve', deliveryTime: 0, status: 'returned', rating: 0, feedback: 'Wrong address' }
];

function calculateSummary() {
    const completed = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed' || d.status === 'returned').length;
    const avgTime = deliveries.filter(d => d.deliveryTime > 0).reduce((sum, d) => sum + d.deliveryTime, 0) / completed || 0;
    const avgRating = deliveries.filter(d => d.rating > 0).reduce((sum, d) => sum + d.rating, 0) / completed || 0;

    document.getElementById('completed-count').textContent = completed;
    document.getElementById('failed-count').textContent = failed;
    document.getElementById('avg-time').textContent = avgTime.toFixed(1) + 'h';
    document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
}

function renderHistory() {
    const tbody = document.getElementById('history-table');
    tbody.innerHTML = '';
    deliveries.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.rider}</td>
      <td>${d.customer}</td>
      <td>${d.deliveryTime > 0 ? d.deliveryTime + 'h' : 'N/A'}</td>
      <td><span class="status-${d.status}">${d.status}</span></td>
      <td>${d.rating > 0 ? '⭐ ' + d.rating : 'N/A'}</td>
      <td>${d.feedback}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewDetails(${d.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function filterHistory() {
    const status = document.getElementById('status-filter').value;
    const term = document.getElementById('search-history').value.toLowerCase();
    const filtered = deliveries.filter(d => {
        const matchStatus = status === 'all' || d.status === status;
        const matchTerm = d.id.toString().includes(term) || d.customer.toLowerCase().includes(term) || d.rider.toLowerCase().includes(term);
        return matchStatus && matchTerm;
    });
    const tbody = document.getElementById('history-table');
    tbody.innerHTML = '';
    filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.rider}</td>
      <td>${d.customer}</td>
      <td>${d.deliveryTime > 0 ? d.deliveryTime + 'h' : 'N/A'}</td>
      <td><span class="status-${d.status}">${d.status}</span></td>
      <td>${d.rating > 0 ? '⭐ ' + d.rating : 'N/A'}</td>
      <td>${d.feedback}</td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewDetails(${d.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function viewDetails(id) {
    const delivery = deliveries.find(d => d.id === id);
    alert(`Delivery Details:\nOrder ID: ${delivery.id}\nRider: ${delivery.rider}\nCustomer: ${delivery.customer}\nStatus: ${delivery.status}\nRating: ${delivery.rating}\nFeedback: ${delivery.feedback}`);
}

function exportHistory() {
    let csv = 'Order ID,Rider,Customer,Delivery Time,Status,Rating,Feedback\n';
    deliveries.forEach(d => {
        csv += `${d.id},${d.rider},${d.customer},${d.deliveryTime},${d.status},${d.rating},${d.feedback}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'delivery_history.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully');
}

function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const labels = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
    const data = [12, 18, 8, 15];
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Deliveries Completed',
                data,
                backgroundColor: '#1273EB',
                borderColor: '#0f5bbf',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' }, beginAtZero: true }
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
    calculateSummary();
    renderHistory();
    renderPerformanceChart();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
