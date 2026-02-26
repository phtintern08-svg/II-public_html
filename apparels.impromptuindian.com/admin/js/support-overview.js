// support-overview.js – Admin support monitoring dashboard

const ImpromptuIndianApi = window.ImpromptuIndianApi;

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    const icon = toast.querySelector('i');
    
    txt.textContent = msg;
    
    if (type === 'error') {
        icon.setAttribute('data-lucide', 'x-circle');
        icon.classList.remove('text-green-500');
        icon.classList.add('text-red-500');
    } else {
        icon.setAttribute('data-lucide', 'check-circle');
        icon.classList.remove('text-red-500');
        icon.classList.add('text-green-500');
    }
    
    if (window.lucide) lucide.createIcons();
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Load overview data
async function loadOverview() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/overview');
        const data = await res.json();

        if (res.ok) {
            // Update metrics
            document.getElementById('total-open').querySelector('.summary-number').textContent = data.total_open || 0;
            document.getElementById('escalated').querySelector('.summary-number').textContent = data.escalated_count || 0;
            document.getElementById('sla-breach').querySelector('.summary-number').textContent = data.sla_breach_count || 0;
            document.getElementById('avg-resolution').querySelector('.summary-number').textContent = `${data.avg_resolution_hours || 0}h`;
            document.getElementById('satisfaction-percent').textContent = `${data.satisfaction_percent || 0}%`;

            // Update agent workload
            const workloadDiv = document.getElementById('agent-workload');
            if (data.agent_workload && data.agent_workload.length > 0) {
                workloadDiv.innerHTML = data.agent_workload.map(agent => `
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                            <p class="font-semibold">${escapeHtml(agent.name)}</p>
                            <p class="text-sm text-gray-400">${agent.role}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-bold">${agent.active_tickets || 0}</p>
                            <p class="text-xs text-gray-400">active tickets</p>
                        </div>
                    </div>
                `).join('');
            } else {
                workloadDiv.innerHTML = '<div class="text-center text-gray-400 py-4">No active agents</div>';
            }

            // Update agent performance table
            const perfTable = document.getElementById('agent-performance-table');
            if (data.agent_performance && data.agent_performance.length > 0) {
                document.getElementById('agents-count-display').textContent = `${data.agent_performance.length} ${data.agent_performance.length === 1 ? 'agent' : 'agents'}`;
                perfTable.innerHTML = data.agent_performance.map(agent => {
                    const roleDisplay = {
                        'support': 'Support Executive',
                        'senior_support': 'Senior Support',
                        'manager': 'Support Manager'
                    }[agent.role] || agent.role;
                    return `
                        <tr class="hover:bg-white/5 transition-colors">
                            <td>${escapeHtml(agent.name)}</td>
                            <td><span class="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">${escapeHtml(roleDisplay)}</span></td>
                            <td><span class="font-semibold">${agent.active_tickets || 0}</span></td>
                            <td><span class="font-semibold text-green-400">${agent.resolved_today || 0}</span></td>
                            <td>${agent.avg_response_time || 'N/A'}</td>
                            <td>
                                <span class="${agent.is_active ? 'status-active' : 'status-suspended'}">
                                    ${agent.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                perfTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-12">
                            <div class="flex flex-col items-center gap-3">
                                <i data-lucide="users" class="w-12 h-12 text-gray-600 opacity-50"></i>
                                <p class="text-gray-400">No agent data available</p>
                            </div>
                        </td>
                    </tr>
                `;
                document.getElementById('agents-count-display').textContent = '0 agents';
            }

            // Update escalations table
            const escalTable = document.getElementById('escalations-table');
            if (data.recent_escalations && data.recent_escalations.length > 0) {
                document.getElementById('escalations-count-display').textContent = `${data.recent_escalations.length} ${data.recent_escalations.length === 1 ? 'escalation' : 'escalations'}`;
                escalTable.innerHTML = data.recent_escalations.map(ticket => `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td><span class="font-mono text-blue-400">#${ticket.id}</span></td>
                        <td><span class="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium capitalize">${escapeHtml(ticket.user_type)}</span></td>
                        <td>${escapeHtml(ticket.category)}</td>
                        <td><span class="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium">${escapeHtml(ticket.escalated_to || 'N/A')}</span></td>
                        <td><span class="font-semibold">${ticket.hours_since_created || 0}h</span></td>
                        <td>
                            <span class="${ticket.sla_status === 'breached' ? 'status-failed' : 'status-resolved'}">
                                ${ticket.sla_status === 'breached' ? 'Breached' : 'OK'}
                            </span>
                        </td>
                    </tr>
                `).join('');
            } else {
                escalTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-12">
                            <div class="flex flex-col items-center gap-3">
                                <i data-lucide="check-circle" class="w-12 h-12 text-green-500 opacity-50"></i>
                                <p class="text-gray-400">No escalations</p>
                                <p class="text-sm text-gray-500">All tickets are within SLA</p>
                            </div>
                        </td>
                    </tr>
                `;
                document.getElementById('escalations-count-display').textContent = '0 escalations';
            }

            if (window.lucide) lucide.createIcons();
        } else {
            showToast(data.error || 'Failed to load overview data', 'error');
        }
    } catch (error) {
        console.error('Error loading overview:', error);
        showToast('Failed to load overview data', 'error');
    }
}

function refreshOverview() {
    loadOverview();
    showToast('Overview refreshed');
}

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    if (window.lucide) lucide.createIcons();
});

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.refreshOverview = refreshOverview;
