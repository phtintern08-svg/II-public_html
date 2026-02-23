// Production Capacity - Auto-populated from approved quotations
// Vendor Price = READ-ONLY. Vendor edits ONLY capacity.
lucide.createIcons();

let capacityRows = [];
let filters = { product_types: [], categories: [], sizes: [] };

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

document.addEventListener('DOMContentLoaded', () => {
    fetchCapacity();

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
