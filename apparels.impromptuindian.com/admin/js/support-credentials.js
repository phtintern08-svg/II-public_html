// support-credentials.js – Admin support credentials management

const ImpromptuIndianApi = window.ImpromptuIndianApi;

// Indian phone validation: 10 digits (excluding +91/91/0), first digit 6/7/8/9
function validateIndianPhone(phone) {
    if (!phone || !phone.trim()) return { valid: true, normalized: null }; // optional field
    const digits = phone.replace(/\D/g, '');
    let core = digits;
    if (digits.length === 12 && digits.startsWith('91')) core = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) core = digits.slice(1);
    else if (digits.length === 10) core = digits;
    else return { valid: false, normalized: null };
    return {
        valid: core.length === 10 && /^[6789]/.test(core),
        normalized: core
    };
}

// Password validation: min 8 chars, 1 upper, 1 lower, 1 number, 1 special (!@#$%^&*)
function validatePassword(pwd) {
    if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(pwd)) return 'Password must contain at least one special character (!@#$%^&*)';
    return null;
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        alert(msg); // Fallback to alert if toast doesn't exist
        return;
    }
    
    const txt = document.getElementById('toast-msg');
    const icon = toast.querySelector('i');
    
    if (txt) txt.textContent = msg;
    
    if (icon) {
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
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Toggle password visibility
function initPasswordToggles() {
    const togglePwd = document.getElementById('togglePassword');
    const pwdInput = document.getElementById('password');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const confirmInput = document.getElementById('confirmPassword');

    if (togglePwd && pwdInput) {
        togglePwd.addEventListener('click', () => {
            const isPwd = pwdInput.type === 'password';
            pwdInput.type = isPwd ? 'text' : 'password';
            const icon = togglePwd.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isPwd ? 'eye-off' : 'eye');
                if (window.lucide) lucide.createIcons();
            }
        });
    }
    if (toggleConfirm && confirmInput) {
        toggleConfirm.addEventListener('click', () => {
            const isPwd = confirmInput.type === 'password';
            confirmInput.type = isPwd ? 'text' : 'password';
            const icon = toggleConfirm.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isPwd ? 'eye-off' : 'eye');
                if (window.lucide) lucide.createIcons();
            }
        });
    }
}

// Load support users on page load
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
    });
    loadSupportUsers();
    initPasswordToggles();

    // Restrict phone input to digits and + only
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let v = e.target.value;
            if (v.startsWith('+')) {
                v = '+' + v.slice(1).replace(/[^\d]/g, '');
            } else {
                v = v.replace(/[^\d]/g, '');
            }
            e.target.value = v;
        });
    }

    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();
});

// Create support user
document.getElementById('createSupportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    if (!name || !email || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Phone validation (if provided)
    const phoneResult = validateIndianPhone(phone);
    if (!phoneResult.valid) {
        showToast('Invalid phone number. Use 10 digits starting with 6/7/8/9. Prefixes +91, 91, or 0 allowed.', 'error');
        return;
    }

    // Password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
        showToast(pwdError, 'error');
        return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
        showToast('Password and Confirm Password do not match', 'error');
        return;
    }

    const phoneToSend = phoneResult.normalized || (phone.trim() || null);

    try {
        const res = await ImpromptuIndianApi.fetch(
            '/api/admin/support-users',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone: phoneToSend, password, role })
            }
        );

        const data = await res.json();

        if (res.ok) {
            showToast('Support credentials created successfully!');
            document.getElementById('createSupportForm').reset();
            loadSupportUsers();
        } else {
            showToast(data.error || 'Error creating support user', 'error');
        }
    } catch (error) {
        console.error('Error creating support user:', error);
        showToast('Failed to create support user', 'error');
    }
});

