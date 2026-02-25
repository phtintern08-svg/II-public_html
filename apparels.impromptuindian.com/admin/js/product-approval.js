// product-approval.js - Admin Product Approval Workflow
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

let products = [];
let filteredProducts = [];
let currentProductId = null;

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

// Animate decimal number (for cost price)
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
    const total = products.length;
    const pending = products.filter(p => p.status === 'pending').length;
    const approved = products.filter(p => p.status === 'approved').length;
    
    // Calculate average cost price
    const pendingProducts = products.filter(p => p.status === 'pending');
    let avgCost = 0;
    if (pendingProducts.length > 0) {
        const totalCost = pendingProducts.reduce((sum, p) => {
            return sum + (parseFloat(p.cost_price) || 0);
        }, 0);
        avgCost = totalCost / pendingProducts.length;
    }
    
    // Animate numbers
    const totalEl = document.querySelector('#total-products-count .summary-number');
    const pendingEl = document.querySelector('#pending-products-count .summary-number');
    const approvedEl = document.querySelector('#approved-products-count .summary-number');
    const avgCostEl = document.querySelector('#avg-cost-price .summary-number');
    
    if (totalEl) animateNumber(totalEl, total);
    if (pendingEl) animateNumber(pendingEl, pending);
    if (approvedEl) animateNumber(approvedEl, approved);
    if (avgCostEl) animateDecimal(avgCostEl, avgCost);
}

async function fetchProducts() {
    const grid = document.getElementById('products-grid');
    const loadingSpinner = document.getElementById('grid-loading');
    
    // Show loading state
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-400"></i>
                    </div>
                    <p class="text-gray-400">Loading products...</p>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/cart-products/pending', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        products = data.products || [];
        
        calculateSummary();
        filterProducts();
    } catch (e) {
        console.error(e);
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                        </div>
                        <p class="text-gray-400">Failed to load products</p>
                        <button onclick="fetchProducts()" class="btn-secondary mt-2">
                            <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Retry
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        showToast('Error loading products', 'error');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// Refresh products
function refreshProducts() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
    }
    fetchProducts().finally(() => {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i[data-lucide]');
            if (icon) {
                icon.style.animation = '';
            }
        }
    });
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const countDisplay = document.getElementById('products-count-display');
    
    if (!grid) return;
    
    grid.innerHTML = '';

    if (filteredProducts.length === 0) {
        const searchTerm = document.getElementById('search-product')?.value || '';
        
        let emptyMessage = '';
        let emptyIcon = 'inbox';
        
        if (products.length === 0) {
            emptyMessage = 'No pending products found';
            emptyIcon = 'inbox';
        } else if (searchTerm) {
            emptyMessage = 'No products match your search';
            emptyIcon = 'search-x';
        } else {
            emptyMessage = 'No pending products found';
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
                        ${products.length === 0 ? '' : '<p class="text-gray-500 text-sm">Try adjusting your search</p>'}
                    </div>
                    ${products.length === 0 ? '' : `
                        <button onclick="resetFilters()" class="btn-secondary">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Clear Search
                        </button>
                    `}
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        
        if (countDisplay) {
            countDisplay.textContent = '0 products';
        }
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'quotation-card reveal';
        
        // Safe parsing: ensure sizes and images are arrays
        let images = product.images || [];
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [];
            }
        }
        if (!Array.isArray(images)) {
            images = [];
        }
        
        let sizes = product.sizes || [];
        if (typeof sizes === 'string') {
            try {
                sizes = JSON.parse(sizes);
            } catch (e) {
                sizes = [];
            }
        }
        if (!Array.isArray(sizes)) {
            sizes = [];
        }
        
        const firstImage = images.length > 0 ? images[0] : null;
        
        card.innerHTML = `
            <div class="q-header">
                <div class="q-vendor-info">
                    <div class="q-vendor-name">${product.vendor_name || 'Unknown Vendor'}</div>
                    <div class="q-date">
                        <i data-lucide="calendar" class="w-3 h-3"></i>
                        ${product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                        <span class="q-commission-badge">${product.product_type || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            ${firstImage ? `
                <div class="q-file" style="padding: 0; margin-bottom: 12px;">
                    <img src="/api/uploads/${firstImage}" alt="${product.product_name}" 
                         class="w-full h-32 object-cover rounded-lg" 
                         onerror="this.src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'" />
                </div>
            ` : `
                <div class="q-file">
                    <div class="q-file-icon">
                        <i data-lucide="package" class="w-5 h-5"></i>
                    </div>
                    <div class="q-filename">No image</div>
                </div>
            `}
            
            <div style="padding: 0 16px; margin-bottom: 12px;">
                <div class="text-sm font-semibold text-white mb-1">${product.product_name || 'Unnamed Product'}</div>
                <div class="text-xs text-gray-400 mb-2 line-clamp-2">${product.description || 'No description'}</div>
                <div class="flex items-center justify-between">
                    <span class="text-yellow-400 font-semibold">₹${parseFloat(product.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <div class="flex flex-wrap gap-1">
                        ${sizes.slice(0, 3).map(size => `<span class="px-1.5 py-0.5 bg-gray-700 text-xs rounded">${size}</span>`).join('')}
                        ${sizes.length > 3 ? `<span class="px-1.5 py-0.5 bg-gray-700 text-xs rounded">+${sizes.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="q-actions">
                <span class="q-id">ID: #${product.id}</span>
                <button class="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20" onclick="openProductModal(${product.id})">
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
        const count = filteredProducts.length;
        const total = products.length;
        countDisplay.textContent = `${count} ${count === 1 ? 'product' : 'products'}${count !== total ? ` of ${total}` : ''}`;
    }
}

