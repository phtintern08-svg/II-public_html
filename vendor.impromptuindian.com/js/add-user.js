(function () {
  // Use a safe way to declare ImpromptuIndianApi to avoid "already declared" errors
  if (typeof window.ImpromptuIndianApi === 'undefined') {
    window.ImpromptuIndianApi = (() => {
      const rawBase =
        window.IMPROMPTU_INDIAN_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
        '';

      let base = rawBase.trim().replace(/\/$/, '');
      if (!base) {
        // Use relative paths - no absolute URLs
        base = '';
      }

      const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

      return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => {
          // Use cookie-based authentication (HttpOnly access_token cookie set by backend)
          return fetch(buildUrl(path), {
            credentials: 'include',
            ...options
          });
        },
      };
    })();
  }

  const ImpromptuIndianApi = window.ImpromptuIndianApi;

  // State
  let usersList = [];
  let deleteUserId = null;

  // DOM Elements
  const addUserForm = document.getElementById('add-user-form');
  const userNameInput = document.getElementById('userName');
  const userEmailInput = document.getElementById('userEmail');
  const userPasswordInput = document.getElementById('userPassword');
  const addUserBtn = document.getElementById('add-user-btn');
  const usersListContainer = document.getElementById('users-list-container');
  const usersLoading = document.getElementById('users-loading');
  const usersEmpty = document.getElementById('users-empty');
  const usersTableContainer = document.getElementById('users-table-container');
  const usersTableBody = document.getElementById('users-table-body');
  const userCountText = document.getElementById('user-count-text');
  const alertContainer = document.getElementById('alert-container');
  const deleteModal = document.getElementById('delete-modal');
  const deleteUserName = document.getElementById('delete-user-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
      lucide.createIcons();
    }
    loadUsers();
    setupEventListeners();
  });

  // Setup Event Listeners
  function setupEventListeners() {
    if (addUserForm) {
      addUserForm.addEventListener('submit', handleAddUser);
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', handleDeleteUser);
    }

    // Close modal on overlay click
    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && deleteModal && deleteModal.style.display !== 'none') {
        closeDeleteModal();
      }
    });
  }

  // Load Users List
  async function loadUsers() {
    try {
      showLoadingState();

      const response = await ImpromptuIndianApi.fetch('/api/vendor/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          showAlert('Authentication required', 'Please log in again', 'error');
          setTimeout(() => {
            window.location.href = 'https://apparels.impromptuindian.com/login.html';
          }, 2000);
          return;
        }
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      usersList = data.users || [];

      updateUserCount();
      renderUsersTable();

    } catch (error) {
      console.error('Error loading users:', error);
      showAlert('Error', 'Failed to load team members. Please try again.', 'error');
      showEmptyState();
    }
  }

  // Show Loading State
  function showLoadingState() {
    if (usersLoading) usersLoading.style.display = 'flex';
    if (usersEmpty) usersEmpty.style.display = 'none';
    if (usersTableContainer) usersTableContainer.style.display = 'none';
  }

  // Show Empty State
  function showEmptyState() {
    if (usersLoading) usersLoading.style.display = 'none';
    if (usersEmpty) usersEmpty.style.display = 'flex';
    if (usersTableContainer) usersTableContainer.style.display = 'none';
  }

  // Render Users Table
  function renderUsersTable() {
    if (usersList.length === 0) {
      showEmptyState();
      return;
    }

    if (usersLoading) usersLoading.style.display = 'none';
    if (usersEmpty) usersEmpty.style.display = 'none';
    if (usersTableContainer) usersTableContainer.style.display = 'block';

    if (!usersTableBody) return;

    usersTableBody.innerHTML = '';

    usersList.forEach(user => {
      const row = document.createElement('tr');
      
      const createdDate = user.created_at 
        ? new Date(user.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        : 'N/A';

      // Render permissions badges
      const permissions = user.permissions || ['dashboard', 'orders']; // Default for backward compatibility
      const permissionIcons = {
        dashboard: 'layout-dashboard',
        orders: 'shopping-bag',
        payments: 'dollar-sign',
        capacity: 'factory',
        notifications: 'bell',
        profile: 'user-cog'
      };
      
      const permissionLabels = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        payments: 'Payments',
        capacity: 'Capacity',
        notifications: 'Notifications',
        profile: 'Profile'
      };

      const permissionsHTML = permissions.map(perm => `
        <span class="permission-badge">
          <i data-lucide="${permissionIcons[perm] || 'circle'}" class="w-3 h-3"></i>
          ${permissionLabels[perm] || perm}
        </span>
      `).join('');

      row.innerHTML = `
        <td>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span class="text-blue-400 font-semibold">${user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span class="font-medium">${escapeHtml(user.name)}</span>
          </div>
        </td>
        <td>
          <span class="text-gray-400">${escapeHtml(user.email)}</span>
        </td>
        <td>
          <div class="permission-badges">
            ${permissionsHTML}
          </div>
        </td>
        <td>
          <span class="text-gray-400">${createdDate}</span>
        </td>
        <td class="text-right">
          <button 
            class="btn-delete" 
            onclick="openDeleteModal(${user.id}, '${escapeHtml(user.name)}')"
            title="Delete user"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            Delete
          </button>
        </td>
      `;

      usersTableBody.appendChild(row);
    });

    // Reinitialize icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Update permission checkboxes visual state
    updatePermissionCheckboxes();
  }
  
  // Update permission checkboxes visual state
  function updatePermissionCheckboxes() {
    const checkboxes = document.querySelectorAll('.permission-input');
    checkboxes.forEach(checkbox => {
      // Visual state is handled by CSS :checked selector
      // This function can be used for additional logic if needed
    });
  }

  // Update User Count
  function updateUserCount() {
    if (userCountText) {
      userCountText.textContent = `${usersList.length} / 2 Users`;
    }
  }

  // Handle Add User
  async function handleAddUser(e) {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim().toLowerCase();
    const password = userPasswordInput.value.trim();

    // Get selected permissions
    const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]:checked');
    const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);

    // Validation
    if (!name || !email || !password) {
      showAlert('Validation Error', 'Please fill in all required fields', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Validation Error', 'Please enter a valid email address', 'error');
      return;
    }

    if (permissions.length === 0) {
      showAlert('Validation Error', 'Please select at least one permission', 'error');
      return;
    }

    // Check user limit
    if (usersList.length >= 2) {
      showAlert('Limit Reached', 'Maximum 2 users allowed per vendor account', 'error');
      return;
    }

    // Disable button
    addUserBtn.disabled = true;
    addUserBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Adding...';

    try {
      const response = await ImpromptuIndianApi.fetch('/api/vendor/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          permissions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      // Success
      showAlert('Success', `User "${name}" has been added successfully`, 'success');
      
      // Reset form (including checkboxes - keep dashboard and orders checked)
      addUserForm.reset();
      document.querySelector('input[value="dashboard"]').checked = true;
      document.querySelector('input[value="orders"]').checked = true;
      
      // Reload users list
      await loadUsers();

    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage = error.message || 'Failed to add user. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      // Re-enable button
      addUserBtn.disabled = false;
      addUserBtn.innerHTML = '<i data-lucide="user-plus" class="w-5 h-5"></i> Add User';
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  // Open Delete Modal
  window.openDeleteModal = function(userId, userName) {
    deleteUserId = userId;
    if (deleteUserName) {
      deleteUserName.textContent = userName;
    }
    if (deleteModal) {
      deleteModal.style.display = 'flex';
    }
  };

  // Close Delete Modal
  window.closeDeleteModal = function() {
    deleteUserId = null;
    if (deleteModal) {
      deleteModal.style.display = 'none';
    }
  };

  // Handle Delete User
  async function handleDeleteUser() {
    if (!deleteUserId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Deleting...';

    try {
      const response = await ImpromptuIndianApi.fetch(`/api/vendor/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Success
      showAlert('Success', 'User has been deleted successfully', 'success');
      closeDeleteModal();
      
      // Reload users list
      await loadUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Error', error.message || 'Failed to delete user. Please try again.', 'error');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i> Delete User';
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  // Toggle Password Visibility
  window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  };

  // Show Alert
  function showAlert(title, message, type = 'info') {
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const iconMap = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info'
    };

    alert.innerHTML = `
      <i data-lucide="${iconMap[type] || 'info'}" class="w-5 h-5"></i>
      <div>
        <p class="font-semibold">${escapeHtml(title)}</p>
        <p class="text-sm opacity-90">${escapeHtml(message)}</p>
      </div>
    `;

    alertContainer.appendChild(alert);

    // Initialize icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 300);
    }, 5000);
  }

  // Utility Functions
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Check authentication on page load
  async function checkAuth() {
    try {
      const response = await ImpromptuIndianApi.fetch('/api/vendor/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = 'https://apparels.impromptuindian.com/login.html';
          return;
        }
      }

      const data = await response.json();
      const role = localStorage.getItem('role') || 'vendor';

      // Only vendors can access this page
      if (role !== 'vendor') {
        showAlert('Access Denied', 'Only vendors can manage team members', 'error');
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 2000);
        return;
      }

    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = 'https://apparels.impromptuindian.com/login.html';
    }
  }

  // Run auth check
  checkAuth();

})();
