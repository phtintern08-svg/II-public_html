// rejected-vendors.js – admin rejected vendor re-application review (live data)
// ImpromptuIndianApi is provided by sidebar.js

function showToast(msg) {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  if (!toast || !txt) return;
  txt.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

let rejectedVendors = [];
let filteredRejectedVendors = [];
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

// Calculate and update summary statistics
function calculateSummary() {
    const total = rejectedVendors.length;
    const reapplied = rejectedVendors.filter(v => v.reapplied === true).length;
    
    // Calculate vendors rejected this month
    const now = new Date();
    const thisMonth = rejectedVendors.filter(v => {
        if (!v.submittedOn) return false;
        try {
            const submittedDate = new Date(v.submittedOn);
            return submittedDate.getMonth() === now.getMonth() && submittedDate.getFullYear() === now.getFullYear();
        } catch (e) {
            return false;
        }
    }).length;
    
    // Pending review (re-applied vendors)
    const pendingReview = reapplied;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-rejected-count .summary-number');
    const reappliedEl = document.querySelector('#reapplied-count .summary-number');
    const monthlyEl = document.querySelector('#monthly-rejected-count .summary-number');
    const pendingEl = document.querySelector('#pending-review-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (reappliedEl) animateNumber(reappliedEl, reapplied);
    if (monthlyEl) animateNumber(monthlyEl, thisMonth);
    if (pendingEl) animateNumber(pendingEl, pendingReview);
}

async function fetchRejectedVendors() {
  const tbody = document.getElementById('rejected-table');
  const loadingSpinner = document.getElementById('table-loading');
  
  // Show loading state
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
            </div>
            <p class="text-gray-400">Loading rejected vendors...</p>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
  }
  
  if (loadingSpinner) loadingSpinner.classList.remove('hidden');
  
  try {
    const response = await ImpromptuIndianApi.fetch('/api/admin/rejected-vendors', {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch rejected vendors');

    const data = await response.json();
    const all = data.vendors || data;
    rejectedVendors = Array.isArray(all) ? all : []
      .map(v => ({
        id: v.id,
        name: v.name || v.businessName || 'Unknown',
        submittedOn: v.submitted || v.submittedOn || 'N/A',
        rejectionReason: v.adminRemarks || v.rejectionReason || 'Documents rejected',
        documents: v.documents || {},
        reapplied: false, // could be extended later if you track re-applications
      }));

    calculateSummary();
    filterRejected();
  } catch (e) {
    console.error('Error loading rejected vendors', e);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-16">
            <div class="flex flex-col items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
              </div>
              <p class="text-gray-400">Failed to load rejected vendors</p>
              <button onclick="fetchRejectedVendors()" class="btn-secondary mt-2">
                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
              </button>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
    }
    showToast('Error loading rejected vendors');
  } finally {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
  }
}

// Refresh rejected vendors
function refreshRejected() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchRejectedVendors().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderRejected() {
  const tbody = document.getElementById('rejected-table');
  const countDisplay = document.getElementById('rejected-count-display');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (filteredRejectedVendors.length === 0) {
    const searchTerm = document.getElementById('search-rejected')?.value || '';
    
    let emptyMessage = '';
    let emptyIcon = 'x-circle';
    
    if (rejectedVendors.length === 0) {
      emptyMessage = 'No rejected vendors found';
      emptyIcon = 'x-circle';
    } else if (searchTerm) {
      emptyMessage = 'No vendors match your search';
      emptyIcon = 'search-x';
    } else {
      emptyMessage = 'No rejected vendors found';
      emptyIcon = 'x-circle';
    }
    
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
            </div>
            <div class="text-center">
              <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
              ${rejectedVendors.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
            </div>
            ${rejectedVendors.length === 0 ? '' : `
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

  filteredRejectedVendors.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'reveal';
    tr.innerHTML = `
      <td class="font-medium">
        ${v.name}
        ${v.reapplied ? '<span class="text-blue-400 text-xs ml-2">(Re-applied)</span>' : ''}
      </td>
      <td>${v.submittedOn}</td>
      <td>
        <span class="rejection-reason" title="${v.rejectionReason}">
          ${v.rejectionReason.length > 50 ? v.rejectionReason.substring(0, 50) + '...' : v.rejectionReason}
        </span>
      </td>
      <td class="text-right">
        <button class="btn-primary" onclick="reviewReapply(${v.id})" title="Review Re-application">
          <i data-lucide="eye" class="w-4 h-4"></i>
          <span class="hidden sm:inline ml-1">Review</span>
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
    const count = filteredRejectedVendors.length;
    const total = rejectedVendors.length;
    countDisplay.textContent = `${count} ${count === 1 ? 'vendor' : 'vendors'}${count !== total ? ` of ${total}` : ''}`;
  }
}

function filterRejected() {
  const searchInput = document.getElementById('search-rejected');
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
  
  filteredRejectedVendors = rejectedVendors.filter(v => {
    const matchTerm = 
      (v.name || '').toLowerCase().includes(term) ||
      (v.rejectionReason || '').toLowerCase().includes(term) ||
      (v.submittedOn || '').toLowerCase().includes(term);
    return matchTerm;
  });
  
  renderRejected();
}

function clearSearch() {
  const searchInput = document.getElementById('search-rejected');
  if (searchInput) {
    searchInput.value = '';
    filterRejected();
    searchInput.focus();
  }
}

function resetFilters() {
  clearSearch();
}

function reviewReapply(id) {
  currentVendorId = id;
  const vendor = rejectedVendors.find(v => v.id === id);
  if (!vendor) return;
  
  const body = document.getElementById('reapply-body');

  // Safely access document statuses
  const getDocStatus = (docType) => {
    const doc = vendor.documents && vendor.documents[docType];
    return {
      status: doc?.status || 'pending',
      reason: doc?.adminRemarks || doc?.reason || ''
    };
  };

  const pan = getDocStatus('pan');
  const aadhar = getDocStatus('aadhar');
  const gst = getDocStatus('gst');
  const bank = getDocStatus('bank');
  const workshop = getDocStatus('workshop');
  const business = getDocStatus('business');

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
            <p class="text-sm text-gray-400 mb-1">Submitted On</p>
            <p class="text-white font-medium">${vendor.submittedOn || 'N/A'}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm text-gray-400 mb-1">Previous Rejection Reason</p>
            <span class="rejection-reason">${vendor.rejectionReason || 'N/A'}</span>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">Re-applied</p>
            <p class="text-white font-medium">${vendor.reapplied ? '<span class="text-green-400">Yes</span>' : '<span class="text-gray-500">No</span>'}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <i data-lucide="file-text" class="w-5 h-5"></i>
          Document Status
        </h3>
        <div class="doc-status-grid">
          <div class="doc-status-card">
            <h4>PAN Card</h4>
            <p>Tax identification</p>
            <span class="doc-status ${pan.status}">${pan.status}</span>
            ${pan.reason ? `<p class="text-xs text-red-400 mt-1">${pan.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>Aadhar Card</h4>
            <p>Identity proof</p>
            <span class="doc-status ${aadhar.status}">${aadhar.status}</span>
            ${aadhar.reason ? `<p class="text-xs text-red-400 mt-1">${aadhar.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>GST Certificate</h4>
            <p>Tax registration</p>
            <span class="doc-status ${gst.status}">${gst.status}</span>
            ${gst.reason ? `<p class="text-xs text-red-400 mt-1">${gst.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>Bank Details</h4>
            <p>Payment information</p>
            <span class="doc-status ${bank.status}">${bank.status}</span>
            ${bank.reason ? `<p class="text-xs text-red-400 mt-1">${bank.reason}</p>` : ''}
          </div>
          ${workshop.status ? `
          <div class="doc-status-card">
            <h4>Workshop Images</h4>
            <p>Business premises</p>
            <span class="doc-status ${workshop.status}">${workshop.status}</span>
            ${workshop.reason ? `<p class="text-xs text-red-400 mt-1">${workshop.reason}</p>` : ''}
          </div>
          ` : ''}
          ${business.status ? `
          <div class="doc-status-card">
            <h4>Business License</h4>
            <p>Business registration</p>
            <span class="doc-status ${business.status}">${business.status}</span>
            ${business.reason ? `<p class="text-xs text-red-400 mt-1">${business.reason}</p>` : ''}
          </div>
          ` : ''}
        </div>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold text-white">Admin Feedback</label>
        <textarea id="admin-feedback" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" rows="3" placeholder="Provide feedback to vendor about corrections needed..."></textarea>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold text-white">Commission Rate (%) if approving</label>
        <input type="number" id="commission-rate" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value="15" min="0" max="100" />
      </div>
    </div>
  `;

  document.getElementById('reapply-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeReapplyModal() {
  document.getElementById('reapply-modal').classList.add('hidden');
  currentVendorId = null;
}

async function approveReapply() {
  if (!currentVendorId) return;

  // For now, simply show a toast; actual re-apply approval flow would
  // use backend endpoints to move vendor out of rejected state.
  const commissionRate = document.getElementById('commission-rate')?.value;
  const vendor = rejectedVendors.find(v => v.id === currentVendorId);

  showToast(`${vendor.name} approved with ${commissionRate}% commission (mock)`);
  closeReapplyModal();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+K or Cmd+K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('search-rejected');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Escape to close modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('reapply-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeReapplyModal();
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
  
  // Fetch rejected vendors
  fetchRejectedVendors();
  
  // Add search input event listeners
  const searchInput = document.getElementById('search-rejected');
  if (searchInput) {
    searchInput.addEventListener('input', filterRejected);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
  }
});
