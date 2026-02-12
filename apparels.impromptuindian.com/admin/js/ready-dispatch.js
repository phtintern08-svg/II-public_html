// ready-dispatch.js – admin dispatch queue

function showToast(msg, type = 'info') {
  // Use the new alert system (matching login page)
  if (typeof showAlert === 'function') {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    showAlert(titles[type] || 'Info', msg, type);
  } else {
    // Fallback
    alert(msg);
  }
}

// Global dispatch data
let dispatchQueue = [];

// Animate number counting up
function animateNumber(element, target, duration = 1000) {
  if (!element) return;
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Calculate summary statistics
function calculateSummary() {
  const total = dispatchQueue.length;
  const qcPending = dispatchQueue.filter(d => {
    const qc = (d.qc_status || d.qc || '').toLowerCase();
    return qc === 'pending' || qc === 'qc_pending';
  }).length;
  const qcApproved = dispatchQueue.filter(d => {
    const qc = (d.qc_status || d.qc || '').toLowerCase();
    return qc === 'approved' || qc === 'qc_approved';
  }).length;
  const qcFailed = dispatchQueue.filter(d => {
    const qc = (d.qc_status || d.qc || '').toLowerCase();
    return qc === 'failed' || qc === 'qc_failed';
  }).length;

  const totalEl = document.getElementById('total-dispatch-count');
  const qcPendingEl = document.getElementById('qc-pending-count');
  const qcApprovedEl = document.getElementById('qc-approved-count');
  const qcFailedEl = document.getElementById('qc-failed-count');

  if (totalEl) {
    const numberEl = totalEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, total);
  }
  if (qcPendingEl) {
    const numberEl = qcPendingEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, qcPending);
  }
  if (qcApprovedEl) {
    const numberEl = qcApprovedEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, qcApproved);
  }
  if (qcFailedEl) {
    const numberEl = qcFailedEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, qcFailed);
  }
}