// Load all support users
async function loadSupportUsers() {
    const tableBody = document.getElementById('supportUsersTable');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Loading...</td></tr>';

    try {
        const res = await ImpromptuIndianApi.fetch('/api/admin/support-users');
        const data = await res.json();

        if (res.ok) {
            const users = data.users || data || [];
            
            if (users.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-12">
                            <div class="flex flex-col items-center gap-3">
                                <i data-lucide="users" class="w-12 h-12 text-gray-600 opacity-50"></i>
                                <p class="text-gray-400">No support users found</p>
                                <p class="text-sm text-gray-500">Create your first support user above</p>
                            </div>
                        </td>
                    </tr>
                `;
                // Reset stats
                document.getElementById('total-users').querySelector('.summary-number').textContent = '0';
                document.getElementById('active-users').querySelector('.summary-number').textContent = '0';
                document.getElementById('inactive-users').querySelector('.summary-number').textContent = '0';
                document.getElementById('managers-count').querySelector('.summary-number').textContent = '0';
                document.getElementById('users-count-display').textContent = '0 users';
                if (window.lucide) lucide.createIcons();
                return;
            }

            // Calculate stats
            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.is_active).length;
            const inactiveUsers = users.filter(u => !u.is_active).length;
            const managersCount = users.filter(u => u.role === 'manager').length;

            // Update summary cards
            document.getElementById('total-users').querySelector('.summary-number').textContent = totalUsers;
            document.getElementById('active-users').querySelector('.summary-number').textContent = activeUsers;
            document.getElementById('inactive-users').querySelector('.summary-number').textContent = inactiveUsers;
            document.getElementById('managers-count').querySelector('.summary-number').textContent = managersCount;
            document.getElementById('users-count-display').textContent = `${totalUsers} ${totalUsers === 1 ? 'user' : 'users'}`;

            tableBody.innerHTML = users.map(user => {
                const roleDisplay = {
                    'support': 'Support Executive',
                    'senior_support': 'Senior Support',
                    'manager': 'Support Manager'
                }[user.role] || user.role;

                const statusBadge = user.is_active 
                    ? '<span class="status-active">Active</span>'
                    : '<span class="status-suspended">Inactive</span>';

                return `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td><span class="font-semibold">${escapeHtml(user.name)}</span></td>
                        <td><span class="text-gray-400">${escapeHtml(user.email)}</span></td>
                        <td><span class="text-gray-400">${escapeHtml(user.phone || 'N/A')}</span></td>
                        <td><span class="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">${escapeHtml(roleDisplay)}</span></td>
                        <td>${statusBadge}</td>
                        <td class="text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick="resetPassword(${user.id})" 
                                    class="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" title="Reset Password">
                                    <i data-lucide="key-round" class="w-4 h-4"></i>
                                </button>
                                <button onclick="toggleUserStatus(${user.id}, ${user.is_active})" 
                                    class="w-9 h-9 flex items-center justify-center rounded-lg ${user.is_active ? 'bg-yellow-600/10 hover:bg-yellow-600 text-yellow-400' : 'bg-green-600/10 hover:bg-green-600 text-green-400'} hover:text-white transition-all"
                                    title="${user.is_active ? 'Deactivate' : 'Activate'} User">
                                    <i data-lucide="${user.is_active ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
                                </button>
                                <button onclick="deleteUser(${user.id})" 
                                    class="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600/10 hover:bg-red-600 transition-all text-red-400 hover:text-white" title="Delete User">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-12">
                        <div class="flex flex-col items-center gap-3">
                            <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 opacity-50"></i>
                            <p class="text-red-400">Error loading users</p>
                            <p class="text-sm text-gray-500">Please try refreshing the page</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading support users:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12">
                    <div class="flex flex-col items-center gap-3">
                        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 opacity-50"></i>
                        <p class="text-red-400">Failed to load users</p>
                        <p class="text-sm text-gray-500">Please try refreshing the page</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Reset password
async function resetPassword(userId) {
    const newPassword = prompt('Enter new temporary password:');
    if (!newPassword) return;

    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
        showToast(pwdErr, 'error');
        return;
    }

    try {
        const res = await ImpromptuIndianApi.fetch(
            `/api/admin/support-users/${userId}/reset-password`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            }
        );

        const data = await res.json();

        if (res.ok) {
            showToast('Password reset successfully!');
        } else {
            showToast(data.error || 'Error resetting password', 'error');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showToast('Failed to reset password', 'error');
    }
}

// Toggle user status (activate/deactivate)
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMsg = `Are you sure you want to ${action} this user?`;
    
    if (!confirm(confirmMsg)) return;

    try {
        const res = await ImpromptuIndianApi.fetch(
            `/api/admin/support-users/${userId}/toggle-status`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            }
        );

        const data = await res.json();

        if (res.ok) {
            showToast(`User ${action}d successfully!`);
            loadSupportUsers();
        } else {
            showToast(data.error || `Error ${action}ing user`, 'error');
        }
    } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showToast(`Failed to ${action} user`, 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this support user? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await ImpromptuIndianApi.fetch(
            `/api/admin/support-users/${userId}`,
            {
                method: 'DELETE'
            }
        );

        const data = await res.json();

        if (res.ok) {
            showToast('User deleted successfully!');
            loadSupportUsers();
        } else {
            showToast(data.error || 'Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.resetPassword = resetPassword;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.loadSupportUsers = loadSupportUsers;