function filterProducts() {
    const searchInput = document.getElementById('search-product');
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
    
    filteredProducts = products.filter(product => {
        const matchTerm = 
            (product.product_name || '').toLowerCase().includes(term) ||
            (product.vendor_name || '').toLowerCase().includes(term) ||
            (product.product_type || '').toLowerCase().includes(term) ||
            (product.description || '').toLowerCase().includes(term) ||
            String(product.id || '').includes(term) ||
            String(product.vendor_id || '').includes(term);
        return matchTerm;
    });
    
    renderProducts();
}

function clearSearch() {
    const searchInput = document.getElementById('search-product');
    if (searchInput) {
        searchInput.value = '';
        filterProducts();
        searchInput.focus();
    }
}

function resetFilters() {
    clearSearch();
}

function openProductModal(id) {
    currentProductId = id;
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-vendor-name').textContent = product.vendor_name || 'Unknown Vendor';
    document.getElementById('modal-product-type').textContent = product.product_type || 'N/A';
    document.getElementById('modal-product-name').textContent = product.product_name || 'Unnamed Product';
    document.getElementById('modal-description').textContent = product.description || 'No description provided';
    document.getElementById('modal-cost-price').textContent = `₹${parseFloat(product.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('modal-remarks').value = '';

    // Render sizes
    const sizesContainer = document.getElementById('modal-sizes');
    if (sizesContainer) {
        let sizes = product.sizes || [];
        if (typeof sizes === 'string') {
            try {
                sizes = JSON.parse(sizes);
            } catch (e) {
                sizes = [];
            }
        }
        if (!Array.isArray(sizes)) {
            sizes = [];
        }
        if (sizes.length > 0) {
            sizesContainer.innerHTML = sizes.map(size => 
                `<span class="px-3 py-1.5 bg-gray-800 text-sm rounded-lg border border-gray-700">${size}</span>`
            ).join('');
        } else {
            sizesContainer.innerHTML = '<span class="text-gray-500 text-sm">No sizes specified</span>';
        }
    }

    // Render images
    const imagesContainer = document.getElementById('modal-images');
    if (imagesContainer) {
        let images = product.images || [];
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [];
            }
        }
        if (!Array.isArray(images)) {
            images = [];
        }
        if (images.length > 0) {
            imagesContainer.innerHTML = images.map(img => `
                <div class="relative group">
                    <img src="/api/uploads/${img}" alt="${product.product_name}" 
                         class="w-full h-32 object-cover rounded-lg border border-gray-700"
                         onerror="this.src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'" />
                    <a href="/api/uploads/${img}" target="_blank" 
                       class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <i data-lucide="zoom-in" class="w-6 h-6 text-white"></i>
                    </a>
                </div>
            `).join('');
        } else {
            imagesContainer.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No images available</div>';
        }
    }

    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    if (window.lucide) lucide.createIcons();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentProductId = null;
}

async function approveProduct() {
    if (!currentProductId) return;

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/cart-products/${currentProductId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({})
        });

        if (response.ok) {
            showToast('Product approved successfully');
            closeProductModal();
            fetchProducts();
        } else {
            const data = await response.json().catch(() => ({}));
            showToast(data.error || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error approving product', 'error');
    }
}

async function rejectProduct() {
    if (!currentProductId) return;

    const remarks = document.getElementById('modal-remarks').value;
    if (!remarks || remarks.trim().length === 0) {
        showToast('Please provide a rejection reason', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/cart-products/${currentProductId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ remarks: remarks.trim() })
        });

        if (response.ok) {
            showToast('Product rejected');
            closeProductModal();
            fetchProducts();
        } else {
            const data = await response.json().catch(() => ({}));
            showToast(data.error || 'Failed to reject', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting product', 'error');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-product');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('product-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeProductModal();
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
    // Role guard
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
        console.warn('Unauthorized access to admin page - redirecting to login');
        showToast('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return;
    }

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
    
    // Fetch products
    fetchProducts();
    
    // Add search input event listeners
    const searchInput = document.getElementById('search-product');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
});
