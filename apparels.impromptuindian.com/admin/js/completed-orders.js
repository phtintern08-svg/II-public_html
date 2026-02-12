// completed-orders.js – admin view of delivered orders

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

// Global completed orders data
let completed = [];

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

// Animate currency value
function animateCurrency(element, target, duration = 1000) {
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
        const formatted = Math.floor(current).toLocaleString();
        element.textContent = `₹${formatted}`;
    }, 16);
}

// Animate time value
function animateTime(element, target, duration = 1000) {
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
        element.textContent = `${Math.floor(current)}h`;
    }, 16);
}

// Calculate summary statistics
function calculateSummary() {
    const total = completed.length;
    const totalRevenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalCommission = completed.reduce((sum, o) => sum + (o.commission || 0) + (o.penalty || 0), 0);
    const avgDelivery = completed.length > 0 
        ? completed.reduce((sum, o) => sum + (o.deliveryHours || 0), 0) / completed.length 
        : 0;

    const totalEl = document.getElementById('total-completed-count');
    const revenueEl = document.getElementById('total-revenue');
    const avgDeliveryEl = document.getElementById('avg-delivery');
    const commissionEl = document.getElementById('total-commission');

    if (totalEl) {
        const numberEl = totalEl.querySelector('.summary-number');
        if (numberEl) animateNumber(numberEl, total);
    }
    if (revenueEl) {
        const numberEl = revenueEl.querySelector('.summary-number');
        if (numberEl) {
            numberEl.textContent = `₹${totalRevenue.toLocaleString()}`;
        }
    }
    if (avgDeliveryEl) {
        const numberEl = avgDeliveryEl.querySelector('.summary-number');
        if (numberEl) animateTime(numberEl, avgDelivery);
    }
    if (commissionEl) {
        const numberEl = commissionEl.querySelector('.summary-number');
        if (numberEl) {
            numberEl.textContent = `₹${totalCommission.toLocaleString()}`;
        }
    }
}

