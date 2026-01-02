lucide.createIcons();

const machines = [
    { id: 1, name: 'DTF Printer 1', type: 'dtf', capacity: 150, current: 120, status: 'active' },
    { id: 2, name: 'DTF Printer 2', type: 'dtf', capacity: 150, current: 85, status: 'active' },
    { id: 3, name: 'Screen Printer', type: 'screen', capacity: 100, current: 0, status: 'idle' },
    { id: 4, name: 'Embroidery Machine', type: 'embroidery', capacity: 50, current: 15, status: 'maintenance' }
];

const assignments = [
    { machine: 'DTF Printer 1', orderId: 'ORD-001', product: 'T-Shirt', quantity: 120, progress: 75, status: 'printing' },
    { machine: 'DTF Printer 2', orderId: 'ORD-005', product: 'Hoodie', quantity: 85, progress: 45, status: 'printing' },
    { machine: 'Embroidery Machine', orderId: 'ORD-003', product: 'Cap', quantity: 15, progress: 90, status: 'finishing' }
];

function renderMachines() {
    const grid = document.getElementById('machines-grid');
    grid.innerHTML = machines.map(m => {
        const utilization = Math.round((m.current / m.capacity) * 100);
        const statusClass = m.status === 'active' ? 'status-active' : m.status === 'idle' ? 'status-idle' : 'status-maintenance';
        const statusLabel = m.status.charAt(0).toUpperCase() + m.status.slice(1);

        return `
            <div class="machine-card ${statusClass}">
                <div class="machine-header">
                    <div class="machine-icon"><i data-lucide="cpu" class="w-6 h-6"></i></div>
                    <span class="machine-status ${statusClass}">${statusLabel}</span>
                </div>
                <h3 class="machine-name">${m.name}</h3>
                <p class="machine-type">${m.type.toUpperCase()}</p>
                <div class="machine-stats">
                    <div class="stat-item">
                        <span class="stat-label">Capacity</span>
                        <span class="stat-value">${m.capacity}/day</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Current Load</span>
                        <span class="stat-value">${m.current} units</span>
                    </div>
                </div>
                <div class="utilization-bar">
                    <div class="utilization-fill" style="width: ${utilization}%"></div>
                </div>
                <p class="utilization-text">${utilization}% Utilized</p>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function renderAssignments() {
    const tbody = document.getElementById('assignments-table');
    tbody.innerHTML = assignments.map(a => {
        const statusClass = a.status === 'printing' ? 'status-printing' : 'status-finishing';
        return `
            <tr>
                <td class="font-medium">${a.machine}</td>
                <td>${a.orderId}</td>
                <td>${a.product}</td>
                <td>${a.quantity}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${a.progress}%"></div>
                    </div>
                    <span class="progress-text">${a.progress}%</span>
                </td>
                <td><span class="status-badge ${statusClass}">${a.status}</span></td>
            </tr>
        `;
    }).join('');
}

function openAddMachineModal() {
    document.getElementById('add-machine-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeAddMachineModal() {
    document.getElementById('add-machine-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('machine-name').value = '';
    document.getElementById('machine-capacity').value = '';
}

function addMachine() {
    const name = document.getElementById('machine-name').value;
    const type = document.getElementById('machine-type').value;
    const capacity = parseInt(document.getElementById('machine-capacity').value);

    if (!name || !capacity) {
        showToast('Please fill all fields', 'error');
        return;
    }

    machines.push({ id: machines.length + 1, name, type, capacity, current: 0, status: 'idle' });
    closeAddMachineModal();
    renderMachines();
    showToast('Machine added successfully!');
}

function showToast(message) {
    const toast = document.getElementById('success-toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderMachines();
    renderAssignments();
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('show')), 100);
});
