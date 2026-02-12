// quotation-reviews.js - Admin Quotation Review Workflow
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

let submissions = [];
let filteredSubmissions = [];
let currentSubmissionId = null;

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
    const total = submissions.length;
    const pending = submissions.filter(s => (s.status || 'pending') === 'pending').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    
    // Calculate average commission rate
    const pendingSubs = submissions.filter(s => (s.status || 'pending') === 'pending');
    let avgCommission = 0;
    if (pendingSubs.length > 0) {
        const totalCommission = pendingSubs.reduce((sum, s) => {
            return sum + (parseFloat(s.proposed_commission_rate) || 0);
        }, 0);
        avgCommission = totalCommission / pendingSubs.length;
    }
    
    // Animate numbers
    const totalEl = document.querySelector('#total-submissions-count .summary-number');
    const pendingEl = document.querySelector('#pending-submissions-count .summary-number');
    const approvedEl = document.querySelector('#approved-submissions-count .summary-number');
    const avgCommissionEl = document.querySelector('#avg-commission-rate .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (pendingEl) animateNumber(pendingEl, pending);
    if (approvedEl) animateNumber(approvedEl, approved);
    if (avgCommissionEl) animateDecimal(avgCommissionEl, avgCommission);
}

async function fetchQuotations() {
    const grid = document.getElementById('quotations-grid');
    const loadingSpinner = document.getElementById('grid-loading');
    
    // Show loading state
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                    </div>
                    <p class="text-gray-400">Loading quotations...</p>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/quotation-submissions', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch submissions');
        submissions = await response.json();
        
        // Ensure status is normalized
        submissions = submissions.map(s => ({
            ...s,
            status: s.status || 'pending'
        }));
        
        calculateSummary();
        filterQuotations();
    } catch (e) {
        console.error(e);
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                        </div>
                        <p class="text-gray-400">Failed to load quotations</p>
                        <button onclick="fetchQuotations()" class="btn-secondary mt-2">
                            <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        showToast('Error loading quotations', 'error');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh quotations
function refreshQuotations() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchQuotations().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderQuotations() {
    const grid = document.getElementById('quotations-grid');
    const countDisplay = document.getElementById('quotations-count-display');
    
    if (!grid) return;
    
    grid.innerHTML = '';

    if (filteredSubmissions.length === 0) {
        const searchTerm = document.getElementById('search-vendor')?.value || '';
        
        let emptyMessage = '';
        let emptyIcon = 'inbox';
        
        if (submissions.length === 0) {
            emptyMessage = 'No quotation submissions found';
            emptyIcon = 'inbox';
        } else if (searchTerm) {
            emptyMessage = 'No quotations match your search';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No quotation submissions found';
            emptyIcon = 'inbox';
        }
        
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
                        ${submissions.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
                    </div>
                    ${submissions.length === 0 ? '' : `
                        <button onclick="resetFilters()" class="btn-secondary">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Clear Search
                        </button>
                    `}
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        
        if (countDisplay) {
            countDisplay.textContent = '0 quotations';
        }
        return;
    }

    filteredSubmissions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'quotation-card reveal';
        card.innerHTML = `
            <div class="q-header">
                <div class="q-vendor-info">
                    <div class="q-vendor-name">${sub.vendor_name || 'Unknown Vendor'}</div>
                    <div class="q-date">
                        <i data-lucide="calendar" class="w-3 h-3"></i>
                        ${sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'}
                        <span class="q-commission-badge">${sub.proposed_commission_rate || 0}% Comm.</span>
                    </div>
                </div>
            </div>
            
            <div class="q-file">
                <div class="q-file-icon">
                    <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                </div>
                <div class="q-filename" title="${sub.filename || 'No file'}">${sub.filename || 'No file'}</div>
            </div>
            
            <div class="q-actions">
                <span class="q-id">ID: #${sub.vendor_id || sub.id}</span>
                <button class="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20" onclick="openQuotationModal(${sub.id})">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    <span class="hidden sm:inline ml-1">Review</span>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (window.lucide) lucide.createIcons();
    
    // Trigger reveal animations
    setTimeout(() => {
        document.querySelectorAll('.quotation-card.reveal').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show');
            }, index * 50);
        });
    }, 100);
    
    if (countDisplay) {
        const count = filteredSubmissions.length;
        const total = submissions.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'quotation' : 'quotations'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function filterQuotations() {
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
    
    filteredSubmissions = submissions.filter(sub => {
        const matchTerm = 
            (sub.vendor_name || '').toLowerCase().includes(term) ||
            (sub.filename || '').toLowerCase().includes(term) ||
            String(sub.vendor_id || '').includes(term);
        return matchTerm;
    });
    
    renderQuotations();
}

function clearSearch() {
    const searchInput = document.getElementById('search-vendor');
    if (searchInput) {
        searchInput.value = '';
        filterQuotations();
        searchInput.focus();
    }
}

function resetFilters() {
    clearSearch();
}

function openQuotationModal(id) {
    currentSubmissionId = id;
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('modal-vendor-name').textContent = sub.vendor_name || 'Unknown Vendor';
    document.getElementById('modal-filename').textContent = sub.filename || 'No file';
    document.getElementById('modal-commission').value = sub.proposed_commission_rate || 0;
    document.getElementById('modal-remarks').value = '';

    // Set download link
    const downloadLink = document.getElementById('modal-download-link');
    if (downloadLink) {
        downloadLink.href = ImpromptuIndianApi.buildUrl(`/api/admin/quotation-submissions/${sub.id}/download`);
    }

    const modal = document.getElementById('quotation-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    if (window.lucide) lucide.createIcons();
}

function closeQuotationModal() {
    const modal = document.getElementById('quotation-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentSubmissionId = null;
}

async function approveQuotation() {
    if (!currentSubmissionId) return;

    const commission = document.getElementById('modal-commission').value;
    if (!commission || parseFloat(commission) < 0) {
        showToast('Please enter a valid commission rate', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/quotation-submissions/${currentSubmissionId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ commission_rate: commission })
        });

        if (response.ok) {
            showToast('Quotation approved & vendor activated');
            closeQuotationModal();
            fetchQuotations();
        } else {
            const data = await response.json().catch(() => ({}));
            showToast(data.error || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error approving quotation', 'error');
    }
}

async function rejectQuotation() {
    if (!currentSubmissionId) return;

    const remarks = document.getElementById('modal-remarks').value;
    if (!remarks || remarks.trim().length === 0) {
        showToast('Please provide a rejection reason', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/quotation-submissions/${currentSubmissionId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ remarks: remarks.trim() })
        });

        if (response.ok) {
            showToast('Quotation rejected');
            closeQuotationModal();
            fetchQuotations();
        } else {
            const data = await response.json().catch(() => ({}));
            showToast(data.error || 'Failed to reject', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting quotation', 'error');
    }
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
        const modal = document.getElementById('quotation-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeQuotationModal();
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
    
    // Fetch quotations
    fetchQuotations();
    
    // Add search input event listeners
    const searchInput = document.getElementById('search-vendor');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuotations);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
    
    // Setup download link to open in new tab (prevents page navigation)
    const downloadLink = document.getElementById('modal-download-link');
    if (downloadLink) {
        downloadLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (downloadLink.href && downloadLink.href !== '#') {
                window.open(downloadLink.href, '_blank');
            }
        });
    }
});
