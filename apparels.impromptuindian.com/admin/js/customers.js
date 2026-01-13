// Admin Customers Page JavaScript
lucide.createIcons();

/* ---------------------------
   STATE
---------------------------*/
let customers = [];
let filteredCustomers = [];
let currentCustomerId = null;
let dropdownElement = null;

/* ---------------------------
   FETCH DATA
---------------------------*/
async function fetchCustomers() {
    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch('/api/admin/customers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch customers');

        const data = await response.json();
        const customersData = data.customers || data;

        // Map backend data to frontend format
        customers = customersData.map(c => ({
            id: c.id,
            name: c.name || c.username || 'Unknown',
            email: c.email,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.username || 'User')}&background=random`,
            role: "customer",
            status: "Active" // Default status as backend doesn't have status field yet
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
        filteredCustomers = [...customers];
        renderCustomersTable();

    } catch (e) {
        console.error(e);
        // Fallback to empty state or show error
        customers = [];
        filteredCustomers = [];
        renderCustomersTable();
    }
}

/* ---------------------------
   RENDER FUNCTIONS
---------------------------*/
function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');

    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }

    const html = filteredCustomers.map(customer => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full overflow-hidden border border-gray-700">
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
                <button class="action-btn" onclick="showCustomerActions(event, '${customer.id}', '${customer.status}')">
                    <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    lucide.createIcons();
}

/* ---------------------------
   SEARCH/FILTER
---------------------------*/
function filterCustomers(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
        filteredCustomers = [...customers];
    } else {
        filteredCustomers = customers.filter(customer =>
            customer.name.toLowerCase().includes(term) ||
            customer.email.toLowerCase().includes(term)
        );
    }

    renderCustomersTable();
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
    toggleBtn.textContent = status === 'Active' ? 'Block Account' : 'Unblock Account';
    toggleBtn.className = status === 'Active' ? 'dropdown-item dropdown-item-danger' : 'dropdown-item';

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
        alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nStatus: ${customer.status}`);
    }
    hideDropdown();
}

function editCustomer() {
    const customer = customers.find(c => c.id == currentCustomerId);
    if (customer) {
        alert(`Edit functionality for ${customer.name} would be implemented here.`);
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
    renderCustomersTable();

    alert(`Customer ${customer.name} has been ${newStatus === 'Active' ? 'unblocked' : 'blocked'}.`);
}

/* ---------------------------
   EVENT LISTENERS
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Fetch real data
    fetchCustomers();

    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        filterCustomers(e.target.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownElement && !dropdownElement.contains(e.target)) {
            hideDropdown();
        }
    });

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add("show");
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener("scroll", revealOnScroll);
});
