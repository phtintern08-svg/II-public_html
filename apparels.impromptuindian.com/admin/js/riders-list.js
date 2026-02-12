// riders-list.js – admin rider management

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    if (!toast || !txt) return;
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let riders = [];
let filteredRiders = [];

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
    const total = riders.length;
    const active = riders.filter(r => (r.verification_status || '').toLowerCase() === 'active').length;
    const pending = riders.filter(r => {
        const status = (r.verification_status || '').toLowerCase();
        return status === 'verification_submitted' || status === 'pending_verification';
    }).length;
    
    // Calculate unique zones
    const zones = new Set(riders.map(r => r.service_zone).filter(z => z));
    const zonesCount = zones.size;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-riders-count .summary-number');
    const activeEl = document.querySelector('#active-riders-count .summary-number');
    const pendingEl = document.querySelector('#pending-riders-count .summary-number');
    const zonesEl = document.querySelector('#zones-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (activeEl) animateNumber(activeEl, active);
    if (pendingEl) animateNumber(pendingEl, pending);
    if (zonesEl) animateNumber(zonesEl, zonesCount);
}

async function fetchRiders() {
    const tbody = document.getElementById('riders-table');
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
                        <p class="text-gray-400">Loading riders...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/riders', {
            credentials: 'include'
        });
        if (response.ok) {
            let allRiders = await response.json();
            // Filter to show only approved (active) riders as requested
            riders = Array.isArray(allRiders) ? allRiders.filter(r => r.verification_status === 'active') : [];
            
            calculateSummary();
            filterRiders();
        } else {
            throw new Error('Failed to fetch riders');
        }
    } catch (error) {
        console.error('Error fetching riders:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load riders</p>
                            <button onclick="fetchRiders()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        showToast('Failed to fetch riders');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh riders
function refreshRiders() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchRiders().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderRiders() {
    const tbody = document.getElementById('riders-table');
    const countDisplay = document.getElementById('riders-count-display');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredRiders.length === 0) {
        const searchTerm = document.getElementById('search-rider')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        
        let emptyMessage = '';
        let emptyIcon = 'users';
        
        if (riders.length === 0) {
            emptyMessage = 'No riders found';
            emptyIcon = 'users';
        } else if (searchTerm || statusFilter !== 'all') {
            emptyMessage = 'No riders match your filters';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No riders found';
            emptyIcon = 'users';
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
                            ${riders.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your filters</p>'}
                        </div>
                        ${riders.length === 0 ? '' : `
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
            countDisplay.textContent = '0 riders';
        }
        return;
    }

    filteredRiders.forEach((r, index) => {
        const tr = document.createElement('tr');
        tr.className = 'reveal';

        let actions = '';
        if (r.verification_status === 'verification_submitted' || r.verification_status === 'pending_verification') {
            actions += `<button class="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded mr-2 transition" onclick="approveRider(${r.id})" title="Approve">
                <i data-lucide="check" class="w-4 h-4"></i>
            </button>`;
        }
        actions += `<button class="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition" onclick="editRider(${r.id})" title="Edit">
            <i data-lucide="edit" class="w-4 h-4"></i>
        </button>`;

        // Status styling
        const status = (r.verification_status || '').toLowerCase();
        let statusClass = 'status-active';
        if (status === 'offline') statusClass = 'status-offline';
        else if (status === 'suspended') statusClass = 'status-suspended';
        else if (status === 'verification_submitted' || status === 'pending_verification') statusClass = 'status-pending_verification';

        tr.innerHTML = `
            <td class="py-3 px-4">
                <div class="font-medium">${r.name || 'Unknown'}</div>
                ${r.email ? `<div class="text-xs text-gray-400">${r.email}</div>` : ''}
            </td>
            <td class="py-3 px-4">${r.service_zone || '-'}</td>
            <td class="py-3 px-4">
                <span class="${statusClass}">${formatStatus(r.verification_status)}</span>
            </td>
            <td class="py-3 px-4 text-right">${actions}</td>
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
        const count = filteredRiders.length;
        const total = riders.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'rider' : 'riders'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function formatStatus(status) {
    if (!status) return 'Unknown';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function filterRiders() {
    const searchInput = document.getElementById('search-rider');
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

    filteredRiders = riders.filter(r => {
        const matchTerm = 
            (r.name || '').toLowerCase().includes(term) || 
            (r.service_zone || '').toLowerCase().includes(term) ||
            (r.email || '').toLowerCase().includes(term);
        const matchStatus = statusFilter === 'all' || (r.verification_status || '').toLowerCase() === statusFilter.toLowerCase();
        return matchTerm && matchStatus;
    });

    renderRiders();
}

function clearSearch() {
    const searchInput = document.getElementById('search-rider');
    if (searchInput) {
        searchInput.value = '';
        filterRiders();
        searchInput.focus();
    }
}

function resetFilters() {
    const searchInput = document.getElementById('search-rider');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    
    filterRiders();
}

async function approveRider(id) {
    if (window.showAlert) {
        window.showAlert('Confirm Approval', 'Are you sure you want to approve this rider?', 'confirm', async () => {
            await performApprove(id);
        });
    } else {
        if (!confirm('Are you sure you want to approve this rider?')) return;
        await performApprove(id);
    }
}

async function performApprove(id) {
    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/riders/${id}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                status: 'verified',
                remarks: 'Approved by admin'
            })
        });
        if (response.ok) {
            showToast('Rider approved successfully');
            fetchRiders();
            if (window.fetchSidebarCounts) window.fetchSidebarCounts();
        } else {
            const err = await response.json().catch(() => ({}));
            showToast(err.error || 'Failed to approve rider');
        }
    } catch (error) {
        console.error('Error approving rider:', error);
        showToast('Network error');
    }
}

function openAddRiderModal() {
    document.getElementById('rider-name').value = '';
    document.getElementById('rider-zone').value = '';
    document.getElementById('rider-status').value = 'active';
    document.getElementById('modal-title').textContent = 'Add New Rider';
    document.getElementById('rider-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function editRider(id) {
    const rider = riders.find(r => r.id === id);
    if (!rider) return;

    document.getElementById('rider-name').value = rider.name || '';
    document.getElementById('rider-zone').value = rider.service_zone || '';
    document.getElementById('rider-status').value = rider.verification_status || 'active';
    document.getElementById('modal-title').textContent = 'Edit Rider';
    document.getElementById('rider-modal').classList.remove('hidden');
    // Store ID for save
    document.getElementById('rider-modal').dataset.riderId = id;
    if (window.lucide) lucide.createIcons();
}

function closeRiderModal() {
    document.getElementById('rider-modal').classList.add('hidden');
    delete document.getElementById('rider-modal').dataset.riderId;
}

async function saveRider() {
    // This is a placeholder for save functionality. 
    // Implementing full edit/add would require more backend endpoints.
    // For now, we'll just close the modal.
    showToast('Save functionality not fully implemented yet');
    closeRiderModal();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-rider');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('rider-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeRiderModal();
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
    
    // Fetch riders
    fetchRiders();
    
    // Add search input event listeners
    const searchInput = document.getElementById('search-rider');
    if (searchInput) {
        searchInput.addEventListener('input', filterRiders);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
});
