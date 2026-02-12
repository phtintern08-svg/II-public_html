// rejected-riders.js

let rejectedRiders = [];
let filteredRejectedRiders = [];
let currentRiderId = null;

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
    const total = rejectedRiders.length;
    const reapplied = rejectedRiders.filter(r => r.reapplied === true).length;
    
    // Calculate riders rejected this month
    const now = new Date();
    const thisMonth = rejectedRiders.filter(r => {
        if (!r.submitted) return false;
        try {
            const submittedDate = new Date(r.submitted);
            return submittedDate.getMonth() === now.getMonth() && submittedDate.getFullYear() === now.getFullYear();
        } catch (e) {
            return false;
        }
    }).length;
    
    // Pending review (re-applied riders)
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

async function fetchRejectedRiders() {
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
                        <p class="text-gray-400">Loading rejected riders...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        // Fetch rejected riders from new endpoint (filtered by backend)
        const response = await ImpromptuIndianApi.fetch('/api/admin/riders?status=rejected', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch rejected riders');

        const data = await response.json();
        const all = data.riders || data || [];
        rejectedRiders = Array.isArray(all) ? all : [];
        
        // Ensure reapplied flag is set if needed
        rejectedRiders = rejectedRiders.map(r => ({
            ...r,
            reapplied: r.reapplied || false
        }));
        
        calculateSummary();
        filterRejected();
    } catch (e) {
        console.error('Error loading rejected riders', e);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load rejected riders</p>
                            <button onclick="fetchRejectedRiders()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        if (window.showAlert) window.showAlert('Error', 'Failed to load rejected riders', 'error');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh rejected riders
function refreshRejected() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchRejectedRiders().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderRejected(data) {
    const tbody = document.getElementById('rejected-table');
    const countDisplay = document.getElementById('rejected-count-display');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (data.length === 0) {
        const searchTerm = document.getElementById('search-rejected')?.value || '';
        
        let emptyMessage = '';
        let emptyIcon = 'x-circle';
        
        if (rejectedRiders.length === 0) {
            emptyMessage = 'No rejected riders found';
            emptyIcon = 'x-circle';
        } else if (searchTerm) {
            emptyMessage = 'No riders match your search';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No rejected riders found';
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
                            ${rejectedRiders.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
                        </div>
                        ${rejectedRiders.length === 0 ? '' : `
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
            countDisplay.textContent = '0 riders';
        }
        return;
    }

    data.forEach((r, index) => {
        const tr = document.createElement('tr');
        tr.className = 'reveal';
        tr.innerHTML = `
            <td>
                <div class="font-medium">${r.name || 'Unknown'}</div>
                <div class="text-xs text-gray-400">${r.email || ''}</div>
            </td>
            <td>${r.submitted || 'N/A'}</td>
            <td>
                <span class="rejection-reason" title="${r.adminRemarks || 'Reason not specified'}">
                    ${(r.adminRemarks || 'Reason not specified').length > 50 ? (r.adminRemarks || 'Reason not specified').substring(0, 50) + '...' : (r.adminRemarks || 'Reason not specified')}
                </span>
            </td>
            <td class="text-right">
                <button class="btn-primary" onclick="openReapplyModal(${r.id})" title="Review Re-application">
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
        const count = data.length;
        const total = rejectedRiders.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'rider' : 'riders'}${count !== total ? ` of ${total}` : ''}`;
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
    
    filteredRejectedRiders = rejectedRiders.filter(r => {
        const matchTerm = 
            (r.name || '').toLowerCase().includes(term) ||
            (r.email || '').toLowerCase().includes(term) ||
            (r.adminRemarks || '').toLowerCase().includes(term) ||
            (r.submitted || '').toLowerCase().includes(term);
        return matchTerm;
    });
    
    renderRejected(filteredRejectedRiders);
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

function openReapplyModal(id) {
    currentRiderId = id;
    const rider = rejectedRiders.find(r => r.id === id);
    if (!rider) return;
    
    const body = document.getElementById('reapply-body');

    body.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="user" class="w-5 h-5"></i>
                    Rider Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Name</p>
                        <p class="text-white font-medium">${rider.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Email</p>
                        <p class="text-white font-medium">${rider.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Submitted On</p>
                        <p class="text-white font-medium">${rider.submitted || 'N/A'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-400 mb-1">Previous Rejection Reason</p>
                        <span class="rejection-reason">${rider.adminRemarks || 'Reason not specified'}</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="file-text" class="w-5 h-5"></i>
                    Review Documents
                </h3>
                <p class="text-sm text-gray-400 mb-4">Check if the rider has re-uploaded corrected documents.</p>
                <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <p class="text-sm text-gray-400">Document review functionality can be extended here to show re-uploaded documents.</p>
                </div>
            </div>
            
            <div>
                <label class="block mb-2 font-semibold text-white">Admin Remarks</label>
                <textarea id="admin-feedback" class="w-full p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" rows="3" placeholder="Add notes about this re-application..."></textarea>
            </div>
        </div>
    `;

    document.getElementById('reapply-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeReapplyModal() {
    document.getElementById('reapply-modal').classList.add('hidden');
    currentRiderId = null;
}

async function approveReapply() {
    if (!currentRiderId) return;

    if (window.showAlert) {
        window.showAlert('Confirm Approval', 'Are you sure you want to approve this rider?', 'confirm', async () => {
            await performApprove();
        });
    } else {
        if (confirm('Approve this rider?')) {
            await performApprove();
        }
    }
}

async function performApprove() {
    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/riders/${currentRiderId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                status: 'verified',
                remarks: 'Approved after re-application'
            })
        });
        if (response.ok) {
            closeReapplyModal();
            fetchRejectedRiders();
            if (window.showAlert) window.showAlert('Success', 'Rider approved successfully', 'success');
            if (window.fetchSidebarCounts) window.fetchSidebarCounts();
        } else {
            const err = await response.json().catch(() => ({}));
            if (window.showAlert) window.showAlert('Error', err.error || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        if (window.showAlert) window.showAlert('Error', 'Network error occurred', 'error');
    }
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
    
    // Fetch rejected riders
    fetchRejectedRiders();
    
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
