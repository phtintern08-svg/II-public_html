// riders.js - Rider management specific logic
// Ensure backend connectivity
// Use relative paths - no absolute URLs
window.IMPROMPTU_INDIAN_API_BASE = '';
// ImpromptuIndianApi is provided by sidebar.jsction

async function fetchRiderStats() {
    try {
        // 1. Pending Requests
        const reqResp = await ImpromptuIndianApi.fetch('/api/admin/rider-requests');
        if (reqResp.ok) {
            const requests = await reqResp.json();
            const pending = requests.filter(r => r.status === 'pending' || r.status === 'verification_submitted').length;

            document.getElementById('pending-requests-count').innerText = pending;

            const badge = document.getElementById('requests-count');
            if (badge) {
                badge.innerText = pending;
                if (pending > 0) badge.classList.add('show');
            }

            // Rejected Count
            const rejected = requests.filter(r => r.status === 'rejected').length;
            const rejectedBadge = document.getElementById('rejected-riders-count');
            if (rejectedBadge) {
                rejectedBadge.innerText = rejected;
                if (rejected > 0) rejectedBadge.classList.add('show');
            }

            // Update Stat Card
            const rejectedStat = document.getElementById('rejected-riders-stat');
            if (rejectedStat) rejectedStat.innerText = rejected;
        }

        // 2. Verified Riders
        const verResp = await ImpromptuIndianApi.fetch('/api/admin/verified-riders');
        if (verResp.ok) {
            const verified = await verResp.json();
            document.getElementById('verified-riders-count').innerText = verified.length;
        }

        // 3. Total Riders (Active + Pending + Rejected or just All)
        // For total count we might want to sum distinct IDs from various lists or use a dedicated endpoint
        // Using /riders (from app.py route @app.route('/riders')) which returns all
        const allResp = await ImpromptuIndianApi.fetch('/api/admin/riders'); // Using the admin endpoint
        if (allResp.ok) {
            const all = await allResp.json();
            document.getElementById('total-riders-count').innerText = all.length;
        }

    } catch (e) {
        console.error('Error fetching rider dashboard stats', e);
    }
}


function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 50) el.classList.add('active');
    });
}

window.addEventListener('scroll', onScroll);

document.addEventListener('DOMContentLoaded', () => {
    fetchRiderStats();
    setTimeout(onScroll, 100);
});