async function fetchDispatch() {
  const tableLoading = document.getElementById('table-loading');
  const tbody = document.getElementById('dispatch-table');
  
  // Show loading state
  if (tableLoading) tableLoading.classList.remove('hidden');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-12">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
            <p class="text-gray-400">Loading dispatch queue...</p>
          </div>
        </td>
      </tr>
    `;
  }
  if (window.lucide) lucide.createIcons();
  
  try {
    // TODO: Replace with actual API endpoint when available
    // const response = await ImpromptuIndianApi.fetch('/api/admin/ready-dispatch');
    // if (!response.ok) throw new Error('Failed to fetch dispatch data');
    // dispatchQueue = await response.json();
    
    // For now, use mock data
    dispatchQueue = [
      { id: 'ORD-1028', db_id: 1028, vendorName: 'DTF Prints Co.', qc_status: 'pending', readySince: '2025-11-20' },
      { id: 'ORD-1029', db_id: 1029, vendorName: 'Screen Masters', qc_status: 'approved', readySince: '2025-11-19' },
      { id: 'ORD-1030', db_id: 1030, vendorName: 'Sublime Studios', qc_status: 'pending', readySince: '2025-11-21' },
      { id: 'ORD-1031', db_id: 1031, vendorName: 'Embroidery Hub', qc_status: 'approved', readySince: '2025-11-22' }
    ];
    
    renderDispatch();
    calculateSummary();
    
    // Hide loading state
    if (tableLoading) tableLoading.classList.add('hidden');
  } catch (e) {
    console.error('Error fetching dispatch:', e);
    showToast('Failed to load dispatch data', 'error');
    
    // Hide loading state and show error
    if (tableLoading) tableLoading.classList.add('hidden');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-12">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
              <p class="text-gray-400">Failed to load dispatch queue. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
  }
}

function getQCStatusClass(qcStatus) {
  const qc = (qcStatus || '').toLowerCase();
  if (qc === 'pending' || qc === 'qc_pending') return 'status-pending';
  if (qc === 'approved' || qc === 'qc_approved') return 'status-approved';
  if (qc === 'failed' || qc === 'qc_failed') return 'status-failed';
  return 'status-pending';
}

function getQCStatusLabel(qcStatus) {
  const qc = (qcStatus || '').toLowerCase();
  if (qc === 'pending' || qc === 'qc_pending') return 'QC Pending';
  if (qc === 'approved' || qc === 'qc_approved') return 'QC Approved';
  if (qc === 'failed' || qc === 'qc_failed') return 'QC Failed';
  return 'QC Pending';
}

function renderDispatch(ordersToRender = dispatchQueue) {
  const tbody = document.getElementById('dispatch-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Handle empty state
  if (!ordersToRender || ordersToRender.length === 0) {
    const hasFilters = document.getElementById('qc-filter')?.value !== 'all' || 
                      document.getElementById('search-dispatch')?.value.trim() !== '';
    
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-16 text-gray-400">
          <div class="flex flex-col items-center gap-4">
            <div class="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="truck" class="w-10 h-10 opacity-50"></i>
            </div>
            <div class="text-center">
              <p class="text-xl font-semibold text-gray-300 mb-2">${hasFilters ? 'No matching orders' : 'No orders ready for dispatch'}</p>
              <p class="text-sm text-gray-500">${hasFilters ? 'Try adjusting your filters or search terms' : 'Orders cleared by vendors will appear here'}</p>
            </div>
            ${hasFilters ? `
              <button onclick="resetFilters()" class="mt-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20">
                <i data-lucide="rotate-ccw" class="w-4 h-4 inline mr-2"></i>
                Reset Filters
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  ordersToRender.forEach(d => {
    const orderId = d.id || `ORD-${d.db_id || d.id || 'N/A'}`;
    const vendorName = d.vendorName || d.vendor || 'Unknown';
    const qcStatus = d.qc_status || d.qc || 'pending';
    const qcClass = getQCStatusClass(qcStatus);
    const qcLabel = getQCStatusLabel(qcStatus);
    const readySince = d.readySince || d.ready_since || 'N/A';
    const dbId = d.db_id || d.id;
    
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/5 transition-colors duration-200';
    tr.innerHTML = `
      <td class="px-4 py-4 font-mono text-sm text-[#1273EB] font-semibold" data-label="Order ID">${orderId}</td>
      <td class="px-4 py-4 font-semibold text-gray-100" data-label="Vendor">
        <div class="flex items-center gap-2">
          <i data-lucide="building" class="w-4 h-4 text-gray-500"></i>
          <span class="truncate max-w-[200px]" title="${vendorName}">${vendorName}</span>
        </div>
      </td>
      <td class="px-4 py-4" data-label="QC Status">
        <span class="status-badge ${qcClass} shadow-sm">${qcLabel}</span>
      </td>
      <td class="px-4 py-4" data-label="Ready Since">
        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-400"></i>
          ${readySince}
        </div>
      </td>
      <td class="px-4 py-4 text-right" data-label="Actions">
        <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white shadow-lg hover:shadow-xl" onclick="openDispatchModal(${dbId})" title="View Details">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterDispatch() {
  const qc = document.getElementById('qc-filter').value;
  const searchInput = document.getElementById('search-dispatch');
  const term = searchInput.value.toLowerCase();
  const clearBtn = document.getElementById('search-clear-btn');
  
  // Show/hide clear button
  if (term && clearBtn) {
    clearBtn.classList.remove('hidden');
  } else if (clearBtn) {
    clearBtn.classList.add('hidden');
  }
  
  const filtered = dispatchQueue.filter(d => {
    const qcStatus = (d.qc_status || d.qc || '').toLowerCase();
    const vendorName = (d.vendorName || d.vendor || '').toLowerCase();
    const orderId = (d.id || '').toString().toLowerCase();
    const dbId = (d.db_id || '').toString().toLowerCase();
    
    const matchQC = qc === 'all' || 
      (qc === 'pending' && (qcStatus === 'pending' || qcStatus === 'qc_pending')) ||
      (qc === 'approved' && (qcStatus === 'approved' || qcStatus === 'qc_approved')) ||
      (qc === 'failed' && (qcStatus === 'failed' || qcStatus === 'qc_failed'));
    
    const matchTerm = orderId.includes(term) || dbId.includes(term) || vendorName.includes(term);
    return matchQC && matchTerm;
  });
  
  // Update order count display
  const countDisplay = document.getElementById('dispatch-count-display');
  if (countDisplay) {
    const count = filtered.length;
    countDisplay.textContent = `${count} ${count === 1 ? 'order' : 'orders'}`;
  }
  
  renderDispatch(filtered);
}

function clearSearch() {
  const searchInput = document.getElementById('search-dispatch');
  if (searchInput) {
    searchInput.value = '';
    filterDispatch();
    searchInput.focus();
  }
}

function resetFilters() {
  const searchInput = document.getElementById('search-dispatch');
  const qcFilter = document.getElementById('qc-filter');
  
  if (searchInput) searchInput.value = '';
  if (qcFilter) qcFilter.value = 'all';
  
  filterDispatch();
}

function openDispatchModal(id) {
  // Find order by db_id (primary) or id (fallback)
  const order = dispatchQueue.find(d => {
    if (d.db_id && d.db_id.toString() === id.toString()) return true;
    if (d.id && d.id.toString() === id.toString()) return true;
    return false;
  });
  
  const body = document.getElementById('modal-body');
  if (!body || !order) {
    showToast('Order not found', 'error');
    return;
  }
  
  const orderId = order.id || `ORD-${order.db_id || 'N/A'}`;
  const vendorName = order.vendorName || order.vendor || 'Unknown';
  const qcStatus = order.qc_status || order.qc || 'pending';
  const qcClass = getQCStatusClass(qcStatus);
  const qcLabel = getQCStatusLabel(qcStatus);
  const readySince = order.readySince || order.ready_since || 'N/A';
  const customerName = order.customerName || 'Unknown';
  const productType = order.productType || 'N/A';
  const quantity = order.quantity || 0;
  
  body.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-5 border border-white/10 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="package" class="w-4 h-4"></i> Order Information
          </h3>
          <div class="grid grid-cols-2 gap-y-4 text-sm">
            <div class="text-gray-500">Order ID</div>
            <div class="font-mono text-blue-300 font-semibold">${orderId}</div>
            
            <div class="text-gray-500">Customer</div>
            <div class="font-semibold text-gray-100">${customerName}</div>
            
            <div class="text-gray-500">Vendor</div>
            <div class="font-semibold text-gray-100">${vendorName}</div>
            
            <div class="text-gray-500">Product Type</div>
            <div class="font-medium text-gray-200">${productType}</div>
            
            <div class="text-gray-500">Quantity</div>
            <div class="font-bold text-gray-100">${quantity} pcs</div>
            
            <div class="text-gray-500">QC Status</div>
            <div>
              <span class="status-badge ${qcClass}">${qcLabel}</span>
            </div>
            
            <div class="text-gray-500">Ready Since</div>
            <div class="flex items-center gap-2 text-blue-200">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              ${readySince}
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-5 border border-white/10 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="truck" class="w-4 h-4"></i> Rider Assignment
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-semibold text-gray-300">Select Rider</label>
              <select id="rider-select" class="w-full p-3 bg-gray-900/50 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option value="">Select a rider...</option>
                <option value="1">John Doe</option>
                <option value="2">Jane Smith</option>
                <option value="3">Mike Johnson</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-sm font-semibold text-gray-300">Admin Notes</label>
              <textarea id="admin-notes" class="w-full p-4 bg-gray-900/50 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none" rows="4" placeholder="Add dispatch notes or special instructions..."></textarea>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-600/5 to-blue-600/[0.02] rounded-xl p-5 border border-blue-500/20 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="file-text" class="w-4 h-4"></i> QC Documents
          </h3>
          <div class="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl bg-black/20 hover:border-blue-500/30 transition-colors">
            <i data-lucide="file" class="w-8 h-8 text-gray-600 mb-2"></i>
            <p class="text-xs text-gray-500 font-medium">No QC documents uploaded yet</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-title').textContent = `Dispatch Order ${orderId}`;
  document.getElementById('dispatch-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeDispatchModal() {
  document.getElementById('dispatch-modal').classList.add('hidden');
}

function assignRider() {
  const rider = document.getElementById('rider-select')?.value;
  if (!rider) {
    showToast('Please select a rider', 'warning');
    return;
  }
  showToast(`Rider assigned successfully`, 'success');
  closeDispatchModal();
}

function failQC() {
  showToast('QC failed - vendor notified', 'error');
  closeDispatchModal();
}

async function refreshDispatch() {
  const refreshBtn = document.getElementById('refreshBtn');
  const originalHTML = refreshBtn ? refreshBtn.innerHTML : '';
  
  // Show loading state on button
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Syncing...</span>';
    if (window.lucide) lucide.createIcons();
  }
  
  try {
    await fetchDispatch();
    showToast('Dispatch queue refreshed successfully', 'success');
  } catch (error) {
    showToast('Failed to refresh dispatch queue', 'error');
  } finally {
    // Restore button
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalHTML;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-dispatch');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
      const modal = document.getElementById('dispatch-modal');
      if (modal && !modal.classList.contains('hidden')) {
        closeDispatchModal();
      }
    }
  });
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Show all reveal elements immediately (they're already in view on page load)
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('show');
    });
  });
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Set up search input event listeners
  const searchInput = document.getElementById('search-dispatch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterDispatch();
    });
    
    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterDispatch();
      }
    });
  }
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
  
  try {
    fetchDispatch();
  } catch (error) {
    console.error('Error initializing page:', error);
  }
  
  // Also set up scroll listener for any elements that come into view later
  onScroll();
  window.addEventListener('scroll', onScroll);
});
