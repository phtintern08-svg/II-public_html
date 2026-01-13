// orders.js - Orders landing page with category navigation
// Ensure backend connectivity
window.IMPROMPTU_INDIAN_API_BASE = 'https://apparels.impromptuindian.com';
// ImpromptuIndianApi is provided by sidebar.js

// Reveal on scroll animation
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

// Fetch order counts from backend
async function fetchOrderCounts() {
    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch('/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch orders stats');

        const stats = await response.json();

        // Update the counts with fallback to 0
        document.getElementById('new-orders-count').textContent = stats.pending_orders || 0;
        document.getElementById('production-count').textContent = stats.in_production || 0;
        document.getElementById('ready-count').textContent = stats.ready_dispatch || 0;
        document.getElementById('completed-count').textContent = stats.completed_orders || 0;

    } catch (error) {
        console.error('Error fetching order counts:', error);
        // Set to 0 if error
        document.getElementById('new-orders-count').textContent = '0';
        document.getElementById('production-count').textContent = '0';
        document.getElementById('ready-count').textContent = '0';
        document.getElementById('completed-count').textContent = '0';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    onScroll();
    window.addEventListener('scroll', onScroll);

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Fetch order counts
    fetchOrderCounts();
});
