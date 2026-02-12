// verified-vendors.js – admin verified vendor management
// ImpromptuIndianApi is provided by sidebar.js

function showToast(msg, type = 'success') {
  let title = 'Success';
  if (type === 'error') title = 'Error';
  if (type === 'info') title = 'Info';

  if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')) {
    type = 'error';
    title = 'Error';
  }

  showAlert(title, msg, type);
}

let vendors = [];
let filteredVendors = [];
let currentVendorId = null;

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

// Animate decimal number (for commission rate)
function animateDecimal(element, target, duration = 1000, suffix = '') {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (target - start) * easeOutQuart;
        
        element.textContent = current.toFixed(2) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toFixed(2) + suffix;
        }
    }
    
    requestAnimationFrame(update);
}

// Calculate and update summary statistics
function calculateSummary() {
    const total = vendors.length;
    const active = vendors.filter(v => (v.status || '').toLowerCase() === 'verified' || (v.status || '').toLowerCase() === 'approved').length;
    
    // Calculate average commission rate
    let avgCommission = 0;
    if (vendors.length > 0) {
        const totalCommission = vendors.reduce((sum, v) => {
            return sum + (parseFloat(v.commissionRate) || 0);
        }, 0);
        avgCommission = totalCommission / vendors.length;
    }
    
    // Calculate vendors joined this month
    const now = new Date();
    const thisMonth = vendors.filter(v => {
        if (!v.joinedDate) return false;
        const joinedDate = new Date(v.joinedDate);
        return joinedDate.getMonth() === now.getMonth() && joinedDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-vendors-count .summary-number');
    const activeEl = document.querySelector('#active-vendors-count .summary-number');
    const avgCommissionEl = document.querySelector('#avg-commission-rate .summary-number');
    const monthlyEl = document.querySelector('#monthly-vendors-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (activeEl) animateNumber(activeEl, active);
    if (avgCommissionEl) animateDecimal(avgCommissionEl, avgCommission);
    if (monthlyEl) animateNumber(monthlyEl, thisMonth);
}

async function fetchVendors() {
  const tbody = document.getElementById('vendors-table');
  const loadingSpinner = document.getElementById('table-loading');
  
  // Show loading state
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
            </div>
            <p class="text-gray-400">Loading vendors...</p>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
  }
  
  if (loadingSpinner) loadingSpinner.classList.remove('hidden');
  
  try {
    // Use dedicated verified-vendors endpoint which returns properly formatted data
    const response = await ImpromptuIndianApi.fetch('/api/admin/verified-vendors', {
      credentials: 'include'  // Use cookie-based auth (HttpOnly JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch verified vendors');
    const data = await response.json();
    // The endpoint returns an array directly, not wrapped in {vendors: [...]}
    vendors = Array.isArray(data) ? data : (data.vendors || []);
    
    calculateSummary();
    filterVendors();
  } catch (e) {
    console.error(e);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-16">
            <div class="flex flex-col items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
              </div>
              <p class="text-gray-400">Failed to load vendors</p>
              <button onclick="fetchVendors()" class="btn-secondary mt-2">
                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
              </button>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
    }
    showToast('Error loading verified vendors', 'error');
  } finally {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
  }
}

// Refresh vendors
function refreshVendors() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchVendors().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderVendors() {
  const tbody = document.getElementById('vendors-table');
  const countDisplay = document.getElementById('vendors-count-display');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (filteredVendors.length === 0) {
    const searchTerm = document.getElementById('search-vendor')?.value || '';
    
    let emptyMessage = '';
    let emptyIcon = 'users';
    
    if (vendors.length === 0) {
      emptyMessage = 'No verified vendors found';
      emptyIcon = 'users';
    } else if (searchTerm) {
      emptyMessage = 'No vendors match your search';
      emptyIcon = 'search-x';
    } else {
      emptyMessage = 'No verified vendors found';
      emptyIcon = 'users';
    }
    
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
            </div>
            <div class="text-center">
              <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
              ${vendors.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
            </div>
            ${vendors.length === 0 ? '' : `
              <button onclick="resetFilters()" class="btn-secondary">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Clear Search
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    
    if (countDisplay) {
      countDisplay.textContent = '0 vendors';
    }
    return;
  }

  filteredVendors.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'reveal';
    tr.innerHTML = `
      <td class="font-medium">${v.name || 'Unknown'}</td>
      <td>${v.businessType || 'N/A'}</td>
      <td>${v.email || 'N/A'}</td>
      <td>${v.phone || 'N/A'}</td>
      <td><span class="font-semibold">${v.commissionRate || 0}%</span></td>
      <td><span class="status-${(v.status || '').toLowerCase()}">${(v.status || 'unknown').charAt(0).toUpperCase() + (v.status || 'unknown').slice(1)}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewVendor(${v.id})" title="View Details">
          <i data-lucide="eye" class="w-4 h-4"></i>
          <span class="hidden sm:inline ml-1">View</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
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
    const count = filteredVendors.length;
    const total = vendors.length;
    countDisplay.textContent = `${count} ${count === 1 ? 'vendor' : 'vendors'}${count !== total ? ` of ${total}` : ''}`;
  }
}

function filterVendors() {
  const searchInput = document.getElementById('search-vendor');
  const term = searchInput?.value.toLowerCase().trim() || '';
  const clearBtn = document.getElementById('search-clear-btn');
  
  // Show/hide clear button
  if (clearBtn) {
    if (term) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  
  filteredVendors = vendors.filter(v => {
    const matchTerm = 
      (v.name || '').toLowerCase().includes(term) ||
      (v.email || '').toLowerCase().includes(term) ||
      (v.businessType || '').toLowerCase().includes(term) ||
      (v.phone || '').includes(term);
    return matchTerm;
  });
  
  renderVendors();
}

function clearSearch() {
  const searchInput = document.getElementById('search-vendor');
  if (searchInput) {
    searchInput.value = '';
    filterVendors();
    searchInput.focus();
  }
}

function resetFilters() {
  clearSearch();
}

function viewVendor(id) {
  currentVendorId = id;
  const vendor = vendors.find(v => v.id === id);
  if (!vendor) return;
  
  const body = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <i data-lucide="user" class="w-5 h-5"></i>
          Vendor Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-400 mb-1">Name</p>
            <p class="text-white font-medium">${vendor.name || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Business Type</p>
            <p class="text-white font-medium">${vendor.businessType || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Email</p>
            <p class="text-white font-medium">${vendor.email || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Phone</p>
            <p class="text-white font-medium">${vendor.phone || 'N/A'}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm text-gray-400 mb-1">Address</p>
            <p class="text-white font-medium">${vendor.address || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Status</p>
            <span class="status-${(vendor.status || '').toLowerCase()}">${(vendor.status || 'unknown').charAt(0).toUpperCase() + (vendor.status || 'unknown').slice(1)}</span>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Joined Date</p>
            <p class="text-white font-medium">${vendor.joinedDate || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <i data-lucide="settings" class="w-5 h-5"></i>
          Business Configuration
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-400 mb-1">Commission Rate</p>
            <p class="text-white font-medium text-xl">${vendor.commissionRate || 0}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Payment Cycle</p>
            <p class="text-white font-medium">${vendor.paymentCycle || 'N/A'}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm text-gray-400 mb-1">Service Zone</p>
            <p class="text-white font-medium">${vendor.serviceZone || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold text-white">Admin Notes</label>
        <textarea id="admin-notes" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" rows="3" placeholder="Add internal notes about this vendor..."></textarea>
      </div>
    </div>
  `;

  document.getElementById('modal-title').textContent = vendor.name || 'Vendor Details';
  document.getElementById('vendor-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeVendorModal() {
  document.getElementById('vendor-modal').classList.add('hidden');
  currentVendorId = null;
}

async function suspendVendor() {
  if (!currentVendorId) return;

  showAlert('Confirm Suspension', 'Are you sure you want to suspend this vendor?', 'confirm', async () => {
    try {
      // TODO: Implement suspend endpoint
      const vendor = vendors.find(v => v.id === currentVendorId);
      showToast(`${vendor.name} suspension feature coming soon`, 'info');
      closeVendorModal();
    } catch (e) {
      console.error(e);
      showToast('Error suspending vendor', 'error');
    }
  });
}

async function reactivateVendor() {
  if (!currentVendorId) return;

  try {
    // TODO: Implement reactivate endpoint
    const vendor = vendors.find(v => v.id === currentVendorId);
    showToast(`${vendor.name} reactivation feature coming soon`, 'info');
    closeVendorModal();
  } catch (e) {
    console.error(e);
    showToast('Error reactivating vendor', 'error');
  }
}

function openAddVendorModal() {
  showToast('Add vendor functionality coming soon', 'info');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+K or Cmd+K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('search-vendor');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Escape to close modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('vendor-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeVendorModal();
    }
  }
});

// Reveal animations on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add('show');
    }
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // Trigger reveal animations
  onScroll();
  window.addEventListener('scroll', onScroll);
  
  // Initial reveal for elements in viewport
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight) {
        el.classList.add('show');
      }
    });
  }, 100);
  
  // Fetch vendors
  fetchVendors();
  
  // Add search input event listeners
  const searchInput = document.getElementById('search-vendor');
  if (searchInput) {
    searchInput.addEventListener('input', filterVendors);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
  }
});
