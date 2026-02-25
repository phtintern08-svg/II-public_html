// Production Capacity - Auto-populated from approved quotations
// Vendor Price = READ-ONLY. Vendor edits ONLY capacity.
lucide.createIcons();

let capacityRows = [];
let filters = { product_types: [], categories: [], sizes: [] };
let productTypes = []; // Store product types for dropdown

// Category map matching customer-side structure (from new-order.js)
// This ensures vendor products match customer selections exactly
const CATEGORY_MAP = {
    "T-Shirt": [
        "Regular Fit",
        "Oversized Fit",
        "Polo T-Shirt",
        "Full Sleeve"
    ],
    "Hoodie": [
        "Pullover Hoodie",
        "Zipper Hoodie",
        "Oversized Hoodie"
    ],
    "Jacket": [
        "Zipper Jacket",
        "Bomber Jacket",
        "Windcheater"
    ],
    "Sweatshirt": [
        "Crewneck Sweatshirt",
        "Oversized Sweatshirt",
        "Fleece Sweatshirt"
    ],
    "Cap": [
        "Baseball Cap",
        "Dad Cap",
        "Trucker Cap",
        "Snapback Cap"
    ],
    "Shirt": [
        "Formal Shirt",
        "Casual Shirt",
        "Oversized Shirt",
        "Checkered Shirt"
    ]
};

const ImpromptuIndianApi = window.ImpromptuIndianApi || {
    fetch: (path, opts = {}) => fetch(path, { credentials: 'include', ...opts })
};

function productLabel(row) {
    const parts = [row.product_type, row.category, row.neck_type, row.fabric].filter(Boolean);
    return parts.join(' / ') || `Product #${row.product_catalog_id}`;
}

async function fetchCapacity() {
    const productType = document.getElementById('filter-product-type')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const size = document.getElementById('filter-size')?.value || '';

    let url = '/api/vendor/capacity';
    const params = new URLSearchParams();
    if (productType) params.set('product_type', productType);
    if (category) params.set('category', category);
    if (size) params.set('size', size);
    if (params.toString()) url += '?' + params.toString();

    try {
        const res = await ImpromptuIndianApi.fetch(url);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();

        capacityRows = data.rows || [];
        filters = data.filters || { product_types: [], categories: [], sizes: [] };
        renderFilters();
        renderTable();
    } catch (e) {
        console.error(e);
        capacityRows = [];
        renderTable();
        document.getElementById('capacity-table-body').innerHTML =
            `<tr><td colspan="7" class="text-center text-red-400 py-4">Failed to load capacity</td></tr>`;
    }
}

