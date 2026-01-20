// support-agents.js - Support Agent Management JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mock agents data
let agentsData = {
    total: 8,
    active: 6,
    avgResponseTime: '15m',
    agents: [
        {
            id: 1,
            name: 'Agent Smith',
            email: 'smith@impromptuindian.com',
            status: 'Active',
            assignedTickets: 12,
            workload: 'Medium',
            avgResponseTime: '12m',
            performanceScore: 95
        },
        {
            id: 2,
            name: 'Agent Doe',
            email: 'doe@impromptuindian.com',
            status: 'Active',
            assignedTickets: 8,
            workload: 'Low',
            avgResponseTime: '18m',
            performanceScore: 88
        }
    ]
};

// Fetch agents from API (placeholder)
async function fetchAgents() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/agents');
        // if (response.ok) {
        //     agentsData = await response.json();
        //     updateAgentsDisplay(agentsData);
        // }
        
        updateAgentsDisplay(agentsData);
    } catch (error) {
        console.error('Error fetching agents:', error);
        updateAgentsDisplay(agentsData);
    }
}

// Update agents display
function updateAgentsDisplay(data) {
    document.getElementById('total-agents').textContent = data.total || 0;
    document.getElementById('active-agents-count').textContent = data.active || 0;
    document.getElementById('avg-response-time').textContent = data.avgResponseTime || '0m';
    
    renderAgentsTable(data.agents || []);
}

// Render agents table
function renderAgentsTable(agents) {
    const tbody = document.getElementById('agents-table-body');
    if (!tbody) return;

    if (agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">No agents found.</td></tr>';
        return;
    }

    tbody.innerHTML = agents.map(agent => {
        const statusClass = agent.status === 'Active' ? 'status-resolved' : 'status-closed';
        const workloadClass = agent.workload === 'High' ? 'status-overdue' : 
                             agent.workload === 'Medium' ? 'status-pending' : 'status-resolved';
        const performanceClass = agent.performanceScore >= 90 ? 'status-resolved' : 
                                agent.performanceScore >= 75 ? 'status-pending' : 'status-overdue';

        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="font-medium text-white">${agent.name}</td>
                <td class="text-gray-300">${agent.email}</td>
                <td><span class="${statusClass}">${agent.status}</span></td>
                <td class="text-gray-300">${agent.assignedTickets}</td>
                <td><span class="${workloadClass}">${agent.workload}</span></td>
                <td class="text-gray-300">${agent.avgResponseTime}</td>
                <td><span class="${performanceClass}">${agent.performanceScore}%</span></td>
                <td>
                    <button class="btn-primary text-xs" onclick="assignTicket('${agent.id}')">Assign Ticket</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Open add agent modal
function openAddAgentModal() {
    document.getElementById('addAgentModal').classList.remove('hidden');
}

// Close add agent modal
function closeAddAgentModal() {
    document.getElementById('addAgentModal').classList.add('hidden');
    document.getElementById('addAgentForm').reset();
}

// Add agent
async function addAgent(event) {
    event.preventDefault();
    
    const name = document.getElementById('agent-name').value;
    const email = document.getElementById('agent-email').value;
    const phone = document.getElementById('agent-phone').value;

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch('/api/support/agents', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ name, email, phone })
        // });
        
        showToast('Agent added successfully!');
        closeAddAgentModal();
        fetchAgents();
    } catch (error) {
        console.error('Error adding agent:', error);
        showToast('Failed to add agent');
    }
}

// Assign ticket to agent
async function assignTicket(agentId) {
    // TODO: Implement ticket assignment
    showToast('Ticket assignment feature coming soon');
}

// Refresh agents
function refreshAgents() {
    showToast('Agents refreshed!');
    fetchAgents();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchAgents();

    document.getElementById('refreshBtn').addEventListener('click', refreshAgents);
    document.getElementById('addAgentBtn').addEventListener('click', openAddAgentModal);
    document.getElementById('addAgentForm').addEventListener('submit', addAgent);

    // Auto-refresh every 30 seconds
    setInterval(fetchAgents, 30000);
});
