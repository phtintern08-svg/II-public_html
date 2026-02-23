// Production Capacity Page - Made-to-Order
lucide.createIcons();

let capacityData = [];
let eligibleProducts = [];

const ImpromptuIndianApi = window.ImpromptuIndianApi || {
    fetch: (path, opts = {}) => fetch(path, { credentials: 'include', ...opts })
};

async function fetchCapacity() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/vendor/capacity');
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to load capacity');
        }
        const data = await res.json();
        capacityData = data.capacity || [];
        renderCapacityTable();
    } catch (e) {
        console.error(e);
        document.getElementById('capacity-table-body').innerHTML =
            `<tr><td colspan="5" class="text-center text-red-400 py-4">${e.message}</td></tr>`;
    }
}

async function fetchEligibleProducts() {
    try {
        const res = await ImpromptuIndianApi.fetch('/api/vendor/capacity/products');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        eligibleProducts = data.products || [];
        return eligibleProducts;
    } catch (e) {
        console.error(e);
        eligibleProducts = [];
        return [];
    }
}

function productLabel(p) {
    if (!p) return '-';
    const parts = [p.product_type, p.category, p.neck_type, p.fabric, p.size].filter(Boolean);
    return parts.join(' / ') || `Product #${p.id}`;
}

function renderCapacityTable() {
    const tbody = document.getElementById('capacity-table-body');
    const emptyEl = document.getElementById('capacity-empty');
    const cardEl = document.getElementById('capacity-card');

    if (capacityData.length === 0) {
        emptyEl.classList.remove('hidden');
        cardEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    cardEl.classList.remove('hidden');

    tbody.innerHTML = capacityData.map(c => `
        <tr>
            <td>
                <div class="font-medium">${productLabel(c)}</div>
                <span class="text-xs text-gray-500">#${c.product_catalog_id}</span>
            </td>
            <td><span class="stock-badge">${c.daily_capacity}</span> / day</td>
            <td>${c.max_bulk_capacity === 0 ? 'No limit' : c.max_bulk_capacity}</td>
            <td>${c.lead_time_days} days</td>
            <td class="text-right">
                <button class="action-btn mr-2" onclick="editCapacity(${c.product_catalog_id})" title="Edit">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button class="action-btn text-red-400 hover:text-red-300" onclick="deleteCapacity(${c.product_catalog_id})" title="Remove">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function openAddCapacityModal() {
    document.getElementById('modal-title').textContent = 'Add Production Capacity';
    document.getElementById('capacity-form').reset();
    document.getElementById('cap-product-id').value = '';
    document.getElementById('cap-product-select').disabled = false;

    const sel = document.getElementById('cap-product-select');
    sel.innerHTML = '<option value="">Select product...</option>' +
        eligibleProducts
            .filter(p => !capacityData.some(c => c.product_catalog_id === p.id))
            .map(p => `<option value="${p.id}">${productLabel(p)}</option>`)
            .join('');

    document.getElementById('capacity-modal').classList.remove('hidden');
    document.getElementById('capacity-modal').classList.add('flex');
}

function editCapacity(productCatalogId) {
    const c = capacityData.find(x => x.product_catalog_id === productCatalogId);
    if (!c) return;

    document.getElementById('modal-title').textContent = 'Edit Production Capacity';
    document.getElementById('cap-product-id').value = c.product_catalog_id;
    document.getElementById('cap-product-select').disabled = true;
    document.getElementById('cap-product-select').innerHTML = `<option value="${c.product_catalog_id}">${productLabel(c)}</option>`;
    document.getElementById('cap-daily').value = c.daily_capacity;
    document.getElementById('cap-max-bulk').value = c.max_bulk_capacity || 0;
    document.getElementById('cap-lead-time').value = c.lead_time_days || 3;

    document.getElementById('capacity-modal').classList.remove('hidden');
    document.getElementById('capacity-modal').classList.add('flex');
}

function closeCapacityModal() {
    document.getElementById('capacity-modal').classList.add('hidden');
    document.getElementById('capacity-modal').classList.remove('flex');
}

async function deleteCapacity(productCatalogId) {
    if (!confirm('Remove this capacity entry? You can add it again later.')) return;
    try {
        const res = await ImpromptuIndianApi.fetch(`/api/vendor/capacity/${productCatalogId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove');
        await fetchCapacity();
    } catch (e) {
        alert(e.message || 'Failed to remove capacity');
    }
}

document.getElementById('btn-add-capacity').addEventListener('click', openAddCapacityModal);

document.getElementById('capacity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('cap-product-id').value ||
        document.getElementById('cap-product-select').value;
    const daily = parseInt(document.getElementById('cap-daily').value, 10);
    const maxBulk = parseInt(document.getElementById('cap-max-bulk').value, 10) || 0;
    const leadTime = parseInt(document.getElementById('cap-lead-time').value, 10) || 3;

    if (!productId || daily < 1) {
        alert('Please select a product and enter daily capacity.');
        return;
    }

    try {
        const res = await ImpromptuIndianApi.fetch('/api/vendor/capacity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_catalog_id: parseInt(productId, 10),
                daily_capacity: daily,
                max_bulk_capacity: maxBulk,
                lead_time_days: leadTime
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to save');
        }
        closeCapacityModal();
        await fetchCapacity();
    } catch (e) {
        alert(e.message || 'Failed to save capacity');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await fetchEligibleProducts();
    await fetchCapacity();

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
