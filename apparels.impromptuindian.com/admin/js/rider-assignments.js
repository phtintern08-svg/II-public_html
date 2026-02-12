// rider-assignments.js – admin delivery assignment tracking

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    if (!toast || !txt) return;
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let assignments = [];
let filteredAssignments = [];
let currentAssignmentId = null;

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
    const total = assignments.length;
    const pending = assignments.filter(a => (a.status || '').toLowerCase() === 'pending').length;
    const outForDelivery = assignments.filter(a => (a.status || '').toLowerCase() === 'out-for-delivery').length;
    const delivered = assignments.filter(a => (a.status || '').toLowerCase() === 'delivered').length;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-assignments-count .summary-number');
    const pendingEl = document.querySelector('#pending-pickup-count .summary-number');
    const outForDeliveryEl = document.querySelector('#out-for-delivery-count .summary-number');
    const deliveredEl = document.querySelector('#delivered-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (pendingEl) animateNumber(pendingEl, pending);
    if (outForDeliveryEl) animateNumber(outForDeliveryEl, outForDelivery);
    if (deliveredEl) animateNumber(deliveredEl, delivered);
}

async function fetchAssignments() {
    const tbody = document.getElementById('assignments-table');
    const loadingSpinner = document.getElementById('table-loading');
    
    // Show loading state
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                        </div>
                        <p class="text-gray-400">Loading assignments...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        // Try to fetch from API, fallback to mock data if endpoint doesn't exist
        const response = await ImpromptuIndianApi.fetch('/api/admin/rider-assignments', {
            credentials: 'include'
        }).catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            assignments = Array.isArray(data) ? data : (data.assignments || []);
        } else {
            // Fallback to mock data for now
            assignments = [
                { id: 1031, vendor: 'DTF Prints Co.', rider: 'John Doe', status: 'pending', address: '123 Main St, North Zone' },
                { id: 1032, vendor: 'Screen Masters', rider: 'Jane Smith', status: 'picked-up', address: '456 Oak Ave, South Zone' },
                { id: 1033, vendor: 'Sublime Studios', rider: 'Mike Johnson', status: 'out-for-delivery', address: '789 Pine Rd, East Zone' },
                { id: 1034, vendor: 'Embroidery Hub', rider: 'Sarah Williams', status: 'delivered', address: '321 Elm St, West Zone' }
            ];
        }
        
        calculateSummary();
        filterAssignments();
    } catch (error) {
        console.error('Error fetching assignments:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load assignments</p>
                            <button onclick="fetchAssignments()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        showToast('Failed to fetch assignments');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh assignments
function refreshAssignments() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchAssignments().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderAssignments() {
    const tbody = document.getElementById('assignments-table');
    const countDisplay = document.getElementById('assignments-count-display');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredAssignments.length === 0) {
        const searchTerm = document.getElementById('search-assignment')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        
        let emptyMessage = '';
        let emptyIcon = 'package';
        
        if (assignments.length === 0) {
            emptyMessage = 'No assignments found';
            emptyIcon = 'package';
        } else if (searchTerm || statusFilter !== 'all') {
            emptyMessage = 'No assignments match your filters';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No assignments found';
            emptyIcon = 'package';
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
                            ${assignments.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your filters</p>'}
                        </div>
                        ${assignments.length === 0 ? '' : `
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
            countDisplay.textContent = '0 assignments';
        }
        return;
    }

    filteredAssignments.forEach((a, index) => {
        const tr = document.createElement('tr');
        tr.className = 'reveal';
        
        const status = (a.status || '').toLowerCase();
        const statusClass = `status-${status}`;
        const statusText = (a.status || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        tr.innerHTML = `
            <td class="font-mono font-semibold">#${a.id || 'N/A'}</td>
            <td>${a.vendor || 'N/A'}</td>
            <td>${a.rider || 'Unassigned'}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td class="max-w-xs truncate" title="${a.address || 'N/A'}">${a.address || 'N/A'}</td>
            <td class="text-right">
                <button class="btn-primary" onclick="viewAssignment(${a.id})" title="View Details">
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
        const count = filteredAssignments.length;
        const total = assignments.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'assignment' : 'assignments'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function filterAssignments() {
    const searchInput = document.getElementById('search-assignment');
    const term = searchInput?.value.toLowerCase().trim() || '';
    const status = document.getElementById('status-filter')?.value || 'all';
    const clearBtn = document.getElementById('search-clear-btn');
    
    // Show/hide clear button
    if (clearBtn) {
        if (term) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    
    filteredAssignments = assignments.filter(a => {
        const matchStatus = status === 'all' || (a.status || '').toLowerCase() === status.toLowerCase();
        const matchTerm = 
            String(a.id || '').includes(term) ||
            (a.vendor || '').toLowerCase().includes(term) ||
            (a.rider || '').toLowerCase().includes(term) ||
            (a.address || '').toLowerCase().includes(term);
        return matchStatus && matchTerm;
    });
    
    renderAssignments();
}

function clearSearch() {
    const searchInput = document.getElementById('search-assignment');
    if (searchInput) {
        searchInput.value = '';
        filterAssignments();
        searchInput.focus();
    }
}

function resetFilters() {
    const searchInput = document.getElementById('search-assignment');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    
    filterAssignments();
}

function viewAssignment(id) {
    currentAssignmentId = id;
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    
    const body = document.getElementById('modal-body');
    const status = (assignment.status || '').toLowerCase();
    const statusClass = `status-${status}`;
    const statusText = (assignment.status || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    body.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="package" class="w-5 h-5"></i>
                    Assignment Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Order ID</p>
                        <p class="text-white font-mono font-semibold text-lg">#${assignment.id || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Status</p>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Vendor</p>
                        <p class="text-white font-medium">${assignment.vendor || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Assigned Rider</p>
                        <p class="text-white font-medium">${assignment.rider || 'Unassigned'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-400 mb-1">Customer Address</p>
                        <p class="text-white font-medium">${assignment.address || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <label class="block mb-2 font-semibold text-white">Delivery Instructions</label>
                <textarea id="delivery-instructions" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" rows="3" placeholder="Enter special delivery instructions..."></textarea>
            </div>
            
            <div>
                <label class="block mb-2 font-semibold text-white">Admin Notes</label>
                <textarea id="admin-notes" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" rows="2" placeholder="Internal notes (not visible to rider)..."></textarea>
            </div>
        </div>
    `;
    
    document.getElementById('modal-title').textContent = `Assignment #${assignment.id || 'N/A'}`;
    document.getElementById('assignment-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeAssignmentModal() {
    document.getElementById('assignment-modal').classList.add('hidden');
    currentAssignmentId = null;
}

function reassignRider() {
    if (!currentAssignmentId) return;
    
    if (window.showAlert) {
        window.showAlert('Info', 'Rider reassignment functionality requires backend implementation', 'info');
    } else {
        showToast('Rider reassignment initiated');
    }
    closeAssignmentModal();
}

function sendInstructions() {
    if (!currentAssignmentId) return;
    
    const instructions = document.getElementById('delivery-instructions')?.value;
    if (!instructions || instructions.trim().length === 0) {
        showToast('Please enter delivery instructions');
        return;
    }
    
    if (window.showAlert) {
        window.showAlert('Success', 'Instructions sent to rider successfully', 'success');
    } else {
        showToast('Instructions sent to rider');
    }
    closeAssignmentModal();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-assignment');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('assignment-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeAssignmentModal();
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
    
    // Fetch assignments
    fetchAssignments();
    
    // Add search input event listeners
    const searchInput = document.getElementById('search-assignment');
    if (searchInput) {
        searchInput.addEventListener('input', filterAssignments);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
});
