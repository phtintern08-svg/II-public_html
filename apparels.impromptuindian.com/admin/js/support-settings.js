// support-settings.js – Admin support configuration management

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

// Load all settings
async function loadSettings() {
    await Promise.all([
        loadCategories(),
        loadPriorityRules(),
        loadEscalationRules(),
        loadAutoAssignment()
    ]);
}

// Load categories
async function loadCategories() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/categories');
        const data = await res.json();

        const table = document.getElementById('categories-table');
        if (res.ok && data.categories) {
            if (data.categories.length === 0) {
                table.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">No categories found</td></tr>';
                return;
            }

            table.innerHTML = data.categories.map(cat => `
                <tr class="hover:bg-white/5 transition-colors">
                    <td><span class="font-semibold">${escapeHtml(cat.name)}</span></td>
                    <td><span class="text-gray-400">${escapeHtml(cat.description || 'N/A')}</span></td>
                    <td>
                        <span class="${cat.is_active ? 'status-active' : 'status-suspended'}">
                            ${cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="editCategory(${cat.id})" class="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" title="Edit">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                            <button onclick="toggleCategory(${cat.id}, ${cat.is_active})" class="w-9 h-9 flex items-center justify-center rounded-lg ${cat.is_active ? 'bg-yellow-600/10 hover:bg-yellow-600 text-yellow-400' : 'bg-green-600/10 hover:bg-green-600 text-green-400'} hover:text-white transition-all" title="${cat.is_active ? 'Disable' : 'Enable'}">
                                <i data-lucide="${cat.is_active ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            if (window.lucide) lucide.createIcons();
        } else {
            table.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Error loading categories</td></tr>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load priority rules
async function loadPriorityRules() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/priority-rules');
        const data = await res.json();

        const table = document.getElementById('priority-rules-table');
        if (res.ok && data.rules) {
            if (data.rules.length === 0) {
                table.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No priority rules found</td></tr>';
                return;
            }

            table.innerHTML = data.rules.map(rule => {
                const priorityColors = {
                    'low': 'bg-gray-500/10 text-gray-400',
                    'medium': 'bg-blue-500/10 text-blue-400',
                    'high': 'bg-orange-500/10 text-orange-400',
                    'critical': 'bg-red-500/10 text-red-400'
                };
                return `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td><span class="px-2 py-1 rounded-md ${priorityColors[rule.priority_level] || 'bg-gray-500/10 text-gray-400'} text-xs font-medium capitalize">${escapeHtml(rule.priority_level)}</span></td>
                        <td><span class="font-semibold">${rule.sla_hours}h</span></td>
                        <td><span class="text-gray-400">${escapeHtml(rule.description || 'N/A')}</span></td>
                        <td>
                            <span class="${rule.is_active ? 'status-active' : 'status-suspended'}">
                                ${rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="editPriority(${rule.id})" class="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" title="Edit">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                </button>
                                <button onclick="togglePriority(${rule.id}, ${rule.is_active})" class="w-9 h-9 flex items-center justify-center rounded-lg ${rule.is_active ? 'bg-yellow-600/10 hover:bg-yellow-600 text-yellow-400' : 'bg-green-600/10 hover:bg-green-600 text-green-400'} hover:text-white transition-all" title="${rule.is_active ? 'Disable' : 'Enable'}">
                                    <i data-lucide="${rule.is_active ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            if (window.lucide) lucide.createIcons();
        } else {
            table.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading priority rules</td></tr>';
        }
    } catch (error) {
        console.error('Error loading priority rules:', error);
    }
}