async function fetchCompleted() {
    const tableLoading = document.getElementById('table-loading');
    const tbody = document.getElementById('completed-table');
    
    // Show loading state
    if (tableLoading) tableLoading.classList.remove('hidden');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12">
                    <div class="flex flex-col items-center gap-3">
                        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                        <p class="text-gray-400">Loading completed orders...</p>
                    </div>
                </td>
            </tr>
        `;
    }
    if (window.lucide) lucide.createIcons();
    
    try {
        // TODO: Replace with actual API endpoint when available
        // const response = await ImpromptuIndianApi.fetch('/api/admin/completed-orders');
        // if (!response.ok) throw new Error('Failed to fetch completed orders');
        // const data = await response.json();
        // completed = data.orders || data;
        
        // For now, use mock data
        completed = [
            { id: 1001, vendor: 'DTF Prints Co.', customer: 'Alice', deliveryHours: 48, amount: 500, commission: 75, penalty: 0 },
            { id: 1002, vendor: 'Screen Masters', customer: 'Bob', deliveryHours: 36, amount: 800, commission: 120, penalty: 20 },
            { id: 1003, vendor: 'Sublime Studios', customer: 'Charlie', deliveryHours: 60, amount: 650, commission: 97.5, penalty: 0 },
            { id: 1004, vendor: 'Embroidery Hub', customer: 'David', deliveryHours: 72, amount: 900, commission: 135, penalty: 50 }
        ];
        
        renderCompleted();
        calculateSummary();
        
        // Hide loading state
        if (tableLoading) tableLoading.classList.add('hidden');
    } catch (e) {
        console.error('Error fetching completed orders:', e);
        showToast('Failed to load completed orders', 'error');
        
        // Hide loading state and show error
        if (tableLoading) tableLoading.classList.add('hidden');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-12">
                        <div class="flex flex-col items-center gap-3">
                            <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            <p class="text-gray-400">Failed to load completed orders. Please try again.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (window.lucide) lucide.createIcons();
    }
}

function renderCompleted(ordersToRender = completed) {
    const tbody = document.getElementById('completed-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Handle empty state
    if (!ordersToRender || ordersToRender.length === 0) {
        const hasFilters = document.getElementById('date-from')?.value || 
                          document.getElementById('date-to')?.value ||
                          document.getElementById('search-completed')?.value.trim() !== '';
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-16 text-gray-400">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="check-circle" class="w-10 h-10 opacity-50"></i>
                        </div>
                        <div class="text-center">
                            <p class="text-xl font-semibold text-gray-300 mb-2">${hasFilters ? 'No matching orders' : 'No completed orders'}</p>
                            <p class="text-sm text-gray-500">${hasFilters ? 'Try adjusting your filters or search terms' : 'Delivered orders will appear here'}</p>
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

    ordersToRender.forEach(o => {
        const payout = (o.amount || 0) - (o.commission || 0) - (o.penalty || 0);
        const totalEarned = (o.commission || 0) + (o.penalty || 0);
        const orderId = o.id || `ORD-${o.db_id || 'N/A'}`;
        const vendorName = o.vendor || o.vendorName || 'Unknown';
        const customerName = o.customer || o.customerName || 'Unknown';
        const deliveryHours = o.deliveryHours || o.delivery_hours || 0;
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors duration-200';
        tr.innerHTML = `
            <td class="px-4 py-4 font-mono text-sm text-[#1273EB] font-semibold" data-label="Order ID">${orderId}</td>
            <td class="px-4 py-4 font-semibold text-gray-100" data-label="Vendor">
                <div class="flex items-center gap-2">
                    <i data-lucide="building" class="w-4 h-4 text-gray-500"></i>
                    <span class="truncate max-w-[150px]" title="${vendorName}">${vendorName}</span>
                </div>
            </td>
            <td class="px-4 py-4 font-semibold text-gray-100" data-label="Customer">
                <div class="flex items-center gap-2">
                    <i data-lucide="user" class="w-4 h-4 text-gray-500"></i>
                    <span>${customerName}</span>
                </div>
            </td>
            <td class="px-4 py-4" data-label="Delivery Time">
                <div class="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-blue-400"></i>
                    ${deliveryHours}h
                </div>
            </td>
            <td class="px-4 py-4 font-mono font-semibold text-green-400" data-label="Vendor Payout">₹${payout.toLocaleString()}</td>
            <td class="px-4 py-4 font-mono font-semibold text-blue-400" data-label="Commission">₹${(o.commission || 0).toLocaleString()}</td>
            <td class="px-4 py-4 font-mono font-semibold ${o.penalty > 0 ? 'text-red-400' : 'text-gray-500'}" data-label="Penalty">₹${(o.penalty || 0).toLocaleString()}</td>
            <td class="px-4 py-4 font-mono font-bold text-[#FFCC00] text-right" data-label="Total Earned">₹${totalEarned.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function filterCompleted() {
    const term = document.getElementById('search-completed').value.toLowerCase();
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const clearBtn = document.getElementById('search-clear-btn');
    
    // Show/hide clear button
    if (term && clearBtn) {
        clearBtn.classList.remove('hidden');
    } else if (clearBtn) {
        clearBtn.classList.add('hidden');
    }
    
    let filtered = completed.filter(o => {
        const orderId = (o.id || '').toString().toLowerCase();
        const customerName = (o.customer || o.customerName || '').toLowerCase();
        const vendorName = (o.vendor || o.vendorName || '').toLowerCase();
        
        const matchesSearch = orderId.includes(term) || customerName.includes(term) || vendorName.includes(term);
        
        // If date filters are set, filter by date range (mock: using order ID as date proxy for demo)
        // In real implementation, you would compare with actual order date
        if (dateFrom || dateTo) {
            // For demo purposes, we'll just show all if date is selected
            // In production, you'd compare: 
            // if (dateFrom && order.date < dateFrom) return false;
            // if (dateTo && order.date > dateTo) return false;
            return matchesSearch;
        }
        
        return matchesSearch;
    });
    
    // Update order count display
    const countDisplay = document.getElementById('completed-count-display');
    if (countDisplay) {
        const count = filtered.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'order' : 'orders'}`;
    }
    
    renderCompleted(filtered);
}

function clearSearch() {
    const searchInput = document.getElementById('search-completed');
    if (searchInput) {
        searchInput.value = '';
        filterCompleted();
        searchInput.focus();
    }
}

function resetFilters() {
    const searchInput = document.getElementById('search-completed');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (searchInput) searchInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    filterCompleted();
}

function exportCSV() {
    let csv = 'Order ID,Vendor,Customer,Delivery Hours (hrs),Vendor Payout,Commission,Penalty,Total Earned\n';
    completed.forEach(o => {
        const payout = (o.amount || 0) - (o.commission || 0) - (o.penalty || 0);
        const earned = (o.commission || 0) + (o.penalty || 0);
        csv += `${o.id || 'N/A'},${o.vendor || o.vendorName || 'Unknown'},${o.customer || o.customerName || 'Unknown'},${o.deliveryHours || 0},₹${payout},₹${o.commission || 0},₹${o.penalty || 0},₹${earned}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    const labels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'];
    const data = [1200, 1500, 1800, 2100, 2500, 3000, 3500];
    
    // Destroy existing chart if it exists
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }
    
    window.revenueChartInstance = new Chart(canvas, {
        type: 'line',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Revenue (₹)', 
                data, 
                borderColor: '#2563eb', 
                backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }] 
        },
        options: { 
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { 
                    labels: { 
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    } 
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            }, 
            scales: { 
                x: { 
                    ticks: { 
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }, 
                y: { 
                    ticks: { 
                        color: '#94a3b8',
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                } 
            } 
        }
    });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-completed');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
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
    const searchInput = document.getElementById('search-completed');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterCompleted();
        });
        
        // Handle Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterCompleted();
            }
        });
    }
    
    // Set max date to today (blocks future dates) for both date inputs
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Function to open date picker
    function openDatePicker(input) {
        if (input && typeof input.showPicker === 'function') {
            try {
                input.showPicker();
            } catch (e) {
                // Fallback: focus and click if showPicker is not supported
                input.focus();
                input.click();
            }
        } else {
            // Fallback for older browsers
            input.focus();
            input.click();
        }
    }
    
    if (dateFrom) {
        dateFrom.setAttribute('max', todayString);
        // Make calendar icon clickable
        const dateFromIcon = dateFrom.parentElement.querySelector('.date-filter-icon');
        if (dateFromIcon) {
            dateFromIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openDatePicker(dateFrom);
            });
        }
        // Also open on input focus
        dateFrom.addEventListener('focus', function() {
            openDatePicker(this);
        });
    }
    
    if (dateTo) {
        dateTo.setAttribute('max', todayString);
        // Make calendar icon clickable
        const dateToIcon = dateTo.parentElement.querySelector('.date-filter-icon');
        if (dateToIcon) {
            dateToIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openDatePicker(dateTo);
            });
        }
        // Also open on input focus
        dateTo.addEventListener('focus', function() {
            openDatePicker(this);
        });
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    try {
        fetchCompleted();
        renderRevenueChart();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
    
    // Also set up scroll listener for any elements that come into view later
    onScroll();
    window.addEventListener('scroll', onScroll);
});
