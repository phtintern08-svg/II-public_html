/* orders-stats.js */
async function fetchOrderStats() {
    // ✅ FIX: Remove dependency on localStorage.user_id - rely only on JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found - cannot fetch order stats');
        return;
    }

    try {
        // ✅ FIX: Backend route doesn't accept vendorId in URL - uses request.user_id from JWT
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/order-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn('Authentication failed - redirecting to login');
                window.location.href = 'https://apparels.impromptuindian.com/login.html';
                return;
            }
            throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        const data = await response.json();

        // Update the mini stat cards
        if (data.newOrders !== undefined) {
            animateValue('new-orders-count', data.newOrders);
        }
        if (data.inProduction !== undefined) {
            animateValue('production-count', data.inProduction);
        }
        if (data.readyForDispatch !== undefined) {
            animateValue('ready-count', data.readyForDispatch);
        }
        if (data.completed !== undefined) {
            animateValue('completed-count', data.completed);
        }

    } catch (e) {
        console.error('Error fetching order stats:', e);
    }
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let start = parseInt(obj.innerHTML) || 0;
    if (start === end) return;

    let duration = 1000;
    let range = end - start;
    let minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);

    let startTime = new Date().getTime();
    let endTime = startTime + duration;
    let timer;

    function run() {
        let now = new Date().getTime();
        let remaining = Math.max((endTime - now) / duration, 0);
        let value = Math.round(end - (remaining * range));
        obj.innerHTML = value;
        if (value == end) {
            clearInterval(timer);
        }
    }

    timer = setInterval(run, stepTime);
    run();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchOrderStats();

    // Refresh stats every minute
    setInterval(fetchOrderStats, 60000);
});