function renderFilters() {
    const ptSelect = document.getElementById('filter-product-type');
    const catSelect = document.getElementById('filter-category');
    const sizeSelect = document.getElementById('filter-size');

    if (!ptSelect) return;

    const ptOpts = '<option value="">All</option>' + (filters.product_types || []).map(t => `<option value="${t}">${t}</option>`).join('');
    const catOpts = '<option value="">All</option>' + (filters.categories || []).map(c => `<option value="${c}">${c}</option>`).join('');
    const sizeOpts = '<option value="">All</option>' + (filters.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('');

    ptSelect.innerHTML = ptOpts;
    catSelect.innerHTML = catOpts;
    sizeSelect.innerHTML = sizeOpts;
}

function renderTable() {
    const tbody = document.getElementById('capacity-table-body');
    const emptyEl = document.getElementById('capacity-empty');
    const cardEl = document.getElementById('capacity-card');

    if (capacityRows.length === 0) {
        emptyEl.classList.remove('hidden');
        cardEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    cardEl.classList.remove('hidden');

    tbody.innerHTML = capacityRows.map(row => `
        <tr data-pcid="${row.product_catalog_id}">
            <td>
                <div class="font-medium text-sm">${productLabel(row)}</div>
            </td>
            <td><span class="font-semibold">${row.size || '-'}</span></td>
            <td>
                <span class="text-yellow-400 font-semibold" title="Read-only (set by admin)">₹${(row.quoted_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </td>
            <td>
                <input type="number" min="0" value="${row.daily_capacity || 0}" 
                    class="cap-daily w-24 px-2 py-1.5 bg-[#0f0f1a] border border-gray-600 rounded text-white text-sm" 
                    data-pcid="${row.product_catalog_id}" />
            </td>
            <td>
                <input type="number" min="0" value="${row.max_bulk_capacity || 0}" 
                    class="cap-max-bulk w-24 px-2 py-1.5 bg-[#0f0f1a] border border-gray-600 rounded text-white text-sm" 
                    placeholder="0=no limit" data-pcid="${row.product_catalog_id}" />
            </td>
            <td>
                <input type="number" min="1" value="${row.lead_time_days || 3}" 
                    class="cap-lead-time w-20 px-2 py-1.5 bg-[#0f0f1a] border border-gray-600 rounded text-white text-sm" 
                    data-pcid="${row.product_catalog_id}" />
            </td>
            <td class="text-right">
                <button class="btn-save btn-primary py-1.5 px-3 text-xs" data-pcid="${row.product_catalog_id}" title="Save capacity">
                    <i data-lucide="save" class="w-3.5 h-3.5 inline"></i> Save
                </button>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();

    // Bind Save buttons
    tbody.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', () => saveRow(parseInt(btn.dataset.pcid, 10)));
    });
}

async function saveRow(productCatalogId) {
    const row = document.querySelector(`tr[data-pcid="${productCatalogId}"]`);
    if (!row) return;

    const daily = parseInt(row.querySelector('.cap-daily')?.value || 0, 10);
    const maxBulk = parseInt(row.querySelector('.cap-max-bulk')?.value || 0, 10);
    const leadTime = parseInt(row.querySelector('.cap-lead-time')?.value || 3, 10);

    const btn = row.querySelector('.btn-save');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin inline"></i> Saving...';
        lucide.createIcons();
    }

    try {
        const res = await ImpromptuIndianApi.fetch('/api/vendor/capacity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_catalog_id: productCatalogId,
                daily_capacity: daily,
                max_bulk_capacity: maxBulk,
                lead_time_days: leadTime
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to save');
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 inline text-green-400"></i> Saved';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5 inline"></i> Save';
                lucide.createIcons();
            }, 1500);
        }
    } catch (e) {
        alert(e.message || 'Failed to save capacity');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5 inline"></i> Save';
            lucide.createIcons();
        }
    }
}

document.getElementById('btn-refresh')?.addEventListener('click', () => fetchCapacity());
document.getElementById('filter-product-type')?.addEventListener('change', () => fetchCapacity());
document.getElementById('filter-category')?.addEventListener('change', () => fetchCapacity());
document.getElementById('filter-size')?.addEventListener('change', () => fetchCapacity());

// ============================================================================
// TAB SWITCHING
// ============================================================================
function switchTab(tabName) {
    const stockSection = document.getElementById('section-stock');
    const productsSection = document.getElementById('section-products');
    const stockTab = document.getElementById('tab-stock');
    const productsTab = document.getElementById('tab-products');

    if (tabName === 'stock') {
        stockSection.classList.remove('hidden');
        productsSection.classList.add('hidden');
        stockTab.className = 'btn-primary px-4 py-2 rounded-lg font-medium transition-colors';
        productsTab.className = 'bg-[#0f0f1a] border border-gray-700 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-[#1a1a2e] transition-colors';
    } else {
        stockSection.classList.add('hidden');
        productsSection.classList.remove('hidden');
        stockTab.className = 'bg-[#0f0f1a] border border-gray-700 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-[#1a1a2e] transition-colors';
        productsTab.className = 'btn-primary px-4 py-2 rounded-lg font-medium transition-colors';
        loadVendorProducts();
    }
}

document.getElementById('tab-stock')?.addEventListener('click', () => switchTab('stock'));
document.getElementById('tab-products')?.addEventListener('click', () => switchTab('products'));

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================
let vendorProducts = [];

async function loadVendorProducts() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/vendor/cart-products');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        vendorProducts = data.products || [];
        renderProducts();
    } catch (e) {
        console.error(e);
        vendorProducts = [];
        renderProducts();
    }
}

function renderProducts() {
    const container = document.getElementById('vendor-products-list');
    const emptyEl = document.getElementById('products-empty');

    if (vendorProducts.length === 0) {
        container.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    container.innerHTML = vendorProducts.map(product => {
        const statusColors = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            approved: 'bg-green-500/20 text-green-400 border-green-500/30',
            rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        const statusColor = statusColors[product.status] || statusColors.pending;
        const images = product.images || [];
        const sizes = product.sizes || [];

        return `
            <div class="card border border-gray-700">
                <div class="card-body">
                    ${images.length > 0 ? `
                        <img src="/api/uploads/${images[0]}" alt="${product.product_name}" 
                             class="w-full h-48 object-cover rounded-lg mb-4" />
                    ` : `
                        <div class="w-full h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                            <i data-lucide="image" class="w-12 h-12 text-gray-600"></i>
                        </div>
                    `}
                    <h4 class="font-semibold text-lg mb-2">${product.product_name}</h4>
                    <p class="text-sm text-gray-400 mb-1">${product.product_type}${product.category ? ` • ${product.category}` : ''}</p>
                    <p class="text-sm text-gray-300 mb-3 line-clamp-2">${product.description || 'No description'}</p>
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-yellow-400 font-semibold">₹${parseFloat(product.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span class="px-2 py-1 rounded text-xs border ${statusColor}">
                            ${product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-2">
                        ${sizes.map(size => `<span class="px-2 py-1 bg-gray-800 text-xs rounded">${size}</span>`).join('')}
                    </div>
                    ${product.admin_remarks ? `
                        <div class="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                            <strong>Admin:</strong> ${product.admin_remarks}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// ============================================================================
// CREATE PRODUCT MODAL
// ============================================================================
document.getElementById('btn-create-product')?.addEventListener('click', () => {
    document.getElementById('create-product-modal').classList.remove('hidden');
    lucide.createIcons();
});

document.getElementById('cp-cancel')?.addEventListener('click', () => {
    document.getElementById('create-product-modal').classList.add('hidden');
    resetProductForm();
});

document.getElementById('cp-close')?.addEventListener('click', () => {
    document.getElementById('create-product-modal').classList.add('hidden');
    resetProductForm();
});

async function loadProductTypes() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/product-types');
        if (!res.ok) throw new Error('Failed to load product types');
        productTypes = await res.json();
        
        const select = document.getElementById('cp-product-type');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Product Type</option>';
        productTypes.forEach(pt => {
            const option = document.createElement('option');
            option.value = pt.id;
            option.textContent = pt.name;
            option.setAttribute('data-slug', pt.slug);
            option.setAttribute('data-name', pt.name); // Store name for category mapping
            select.appendChild(option);
        });
        
        // Add event listener for product type change to update category dropdown
        select.addEventListener('change', updateCategoryDropdown);
    } catch (e) {
        console.error('Failed to load product types:', e);
        // Fallback to hardcoded options if API fails
        const select = document.getElementById('cp-product-type');
        if (select) {
            select.innerHTML = `
                <option value="">Select Product Type</option>
                <option value="1" data-name="T-Shirt">T-Shirt</option>
                <option value="2" data-name="Hoodie">Hoodie</option>
                <option value="3" data-name="Sweatshirt">Sweatshirt</option>
                <option value="4" data-name="Jacket">Jacket</option>
                <option value="5" data-name="Cap">Cap</option>
                <option value="6" data-name="Shirt">Shirt</option>
            `;
            select.addEventListener('change', updateCategoryDropdown);
        }
    }
}

function updateCategoryDropdown() {
    const productTypeSelect = document.getElementById('cp-product-type');
    const categorySelect = document.getElementById('cp-category');
    
    if (!productTypeSelect || !categorySelect) return;
    
    const selectedOption = productTypeSelect.options[productTypeSelect.selectedIndex];
    const productTypeName = selectedOption.getAttribute('data-name') || selectedOption.textContent;
    
    // Clear category dropdown
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    // Enable/disable based on selection
    if (!productTypeSelect.value) {
        categorySelect.disabled = true;
        categorySelect.innerHTML = '<option value="">Select Product Type first</option>';
        return;
    }
    
    // Get categories for selected product type
    const categories = CATEGORY_MAP[productTypeName] || [];
    
    if (categories.length === 0) {
        categorySelect.disabled = true;
        categorySelect.innerHTML = '<option value="">No categories available</option>';
        return;
    }
    
    // Populate category dropdown
    categorySelect.disabled = false;
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function resetProductForm() {
    const productTypeSelect = document.getElementById('cp-product-type');
    const categorySelect = document.getElementById('cp-category');
    
    if (productTypeSelect && productTypeSelect.options.length > 0) {
        productTypeSelect.value = '';
    }
    if (categorySelect) {
        categorySelect.value = '';
        categorySelect.disabled = true;
        categorySelect.innerHTML = '<option value="">Select Product Type first</option>';
    }
    document.getElementById('cp-name').value = '';
    document.getElementById('cp-description').value = '';
    document.getElementById('cp-cost').value = '';
    document.querySelectorAll('#create-product-modal input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('cp-images').value = '';
}

document.getElementById('cp-submit')?.addEventListener('click', async () => {
    const productTypeId = document.getElementById('cp-product-type').value;
    const productTypeSelect = document.getElementById('cp-product-type');
    const selectedOption = productTypeSelect.options[productTypeSelect.selectedIndex];
    const productTypeName = selectedOption.getAttribute('data-name') || selectedOption.textContent;
    const category = document.getElementById('cp-category').value.trim();
    const name = document.getElementById('cp-name').value.trim();
    const desc = document.getElementById('cp-description').value.trim();
    const cost = parseFloat(document.getElementById('cp-cost').value);

    if (!productTypeId || !productTypeName || !category || !name || !cost || cost <= 0) {
        alert('Please fill in all required fields: product type, category, name, and valid cost price');
        return;
    }

    const sizeCheckboxes = document.querySelectorAll('#create-product-modal input[type="checkbox"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);

    if (sizes.length === 0) {
        alert('Please select at least one size');
        return;
    }

    const files = document.getElementById('cp-images').files;
    if (files.length === 0) {
        alert('Please upload at least one image');
        return;
    }

    const btn = document.getElementById('cp-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline"></i> Submitting...';
    lucide.createIcons();

    try {
        const formData = new FormData();
        formData.append('product_type_id', productTypeId);
        formData.append('product_type', productTypeName); // Send product type name for backward compatibility
        formData.append('category', category); // Category is required
        formData.append('product_name', name);
        formData.append('description', desc);
        formData.append('cost_price', cost);
        formData.append('sizes', JSON.stringify(sizes));

        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        const res = await ImpromptuIndianApi.fetch('/api/vendor/cart-products', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create product');
        }

        alert('Product submitted for admin approval');
        document.getElementById('create-product-modal').classList.add('hidden');
        resetProductForm();
        loadVendorProducts();
    } catch (e) {
        alert(e.message || 'Failed to create product');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        lucide.createIcons();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchCapacity();
    loadProductTypes(); // Load product types for dropdown
    loadVendorProducts(); // Load vendor's existing products

    const revealEls = document.querySelectorAll('.reveal');
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            if (el.getBoundingClientRect().top < trigger) el.classList.add('show');
        });
    }
    setTimeout(revealOnScroll, 100);
    window.addEventListener('scroll', revealOnScroll);
});
