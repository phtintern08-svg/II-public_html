// in-production.js – admin production monitoring 

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

// Global production data
let production = [];

async function fetchProduction() {
  const tableLoading = document.getElementById('table-loading');
  const tbody = document.getElementById('production-table');
  
  // Show loading state
  if (tableLoading) tableLoading.classList.remove('hidden');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
            <p class="text-gray-400">Loading production orders...</p>
          </div>
        </td>
      </tr>
    `;
  }
  if (window.lucide) lucide.createIcons();
  
  try {
    const response = await ImpromptuIndianApi.fetch('/api/admin/production-orders');
    if (!response.ok) throw new Error('Failed to fetch production data');
    production = await response.json();
    renderProduction();
    calculateSummary();
    
    // Hide loading state
    if (tableLoading) tableLoading.classList.add('hidden');
  } catch (e) {
    console.error('Error fetching production:', e);
    showToast('Failed to load production data', 'error');
    
    // Hide loading state and show error
    if (tableLoading) tableLoading.classList.add('hidden');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
              <p class="text-gray-400">Failed to load production orders. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
  }
}

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
  const total = production.length;
  const inProgress = production.filter(p => {
    const progress = parseFloat(p.progress) || 0;
    return progress > 0 && progress < 80;
  }).length;
  const nearCompletion = production.filter(p => {
    const progress = parseFloat(p.progress) || 0;
    return progress >= 80 && progress < 100;
  }).length;
  const atRisk = production.filter(p => {
    // Orders with low progress but approaching deadline
    const progress = parseFloat(p.progress) || 0;
    return progress < 50;
  }).length;

  const totalEl = document.getElementById('total-production-count');
  const inProgressEl = document.getElementById('in-progress-count');
  const nearCompletionEl = document.getElementById('near-completion-count');
  const atRiskEl = document.getElementById('at-risk-count');

  if (totalEl) {
    const numberEl = totalEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, total);
  }
  if (inProgressEl) {
    const numberEl = inProgressEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, inProgress);
  }
  if (nearCompletionEl) {
    const numberEl = nearCompletionEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, nearCompletion);
  }
  if (atRiskEl) {
    const numberEl = atRiskEl.querySelector('.summary-number');
    if (numberEl) animateNumber(numberEl, atRisk);
  }
}

function getStatusBadgeClass(status) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('assigned')) return 'status-assigned';
  if (statusLower.includes('accepted')) return 'status-accepted';
  if (statusLower.includes('material')) return 'status-material';
  if (statusLower.includes('print')) return 'status-print';
  if (statusLower.includes('quality')) return 'status-quality';
  if (statusLower.includes('packed') || statusLower.includes('ready')) return 'status-packed';
  return 'status-assigned';
}

function getProgressBarClass(progress) {
  const prog = parseFloat(progress) || 0;
  if (prog >= 80) return 'success';
  if (prog >= 50) return '';
  if (prog >= 25) return 'warning';
  return 'danger';
}

function renderProduction(ordersToRender = production) {
  const tbody = document.getElementById('production-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Handle empty state
  if (!ordersToRender || ordersToRender.length === 0) {
    const hasFilters = document.getElementById('stage-filter')?.value !== 'all' || 
                      document.getElementById('search-prod')?.value.trim() !== '';
    
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-16 text-gray-400">
          <div class="flex flex-col items-center gap-4">
            <div class="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center">
              <i data-lucide="factory" class="w-10 h-10 opacity-50"></i>
            </div>
            <div class="text-center">
              <p class="text-xl font-semibold text-gray-300 mb-2">${hasFilters ? 'No matching orders' : 'No production orders'}</p>
              <p class="text-sm text-gray-500">${hasFilters ? 'Try adjusting your filters or search terms' : 'Orders in production will appear here'}</p>
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

  ordersToRender.forEach(p => {
    const progress = parseFloat(p.progress) || 0;
    const status = p.status || 'assigned';
    const statusClass = getStatusBadgeClass(status);
    const progressClass = getProgressBarClass(progress);
    const statusText = status.replace(/_/g, ' ');
    const orderId = p.id || `ORD-${p.db_id || 'N/A'}`;
    const vendorName = p.vendorName || 'Unknown';
    const dbId = p.db_id || p.id;
    
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
      <td class="px-4 py-4" data-label="Current Stage">
        <span class="status-badge ${statusClass} shadow-sm">${statusText}</span>
      </td>
      <td class="px-4 py-4" data-label="Deadline">
        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-400"></i>
          ${p.deadline || 'No deadline'}
        </div>
      </td>
      <td class="px-4 py-4" data-label="Progress">
        <div class="w-full max-w-[140px]">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">${progress.toFixed(1)}%</span>
          </div>
          <div class="progress-bar h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <div class="progress-fill h-full ${progressClass}" style="width:${progress}%"></div>
          </div>
        </div>
      </td>
      <td class="px-4 py-4 text-right" data-label="Actions">
        <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white shadow-lg hover:shadow-xl" onclick="openProdModal(${dbId})" title="View Details">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterProduction() {
  const stage = document.getElementById('stage-filter').value;
  const searchInput = document.getElementById('search-prod');
  const term = searchInput.value.toLowerCase();
  const clearBtn = document.getElementById('search-clear-btn');
  
  // Show/hide clear button
  if (term && clearBtn) {
    clearBtn.classList.remove('hidden');
  } else if (clearBtn) {
    clearBtn.classList.add('hidden');
  }
  
  const filtered = production.filter(p => {
    const status = (p.status || '').toLowerCase();
    const vendorName = (p.vendorName || '').toLowerCase();
    const orderId = (p.id || '').toString().toLowerCase();
    const dbId = (p.db_id || '').toString().toLowerCase();
    
    const matchStage = stage === 'all' || 
      (stage === 'assigned' && status.includes('assigned')) ||
      (stage === 'accepted' && (status.includes('accepted') || status.includes('accepted_by_vendor'))) ||
      (stage === 'material' && status.includes('material')) ||
      (stage === 'print' && status.includes('print')) ||
      (stage === 'quality' && status.includes('quality')) ||
      (stage === 'packed' && (status.includes('packed') || status.includes('ready')));
    
    const matchTerm = orderId.includes(term) || dbId.includes(term) || vendorName.includes(term);
    return matchStage && matchTerm;
  });
  
  // Update order count display
  const countDisplay = document.getElementById('production-count-display');
  if (countDisplay) {
    const count = filtered.length;
    countDisplay.textContent = `${count} ${count === 1 ? 'order' : 'orders'}`;
  }
  
  renderProduction(filtered);
}

function clearSearch() {
  const searchInput = document.getElementById('search-prod');
  if (searchInput) {
    searchInput.value = '';
    filterProduction();
    searchInput.focus();
  }
}

function resetFilters() {
  const searchInput = document.getElementById('search-prod');
  const stageFilter = document.getElementById('stage-filter');
  
  if (searchInput) searchInput.value = '';
  if (stageFilter) stageFilter.value = 'all';
  
  filterProduction();
}

function openProdModal(id) {
  // Find order by db_id (primary) or id (fallback)
  const prod = production.find(p => {
    if (p.db_id && p.db_id.toString() === id.toString()) return true;
    if (p.id && p.id.toString() === id.toString()) return true;
    return false;
  });
  
  const body = document.getElementById('modal-body');
  if (!body || !prod) {
    showToast('Order not found', 'error');
    return;
  }
  
  const progress = parseFloat(prod.progress) || 0;
  const status = prod.status || 'assigned';
  const statusClass = getStatusBadgeClass(status);
  const progressClass = getProgressBarClass(progress);
  const statusText = status.replace(/_/g, ' ');
  const orderId = prod.id || `ORD-${prod.db_id || 'N/A'}`;
  const vendorName = prod.vendorName || 'Unknown';
  const customerName = prod.customerName || 'Unknown';
  const productType = prod.productType || 'N/A';
  const quantity = prod.quantity || 0;
  
  body.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-5 border border-white/10 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="activity" class="w-4 h-4"></i> Tracking Status
          </h3>
          <div class="grid grid-cols-2 gap-y-4 text-sm">
            <div class="text-gray-500">Order ID</div>
            <div class="font-mono text-blue-300 font-semibold">${orderId}</div>
            
            <div class="text-gray-500">Customer</div>
            <div class="font-semibold text-gray-100">${customerName}</div>
            
            <div class="text-gray-500">Contracted Vendor</div>
            <div class="font-semibold text-gray-100">${vendorName}</div>
            
            <div class="text-gray-500">Product Type</div>
            <div class="font-medium text-gray-200">${productType}</div>
            
            <div class="text-gray-500">Quantity</div>
            <div class="font-bold text-gray-100">${quantity} pcs</div>
            
            <div class="text-gray-500">Current Phase</div>
            <div>
               <span class="status-badge ${statusClass}">${statusText.replace(/_/g, ' ')}</span>
            </div>
            
            <div class="text-gray-500">Deadline</div>
            <div class="flex items-center gap-2 text-blue-200">
               <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
               ${prod.deadline || 'No deadline'}
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-5 border border-white/10 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-green-400 mb-4 uppercase tracking-widest">
            <i data-lucide="trending-up" class="w-4 h-4"></i> Completion Ratio
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-end">
               <span class="text-3xl font-bold text-white">${progress.toFixed(1)}%</span>
               <span class="text-xs text-gray-500 font-medium pb-1 uppercase tracking-tighter">Production Completion</span>
            </div>
            <div class="progress-bar h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5 p-0.5">
               <div class="progress-fill h-full ${progressClass} rounded-full" style="width: ${progress}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Started</span>
              <span>In Progress</span>
              <span>${progress >= 100 ? 'Completed' : 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-5 border border-white/10 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="message-square" class="w-4 h-4"></i> Operations Log
          </h3>
          <textarea id="admin-notes" class="w-full p-4 bg-gray-900/50 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none" rows="4" placeholder="Log details of vendor communication or production issues..."></textarea>
        </div>

        <div class="bg-gradient-to-br from-blue-600/5 to-blue-600/[0.02] rounded-xl p-5 border border-blue-500/20 shadow-lg">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="camera" class="w-4 h-4"></i> Visual Proofs
          </h3>
          <div class="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl bg-black/20 hover:border-blue-500/30 transition-colors">
             <i data-lucide="image" class="w-8 h-8 text-gray-600 mb-2"></i>
             <p class="text-xs text-gray-500 font-medium">No production photos uploaded yet</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-title').textContent = `Production Order ${orderId}`;
  document.getElementById('prod-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeProdModal() {
  document.getElementById('prod-modal').classList.add('hidden');
}

function reassignVendor() {
  showToast('Vendor reassignment initiated');
  closeProdModal();
}

function sendReminder() {
  showToast('Reminder sent to vendor');
  closeProdModal();
}

async function refreshProduction() {
  const refreshBtn = document.getElementById('refreshBtn');
  const originalHTML = refreshBtn ? refreshBtn.innerHTML : '';
  
  // Show loading state on button
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Syncing...</span>';
    if (window.lucide) lucide.createIcons();
  }
  
  try {
    await fetchProduction();
    showToast('Production data refreshed successfully', 'success');
  } catch (error) {
    showToast('Failed to refresh production data', 'error');
  } finally {
    // Restore button
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalHTML;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-prod');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
      const modal = document.getElementById('prod-modal');
      if (modal && !modal.classList.contains('hidden')) {
        closeProdModal();
      }
    }
    
    // Ctrl/Cmd + R to refresh (prevent default browser refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      // Allow normal refresh, but we can add custom behavior if needed
    }
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
  const searchInput = document.getElementById('search-prod');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterProduction();
    });
    
    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterProduction();
      }
    });
  }
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
  
  try {
    fetchProduction();
  } catch (error) {
    console.error('Error initializing page:', error);
  }
  
  // Also set up scroll listener for any elements that come into view later
  onScroll();
  window.addEventListener('scroll', onScroll);
});