// Load escalation rules
async function loadEscalationRules() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/escalation-rules');
        const data = await res.json();

        const table = document.getElementById('escalation-rules-table');
        if (res.ok && data.rules) {
            if (data.rules.length === 0) {
                table.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No escalation rules found</td></tr>';
                return;
            }

            table.innerHTML = data.rules.map(rule => {
                const roleColors = {
                    'senior_support': 'bg-blue-500/10 text-blue-400',
                    'manager': 'bg-purple-500/10 text-purple-400',
                    'admin': 'bg-red-500/10 text-red-400'
                };
                return `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td><span class="font-semibold">${rule.hours_threshold}h</span></td>
                        <td><span class="px-2 py-1 rounded-md ${roleColors[rule.escalate_to_role] || 'bg-gray-500/10 text-gray-400'} text-xs font-medium capitalize">${escapeHtml(rule.escalate_to_role.replace('_', ' '))}</span></td>
                        <td>
                            <span class="${rule.notify_admin ? 'status-pending' : 'status-closed'}">
                                ${rule.notify_admin ? 'Yes' : 'No'}
                            </span>
                        </td>
                        <td>
                            <span class="${rule.is_active ? 'status-active' : 'status-suspended'}">
                                ${rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="editEscalation(${rule.id})" class="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" title="Edit">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                </button>
                                <button onclick="toggleEscalation(${rule.id}, ${rule.is_active})" class="w-9 h-9 flex items-center justify-center rounded-lg ${rule.is_active ? 'bg-yellow-600/10 hover:bg-yellow-600 text-yellow-400' : 'bg-green-600/10 hover:bg-green-600 text-green-400'} hover:text-white transition-all" title="${rule.is_active ? 'Disable' : 'Enable'}">
                                    <i data-lucide="${rule.is_active ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            if (window.lucide) lucide.createIcons();
        } else {
            table.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading escalation rules</td></tr>';
        }
    } catch (error) {
        console.error('Error loading escalation rules:', error);
    }
}

// Load auto assignment
async function loadAutoAssignment() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/auto-assignment');
        const data = await res.json();

        if (res.ok && data.methods) {
            data.methods.forEach(method => {
                const checkbox = document.getElementById(method.assignment_method.replace('_', '-'));
                if (checkbox) {
                    checkbox.checked = method.is_enabled;
                }
            });
        }
    } catch (error) {
        console.error('Error loading auto assignment:', error);
    }
}

// Category functions
function showAddCategoryModal() {
    document.getElementById('category-modal-title').textContent = 'Add Category';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-modal').classList.remove('hidden');
}

async function editCategory(id) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/categories/${id}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('category-modal-title').textContent = 'Edit Category';
            document.getElementById('category-id').value = data.category.id;
            document.getElementById('category-name').value = data.category.name;
            document.getElementById('category-description').value = data.category.description || '';
            document.getElementById('category-modal').classList.remove('hidden');
        }
    } catch (error) {
        showToast('Failed to load category', 'error');
    }
}

async function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();

    try {
        const url = id ? `/api/admin/support/categories/${id}` : '/api/admin/support/categories';
        const method = id ? 'PUT' : 'POST';

        const res = await ImpromptuIndianApi.fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(id ? 'Category updated' : 'Category created');
            closeCategoryModal();
            loadCategories();
        } else {
            showToast(data.error || 'Failed to save category', 'error');
        }
    } catch (error) {
        showToast('Failed to save category', 'error');
    }
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.add('hidden');
}

async function toggleCategory(id, currentStatus) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/categories/${id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });

        if (res.ok) {
            showToast('Category status updated');
            loadCategories();
        } else {
            showToast('Failed to update category', 'error');
        }
    } catch (error) {
        showToast('Failed to update category', 'error');
    }
}

// Priority functions
function showAddPriorityModal() {
    document.getElementById('priority-modal-title').textContent = 'Add Priority Rule';
    document.getElementById('priority-form').reset();
    document.getElementById('priority-id').value = '';
    document.getElementById('priority-modal').classList.remove('hidden');
}

async function editPriority(id) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/priority-rules/${id}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('priority-modal-title').textContent = 'Edit Priority Rule';
            document.getElementById('priority-id').value = data.rule.id;
            document.getElementById('priority-level').value = data.rule.priority_level;
            document.getElementById('priority-sla').value = data.rule.sla_hours;
            document.getElementById('priority-description').value = data.rule.description || '';
            document.getElementById('priority-modal').classList.remove('hidden');
        }
    } catch (error) {
        showToast('Failed to load priority rule', 'error');
    }
}

async function savePriority(e) {
    e.preventDefault();
    const id = document.getElementById('priority-id').value;
    const priority_level = document.getElementById('priority-level').value;
    const sla_hours = parseInt(document.getElementById('priority-sla').value);
    const description = document.getElementById('priority-description').value.trim();

    try {
        const url = id ? `/api/admin/support/priority-rules/${id}` : '/api/admin/support/priority-rules';
        const method = id ? 'PUT' : 'POST';

        const res = await ImpromptuIndianApi.fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority_level, sla_hours, description })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(id ? 'Priority rule updated' : 'Priority rule created');
            closePriorityModal();
            loadPriorityRules();
        } else {
            showToast(data.error || 'Failed to save priority rule', 'error');
        }
    } catch (error) {
        showToast('Failed to save priority rule', 'error');
    }
}

function closePriorityModal() {
    document.getElementById('priority-modal').classList.add('hidden');
}

async function togglePriority(id, currentStatus) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/priority-rules/${id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });

        if (res.ok) {
            showToast('Priority rule status updated');
            loadPriorityRules();
        } else {
            showToast('Failed to update priority rule', 'error');
        }
    } catch (error) {
        showToast('Failed to update priority rule', 'error');
    }
}

// Escalation functions
function showAddEscalationModal() {
    document.getElementById('escalation-modal-title').textContent = 'Add Escalation Rule';
    document.getElementById('escalation-form').reset();
    document.getElementById('escalation-id').value = '';
    document.getElementById('escalation-modal').classList.remove('hidden');
}

async function editEscalation(id) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/escalation-rules/${id}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('escalation-modal-title').textContent = 'Edit Escalation Rule';
            document.getElementById('escalation-id').value = data.rule.id;
            document.getElementById('escalation-hours').value = data.rule.hours_threshold;
            document.getElementById('escalation-role').value = data.rule.escalate_to_role;
            document.getElementById('escalation-notify').checked = data.rule.notify_admin;
            document.getElementById('escalation-modal').classList.remove('hidden');
        }
    } catch (error) {
        showToast('Failed to load escalation rule', 'error');
    }
}

async function saveEscalation(e) {
    e.preventDefault();
    const id = document.getElementById('escalation-id').value;
    const hours_threshold = parseInt(document.getElementById('escalation-hours').value);
    const escalate_to_role = document.getElementById('escalation-role').value;
    const notify_admin = document.getElementById('escalation-notify').checked;

    try {
        const url = id ? `/api/admin/support/escalation-rules/${id}` : '/api/admin/support/escalation-rules';
        const method = id ? 'PUT' : 'POST';

        const res = await ImpromptuIndianApi.fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours_threshold, escalate_to_role, notify_admin })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(id ? 'Escalation rule updated' : 'Escalation rule created');
            closeEscalationModal();
            loadEscalationRules();
        } else {
            showToast(data.error || 'Failed to save escalation rule', 'error');
        }
    } catch (error) {
        showToast('Failed to save escalation rule', 'error');
    }
}

function closeEscalationModal() {
    document.getElementById('escalation-modal').classList.add('hidden');
}

async function toggleEscalation(id, currentStatus) {
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/admin/support/escalation-rules/${id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });

        if (res.ok) {
            showToast('Escalation rule status updated');
            loadEscalationRules();
        } else {
            showToast('Failed to update escalation rule', 'error');
        }
    } catch (error) {
        showToast('Failed to update escalation rule', 'error');
    }
}

// Auto assignment
async function toggleAutoAssignment(method, enabled) {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support/auto-assignment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment_method: method, is_enabled: enabled })
        });

        if (res.ok) {
            showToast('Auto assignment updated');
            loadAutoAssignment();
        } else {
            showToast('Failed to update auto assignment', 'error');
        }
    } catch (error) {
        showToast('Failed to update auto assignment', 'error');
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
    });
    loadSettings();
    if (window.lucide) lucide.createIcons();
});

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.showAddCategoryModal = showAddCategoryModal;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.closeCategoryModal = closeCategoryModal;
window.toggleCategory = toggleCategory;
window.showAddPriorityModal = showAddPriorityModal;
window.editPriority = editPriority;
window.savePriority = savePriority;
window.closePriorityModal = closePriorityModal;
window.togglePriority = togglePriority;
window.showAddEscalationModal = showAddEscalationModal;
window.editEscalation = editEscalation;
window.saveEscalation = saveEscalation;
window.closeEscalationModal = closeEscalationModal;
window.toggleEscalation = toggleEscalation;
window.toggleAutoAssignment = toggleAutoAssignment;
