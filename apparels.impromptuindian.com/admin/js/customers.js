// Admin Customers Page JavaScript

/* ---------------------------
   STATE
---------------------------*/
let customers = [];
let filteredCustomers = [];
let currentCustomerId = null;
let dropdownElement = null;

// Animate number from 0 to target
function animateNumber(element, target, duration = 1000) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
    }
    
    requestAnimationFrame(update);
}

// Calculate and update summary statistics
function calculateSummary() {
    const total = customers.length;
    const active = customers.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const blocked = customers.filter(c => (c.status || '').toLowerCase() === 'blocked').length;
    
    // Calculate customers added this month (if we had created_at field)
    const now = new Date();
    const thisMonth = customers.filter(c => {
        // This would need actual created_at field from backend
        // For now, we'll just return 0 or a placeholder
        return false;
    }).length;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-customers-count .summary-number');
    const activeEl = document.querySelector('#active-customers-count .summary-number');
    const blockedEl = document.querySelector('#blocked-customers-count .summary-number');
    const monthlyEl = document.querySelector('#monthly-customers-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (activeEl) animateNumber(activeEl, active);
    if (blockedEl) animateNumber(blockedEl, blocked);
    if (monthlyEl) animateNumber(monthlyEl, thisMonth);
}

/* ---------------------------
   FETCH DATA
---------------------------*/
async function fetchCustomers() {
    const tbody = document.getElementById('customers-table-body');
    const loadingSpinner = document.getElementById('table-loading');
    
    // Show loading state
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                        </div>
                        <p class="text-gray-400">Loading customers...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/customers', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch customers');

        const data = await response.json();
        const customersData = data.customers || data || [];

        // Map backend data to frontend format
        customers = customersData.map(c => ({
            id: c.id,
            name: c.name || c.username || 'Unknown',
            email: c.email,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.username || 'User')}&background=random`,
            role: "customer",
            status: c.status || "Active" // Default status as backend doesn't have status field yet
        }));

        // Remove duplicates based on email
        const uniqueCustomers = [];
        const seenEmails = new Set();

        customers.forEach(c => {
            if (!seenEmails.has(c.email)) {
                seenEmails.add(c.email);
                uniqueCustomers.push(c);
            }
        });

        customers = uniqueCustomers;
        calculateSummary();
        filterCustomers();
    } catch (e) {
        console.error(e);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load customers</p>
                            <button onclick="fetchCustomers()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        customers = [];
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh customers
function refreshCustomers() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchCustomers().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

/* ---------------------------
   RENDER FUNCTIONS
---------------------------*/
function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    const countDisplay = document.getElementById('customers-count-display');
    
    if (!tbody) return;

    if (filteredCustomers.length === 0) {
        const searchTerm = document.getElementById('search-input')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        
        let emptyMessage = '';
        let emptyIcon = 'users';
        
        if (customers.length === 0) {
            emptyMessage = 'No customers found';
            emptyIcon = 'users';
        } else if (searchTerm || statusFilter !== 'all') {
            emptyMessage = 'No customers match your filters';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No customers found';
            emptyIcon = 'users';
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
                            ${customers.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your filters</p>'}
                        </div>
                        ${customers.length === 0 ? '' : `
                            <button onclick="resetFilters()" class="btn-secondary">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Clear Filters
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        
        if (countDisplay) {
            countDisplay.textContent = '0 customers';
        }
        return;
    }

    const html = filteredCustomers.map((customer, index) => `
        <tr class="reveal">
            <td>
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                        <img src="${customer.avatarUrl}" alt="${customer.name}" class="h-full w-full object-cover" />
                    </div>
                    <span class="font-medium">${customer.name}</span>
                </div>
            </td>
            <td>
                <span class="badge badge-role">${customer.role}</span>
            </td>
            <td>
                <span class="badge ${customer.status === 'Active' ? 'badge-active' : 'badge-blocked'}">
                    ${customer.status}
                </span>
            </td>
            <td>${customer.email}</td>
            <td class="text-right">
                <button class="action-btn" onclick="showCustomerActions(event, '${customer.id}', '${customer.status}')" title="Actions">
                    <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    if (window.lucide) lucide.createIcons();
    
    // Trigger reveal animations
    setTimeout(() => {
        document.querySelectorAll('tbody tr.reveal').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show');
            }, index * 30);
        });
    }, 100);
    
    if (countDisplay) {
        const count = filteredCustomers.length;
        const total = customers.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'customer' : 'customers'}${count !== total ? ` of ${total}` : ''}`;
    }
}

