// support.js - Support landing page with category navigation
const ImpromptuIndianApi = window.ImpromptuIndianApi;

// Reveal on scroll animation
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

// Fetch support stats from backend
async function fetchSupportStats() {
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/support/overview');
        
        if (!response.ok) {
            throw new Error('Failed to fetch support stats');
        }

        const data = await response.json();

        // Update the counts with fallback to 0
        document.getElementById('open-tickets-count').textContent = data.total_open || 0;
        document.getElementById('active-agents-count').textContent = data.agent_workload?.length || 0;
        document.getElementById('sla-breach-count').textContent = data.sla_breach_count || 0;
        document.getElementById('avg-resolution-time').textContent = `${data.avg_resolution_hours || 0}h`;

    } catch (error) {
        console.error('Error fetching support stats:', error);
        // Set to 0 if error
        document.getElementById('open-tickets-count').textContent = '0';
        document.getElementById('active-agents-count').textContent = '0';
        document.getElementById('sla-breach-count').textContent = '0';
        document.getElementById('avg-resolution-time').textContent = '0h';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    onScroll();
    window.addEventListener('scroll', onScroll);

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Fetch support stats
    fetchSupportStats();
});
