/* orders-stats.js */
async function fetchOrderStats() {
    const vendorId = localStorage.getItem('user_id');
    if (!vendorId) return;

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/${vendorId}/order-stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
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