/* ---------------------------
   SEARCH/FILTER
---------------------------*/
function filterCustomers() {
    const searchInput = document.getElementById('search-input');
    const term = searchInput?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const clearBtn = document.getElementById('search-clear-btn');
    
    // Show/hide clear button
    if (clearBtn) {
        if (term) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }

    if (!term && statusFilter === 'all') {
        filteredCustomers = [...customers];
    } else {
        filteredCustomers = customers.filter(customer => {
            const matchTerm = 
                customer.name.toLowerCase().includes(term) ||
                customer.email.toLowerCase().includes(term);
            const matchStatus = statusFilter === 'all' || (customer.status || '').toLowerCase() === statusFilter.toLowerCase();
            return matchTerm && matchStatus;
        });
    }

    renderCustomersTable();
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
        filterCustomers();
        searchInput.focus();
    }
}

function resetFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    
    filterCustomers();
}

/* ---------------------------
   CUSTOMER ACTIONS
---------------------------*/
function showCustomerActions(event, customerId, status) {
    event.stopPropagation();

    currentCustomerId = customerId;
    dropdownElement = document.getElementById('customer-dropdown');

    // Update button text based on status
    const toggleBtn = document.getElementById('toggle-customer-status-btn');
    if (toggleBtn) {
        toggleBtn.textContent = status === 'Active' ? 'Block Account' : 'Unblock Account';
        toggleBtn.className = status === 'Active' ? 'dropdown-item dropdown-item-danger' : 'dropdown-item';
    }

    // Position dropdown
    const rect = event.currentTarget.getBoundingClientRect();
    dropdownElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
    dropdownElement.style.left = `${rect.left + window.scrollX - 150}px`;

    dropdownElement.classList.remove('hidden');
}

function hideDropdown() {
    if (dropdownElement) {
        dropdownElement.classList.add('hidden');
    }
}

function viewCustomerDetails() {
    const customer = customers.find(c => c.id == currentCustomerId); // Loose equality for ID
    if (customer) {
        if (window.showAlert) {
            window.showAlert('Customer Details', `Name: ${customer.name}\nEmail: ${customer.email}\nStatus: ${customer.status}`, 'info');
        } else {
            alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nStatus: ${customer.status}`);
        }
    }
    hideDropdown();
}

function editCustomer() {
    const customer = customers.find(c => c.id == currentCustomerId);
    if (customer) {
        if (window.showAlert) {
            window.showAlert('Edit Customer', `Edit functionality for ${customer.name} would be implemented here.`, 'info');
        } else {
            alert(`Edit functionality for ${customer.name} would be implemented here.`);
        }
    }
    hideDropdown();
}

function toggleCustomerStatus() {
    const customer = customers.find(c => c.id == currentCustomerId);
    if (!customer) return;

    const newStatus = customer.status === 'Active' ? 'Blocked' : 'Active';

    customers = customers.map(c =>
        c.id == currentCustomerId ? { ...c, status: newStatus } : c
    );

    // Update filtered customers as well
    filteredCustomers = filteredCustomers.map(c =>
        c.id == currentCustomerId ? { ...c, status: newStatus } : c
    );

    hideDropdown();
    calculateSummary();
    renderCustomersTable();

    if (window.showAlert) {
        window.showAlert('Status Updated', `Customer ${customer.name} has been ${newStatus === 'Active' ? 'unblocked' : 'blocked'}.`, 'success');
    } else {
        alert(`Customer ${customer.name} has been ${newStatus === 'Active' ? 'unblocked' : 'blocked'}.`);
    }
}

function openAddCustomerModal() {
    if (window.showAlert) {
        window.showAlert('Add Customer', 'Add customer functionality would be implemented here.', 'info');
    } else {
        alert('Add customer functionality would be implemented here.');
    }
}

/* ---------------------------
   EVENT LISTENERS
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Fetch real data
    fetchCustomers();

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterCustomers();
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filterCustomers();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownElement && !dropdownElement.contains(e.target)) {
            hideDropdown();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or Cmd+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to close dropdown
        if (e.key === 'Escape' && dropdownElement && !dropdownElement.classList.contains('hidden')) {
            hideDropdown();
        }
    });

    // Reveal animation
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        document.querySelectorAll('.reveal').forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add('show');
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener('scroll', revealOnScroll);
});
