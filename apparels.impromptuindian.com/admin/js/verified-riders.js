// verified-riders.js

function showToast(msg) {
    if (window.showAlert) {
        window.showAlert('Notification', msg, 'success');
    } else {
        alert(msg);
    }
}

let verifiedRiders = [];
let filteredRiders = [];
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
    const total = verifiedRiders.length;
    const online = verifiedRiders.filter(r => r.isOnline === true).length;
    
    // Calculate total deliveries
    const totalDeliveries = verifiedRiders.reduce((sum, r) => {
        return sum + (parseInt(r.totalDeliveries) || 0);
    }, 0);
    
    // Calculate riders joined this month
    const now = new Date();
    const thisMonth = verifiedRiders.filter(r => {
        if (!r.joinedDate) return false;
        try {
            const joinedDate = new Date(r.joinedDate);
            return joinedDate.getMonth() === now.getMonth() && joinedDate.getFullYear() === now.getFullYear();
        } catch (e) {
            return false;
        }
    }).length;
    
    // Animate numbers
    const totalEl = document.querySelector('#total-riders-count .summary-number');
    const onlineEl = document.querySelector('#online-riders-count .summary-number');
    const deliveriesEl = document.querySelector('#total-deliveries-count .summary-number');
    const monthlyEl = document.querySelector('#monthly-riders-count .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (onlineEl) animateNumber(onlineEl, online);
    if (deliveriesEl) animateNumber(deliveriesEl, totalDeliveries);
    if (monthlyEl) animateNumber(monthlyEl, thisMonth);
}

async function fetchVerifiedRiders() {
    const tbody = document.getElementById('riders-table');
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
                        <p class="text-gray-400">Loading verified riders...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/verified-riders', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch verified riders');

        const data = await response.json();
        verifiedRiders = Array.isArray(data) ? data : (data.riders || []);
        
        calculateSummary();
        filterRiders();
    } catch (e) {
        console.error('Error loading verified riders', e);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load verified riders</p>
                            <button onclick="fetchVerifiedRiders()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        if (window.showAlert) window.showAlert('Error', 'Failed to load verified riders', 'error');
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
    fetchVerifiedRiders().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderRiders(data) {
    const tbody = document.getElementById('riders-table');
    const countDisplay = document.getElementById('riders-count-display');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (data.length === 0) {
        const searchTerm = document.getElementById('search-rider')?.value || '';
        
        let emptyMessage = '';
        let emptyIcon = 'bike';
        
        if (verifiedRiders.length === 0) {
            emptyMessage = 'No verified riders found';
            emptyIcon = 'bike';
        } else if (searchTerm) {
            emptyMessage = 'No riders match your search';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No verified riders found';
            emptyIcon = 'bike';
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
                            ${verifiedRiders.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
                        </div>
                        ${verifiedRiders.length === 0 ? '' : `
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
            <td>${r.vehicleType || 'N/A'}</td>
            <td><span class="font-mono text-sm">${r.vehicleNumber || 'N/A'}</span></td>
            <td>${r.serviceZone || 'N/A'}</td>
            <td>
                <span class="status-${(r.status || 'active').toLowerCase()}">
                    ${r.isOnline ? '🟢 Online' : '⚫ Offline'}
                </span>
            </td>
            <td class="text-right">
                <button class="btn-secondary" onclick="openRiderModal(${r.id})" title="View Details">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    <span class="hidden sm:inline ml-1">Details</span>
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
        const total = verifiedRiders.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'rider' : 'riders'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function filterRiders() {
    const searchInput = document.getElementById('search-rider');
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
    
    filteredRiders = verifiedRiders.filter(r =>
        (r.name || '').toLowerCase().includes(term) ||
        (r.email || '').toLowerCase().includes(term) ||
        (r.serviceZone || '').toLowerCase().includes(term) ||
        (r.vehicleNumber || '').toLowerCase().includes(term)
    );
    
    renderRiders(filteredRiders);
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
    clearSearch();
}

function openRiderModal(id) {
    currentRiderId = id;
    const rider = verifiedRiders.find(r => r.id === id);
    if (!rider) return;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="user" class="w-5 h-5"></i>
                    Rider Profile
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
                        <p class="text-sm text-gray-400 mb-1">Phone</p>
                        <p class="text-white font-medium">${rider.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Joined Date</p>
                        <p class="text-white font-medium">${rider.joinedDate || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="bike" class="w-5 h-5"></i>
                    Service Details
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Vehicle Type</p>
                        <p class="text-white font-medium">${rider.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Vehicle Number</p>
                        <p class="text-white font-mono bg-gray-800/50 px-3 py-1.5 rounded border border-gray-700 inline-block">${rider.vehicleNumber || 'N/A'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-400 mb-1">Service Zone</p>
                        <p class="text-white font-medium">${rider.serviceZone || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <i data-lucide="bar-chart" class="w-5 h-5"></i>
                    Performance Stats
                </h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p class="text-2xl font-bold text-blue-400">${rider.totalDeliveries || 0}</p>
                        <p class="text-xs text-gray-400 mt-1">Total Deliveries</p>
                    </div>
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p class="text-2xl font-bold text-green-400">${rider.successfulDeliveries || 0}</p>
                        <p class="text-xs text-gray-400 mt-1">Successful</p>
                    </div>
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p class="text-2xl font-bold text-yellow-400">${rider.isOnline ? 'Online' : 'Offline'}</p>
                        <p class="text-xs text-gray-400 mt-1">Status</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-title').textContent = rider.name || 'Rider Details';
    document.getElementById('rider-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeRiderModal() {
    document.getElementById('rider-modal').classList.add('hidden');
    currentRiderId = null;
}

// Suspend/Reactivate would need backend support for state change
function suspendRider() {
    if (window.showAlert) {
        window.showAlert('Info', 'Suspend functionality requires backend implementation', 'info');
    } else {
        alert("Suspend functionality requires backend implementation");
    }
    closeRiderModal();
}

function reactivateRider() {
    if (window.showAlert) {
        window.showAlert('Info', 'Reactivate functionality requires backend implementation', 'info');
    } else {
        alert("Reactivate functionality requires backend implementation");
    }
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
    
    // Fetch verified riders
    fetchVerifiedRiders();
    
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
