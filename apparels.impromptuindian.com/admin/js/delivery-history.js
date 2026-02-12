// delivery-history.js – admin delivery tracking & analytics

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    if (!toast || !txt) return;
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let deliveries = [];
let filteredDeliveries = [];
let performanceChart = null;

// Animate number from 0 to target
function animateNumber(element, target, duration = 1000, suffix = '') {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (target - start) * easeOutQuart;
        
        if (suffix === 'h') {
            element.textContent = current.toFixed(1) + suffix;
        } else if (suffix === '') {
            element.textContent = Math.floor(current).toLocaleString();
        } else {
            element.textContent = current.toFixed(1) + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (suffix === 'h') {
                element.textContent = target.toFixed(1) + suffix;
            } else if (suffix === '') {
                element.textContent = Math.floor(target).toLocaleString();
            } else {
                element.textContent = target.toFixed(1) + suffix;
            }
        }
    }
    
    requestAnimationFrame(update);
}

// Calculate and update summary statistics
function calculateSummary() {
    const completed = deliveries.filter(d => (d.status || '').toLowerCase() === 'delivered').length;
    const failed = deliveries.filter(d => {
        const status = (d.status || '').toLowerCase();
        return status === 'failed' || status === 'returned';
    }).length;
    
    const completedDeliveries = deliveries.filter(d => d.deliveryTime > 0 && (d.status || '').toLowerCase() === 'delivered');
    const avgTime = completedDeliveries.length > 0 
        ? completedDeliveries.reduce((sum, d) => sum + (d.deliveryTime || 0), 0) / completedDeliveries.length 
        : 0;
    
    const ratedDeliveries = deliveries.filter(d => d.rating > 0 && (d.status || '').toLowerCase() === 'delivered');
    const avgRating = ratedDeliveries.length > 0 
        ? ratedDeliveries.reduce((sum, d) => sum + (d.rating || 0), 0) / ratedDeliveries.length 
        : 0;
    
    // Animate numbers
    const completedEl = document.querySelector('#completed-count .summary-number');
    const failedEl = document.querySelector('#failed-count .summary-number');
    const avgTimeEl = document.querySelector('#avg-time');
    const avgRatingEl = document.querySelector('#avg-rating .summary-number');
    
    if (completedEl) animateNumber(completedEl, completed);
    if (failedEl) animateNumber(failedEl, failed);
    if (avgTimeEl) {
        const timeNumber = avgTimeEl.querySelector('.summary-number');
        if (timeNumber) {
            animateNumber(timeNumber, avgTime, 1000, 'h');
        } else {
            animateNumber(avgTimeEl, avgTime, 1000, 'h');
        }
    }
    if (avgRatingEl) animateNumber(avgRatingEl, avgRating, 1000, '');
}

async function fetchDeliveries() {
    const tbody = document.getElementById('history-table');
    const loadingSpinner = document.getElementById('table-loading');
    
    // Show loading state
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                        </div>
                        <p class="text-gray-400">Loading delivery history...</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        // Try to fetch from API, fallback to mock data if endpoint doesn't exist
        const response = await ImpromptuIndianApi.fetch('/api/admin/delivery-history', {
            credentials: 'include'
        }).catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            deliveries = Array.isArray(data) ? data : (data.deliveries || []);
        } else {
            // Fallback to mock data for now
            deliveries = [
                { id: 1001, rider: 'John Doe', customer: 'Alice', deliveryTime: 2.5, status: 'delivered', rating: 4.5, feedback: 'Great service!' },
                { id: 1002, rider: 'Jane Smith', customer: 'Bob', deliveryTime: 3.0, status: 'delivered', rating: 5.0, feedback: 'Perfect delivery' },
                { id: 1003, rider: 'Mike Johnson', customer: 'Charlie', deliveryTime: 0, status: 'failed', rating: 0, feedback: 'Customer not available' },
                { id: 1004, rider: 'Sarah Williams', customer: 'David', deliveryTime: 1.8, status: 'delivered', rating: 4.8, feedback: 'Very fast' },
                { id: 1005, rider: 'John Doe', customer: 'Eve', deliveryTime: 0, status: 'returned', rating: 0, feedback: 'Wrong address' }
            ];
        }
        
        calculateSummary();
        filterHistory();
        renderPerformanceChart();
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-16">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            </div>
                            <p class="text-gray-400">Failed to load delivery history</p>
                            <button onclick="fetchDeliveries()" class="btn-secondary mt-2">
                                <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
        }
        showToast('Failed to fetch delivery history');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh deliveries
