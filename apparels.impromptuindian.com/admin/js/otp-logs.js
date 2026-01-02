document.addEventListener('DOMContentLoaded', () => {
    fetchOTPLogs();

    // Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

async function fetchOTPLogs() {
    const tbody = document.getElementById('otp-logs-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading...</td></tr>';
    }

    try {
        // Use ThreadlyApi if available, otherwise fetch directly
        const fetchFn = window.ThreadlyApi ? window.ThreadlyApi.fetch : fetch;
        const response = await fetchFn('/admin/otp-logs');

        if (response.ok) {
            const logs = await response.json();
            renderLogs(logs);
        } else {
            console.error('Failed to fetch OTP logs');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Failed to load logs</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching OTP logs:', error);
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Error loading logs</td></tr>';
    }
}

function renderLogs(logs) {
    const tbody = document.getElementById('otp-logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No logs found</td></tr>';
        return;
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');

        // Format dates
        const createdDate = log.created_at ? new Date(log.created_at + 'Z').toLocaleString() : 'N/A'; // Assume UTC if no timezone
        // Or if backend sends 'Z' it's fine. Usually SQLAlchemy returns naive datetime if not configured, but jsonify might use ISO.
        // Let's assume standard ISO or just string.

        const expiresDate = log.expires_at ? new Date(log.expires_at).toLocaleString() : 'N/A';

        // Status badge style
        let statusClass = 'badge badge-role'; // default
        if (log.status === 'sent') statusClass += ' bg-blue-500/10 text-blue-500 border-blue-500/20';
        else if (log.status === 'verified') statusClass += ' badge-active';
        else if (log.status === 'failed') statusClass += ' badge-blocked';

        tr.innerHTML = `
            <td>${log.recipient || 'N/A'}</td>
            <td class="font-mono font-bold tracking-wider">${log.otp_code || '---'}</td>
            <td><span class="capitalize">${log.type || 'N/A'}</span></td>
            <td><span class="${statusClass}">${log.status}</span></td>
            <td class="text-gray-400 text-sm">${createdDate}</td>
            <td class="text-gray-400 text-sm">${expiresDate}</td>
        `;
        tbody.appendChild(tr);
    });
}