function refreshHistory() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchDeliveries().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderHistory() {
    const tbody = document.getElementById('history-table');
    const countDisplay = document.getElementById('history-count-display');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredDeliveries.length === 0) {
        const searchTerm = document.getElementById('search-history')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        const dateFrom = document.getElementById('date-from')?.value || '';
        const dateTo = document.getElementById('date-to')?.value || '';
        
        let emptyMessage = '';
        let emptyIcon = 'history';
        
        if (deliveries.length === 0) {
            emptyMessage = 'No delivery records found';
            emptyIcon = 'history';
        } else if (searchTerm || statusFilter !== 'all' || dateFrom || dateTo) {
            emptyMessage = 'No deliveries match your filters';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No delivery records found';
            emptyIcon = 'history';
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="${emptyIcon}" class="w-8 h-8 text-gray-500"></i>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 font-medium mb-1">${emptyMessage}</p>
                            ${deliveries.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your filters</p>'}
                        </div>
                        ${deliveries.length === 0 ? '' : `
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
            countDisplay.textContent = '0 records';
        }
        return;
    }

    filteredDeliveries.forEach((d, index) => {
        const tr = document.createElement('tr');
        tr.className = 'reveal';
        
        const status = (d.status || '').toLowerCase();
        const statusClass = `status-${status}`;
        const statusText = (d.status || '').charAt(0).toUpperCase() + (d.status || '').slice(1);
        
        tr.innerHTML = `
            <td class="font-mono font-semibold">#${d.id || 'N/A'}</td>
            <td>${d.rider || 'N/A'}</td>
            <td>${d.customer || 'N/A'}</td>
            <td>${d.deliveryTime > 0 ? d.deliveryTime + 'h' : 'N/A'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${d.rating > 0 ? '⭐ ' + d.rating.toFixed(1) : 'N/A'}</td>
            <td class="max-w-xs truncate" title="${d.feedback || 'N/A'}">${d.feedback || 'N/A'}</td>
            <td class="text-right">
                <button class="btn-primary" onclick="viewDetails(${d.id})" title="View Details">
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
        const count = filteredDeliveries.length;
        const total = deliveries.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'record' : 'records'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function filterHistory() {
    const searchInput = document.getElementById('search-history');
    const term = searchInput?.value.toLowerCase().trim() || '';
    const status = document.getElementById('status-filter')?.value || 'all';
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    const clearBtn = document.getElementById('search-clear-btn');
    
    // Show/hide clear button
    if (clearBtn) {
        if (term) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    
    filteredDeliveries = deliveries.filter(d => {
        const matchStatus = status === 'all' || (d.status || '').toLowerCase() === status.toLowerCase();
        const matchTerm = 
            String(d.id || '').includes(term) ||
            (d.customer || '').toLowerCase().includes(term) ||
            (d.rider || '').toLowerCase().includes(term);
        
        // Date filtering (if dates are provided)
        let matchDate = true;
        if (dateFrom || dateTo) {
            // This would need actual date fields in the data
            // For now, we'll just pass all if dates are provided
            matchDate = true;
        }
        
        return matchStatus && matchTerm && matchDate;
    });
    
    renderHistory();
}

function clearSearch() {
    const searchInput = document.getElementById('search-history');
    if (searchInput) {
        searchInput.value = '';
        filterHistory();
        searchInput.focus();
    }
}

function resetFilters() {
    const searchInput = document.getElementById('search-history');
    const statusFilter = document.getElementById('status-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    filterHistory();
}

function viewDetails(id) {
    const delivery = deliveries.find(d => d.id === id);
    if (!delivery) return;
    
    if (window.showAlert) {
        const details = `
Order ID: #${delivery.id}
Rider: ${delivery.rider || 'N/A'}
Customer: ${delivery.customer || 'N/A'}
Status: ${(delivery.status || '').charAt(0).toUpperCase() + (delivery.status || '').slice(1)}
Delivery Time: ${delivery.deliveryTime > 0 ? delivery.deliveryTime + 'h' : 'N/A'}
Rating: ${delivery.rating > 0 ? '⭐ ' + delivery.rating.toFixed(1) : 'N/A'}
Feedback: ${delivery.feedback || 'N/A'}
        `;
        window.showAlert('Delivery Details', details.trim(), 'info');
    } else {
        alert(`Delivery Details:\nOrder ID: ${delivery.id}\nRider: ${delivery.rider}\nCustomer: ${delivery.customer}\nStatus: ${delivery.status}\nRating: ${delivery.rating}\nFeedback: ${delivery.feedback}`);
    }
}

function exportHistory() {
    const dataToExport = filteredDeliveries.length > 0 ? filteredDeliveries : deliveries;
    
    let csv = 'Order ID,Rider,Customer,Delivery Time,Status,Rating,Feedback\n';
    dataToExport.forEach(d => {
        csv += `${d.id || 'N/A'},${d.rider || 'N/A'},${d.customer || 'N/A'},${d.deliveryTime > 0 ? d.deliveryTime + 'h' : 'N/A'},${d.status || 'N/A'},${d.rating > 0 ? d.rating.toFixed(1) : 'N/A'},${(d.feedback || 'N/A').replace(/,/g, ';')}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully');
}

function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Get unique riders and their delivery counts
    const riderStats = {};
    deliveries.filter(d => (d.status || '').toLowerCase() === 'delivered').forEach(d => {
        const rider = d.rider || 'Unknown';
        riderStats[rider] = (riderStats[rider] || 0) + 1;
    });
    
    const labels = Object.keys(riderStats);
    const data = Object.values(riderStats);
    
    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Deliveries Completed',
                data,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(148, 163, 184, 0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11,
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11,
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-history');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('search-history');
        if (searchInput && document.activeElement === searchInput) {
            clearSearch();
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
    
    // Fetch deliveries
    fetchDeliveries();
    
    // Add search input event listeners
    const searchInput = document.getElementById('search-history');
    if (searchInput) {
        searchInput.addEventListener('input', filterHistory);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
});
