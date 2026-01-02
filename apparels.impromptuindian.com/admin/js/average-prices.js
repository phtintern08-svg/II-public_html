lucide.createIcons();

const ThreadlyApi = window.ThreadlyApi || (() => {
    const base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
    return {
        baseUrl: base,
        fetch: (path, options = {}) => fetch(`${base}${path}`, options),
    };
})();

let allPrices = [];
let filteredPrices = [];

/* ---------------------------
   Fetch Statistics
---------------------------*/
async function fetchStats() {
    try {
        const response = await ThreadlyApi.fetch('/admin/quotations/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();

        document.getElementById('totalQuotations').textContent = stats.total_quotations || 0;
        document.getElementById('totalVendors').textContent = stats.total_vendors_with_quotations || 0;
        document.getElementById('pendingSubmissions').textContent = stats.pending_submissions || 0;
        document.getElementById('approvedSubmissions').textContent = stats.approved_submissions || 0;

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

/* ---------------------------
   Fetch Average Prices
---------------------------*/
async function fetchAveragePrices() {
    try {
        const response = await ThreadlyApi.fetch('/admin/average-prices');
        if (!response.ok) throw new Error('Failed to fetch prices');

        allPrices = await response.json();
        filteredPrices = [...allPrices];
        renderPricesTable();

    } catch (error) {
        console.error('Error fetching prices:', error);
        document.getElementById('pricesTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-red-500">
                    Error loading prices: ${error.message}
                </td>
            </tr>
        `;
    }
}

/* ---------------------------
   Render Prices Table
---------------------------*/
function renderPricesTable() {
    const tbody = document.getElementById('pricesTableBody');

    if (filteredPrices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    No pricing data available
                </td>
            </tr>
        `;
        return;
    }

    const html = filteredPrices.map(item => `
        <tr class="border-b border-gray-800 hover:bg-gray-800/50">
            <td class="py-3 px-4">
                <span class="font-medium">${item.product_type}</span>
            </td>
            <td class="py-3 px-4">${item.category}</td>
            <td class="py-3 px-4">
                <span class="text-gray-400">${item.neck_type || 'Any'}</span>
            </td>
            <td class="py-3 px-4 text-right">
                <span class="text-green-400 font-bold">₹${item.average_price}</span>
            </td>
            <td class="py-3 px-4 text-right">
                <span class="text-blue-400">₹${item.min_price}</span>
            </td>
            <td class="py-3 px-4 text-right">
                <span class="text-yellow-400">₹${item.max_price}</span>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full text-sm">
                    ${item.vendor_count}
                </span>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    lucide.createIcons();
}

/* ---------------------------
   Apply Filters
---------------------------*/
function applyFilters() {
    const productType = document.getElementById('filterProductType').value.toLowerCase();
    const category = document.getElementById('filterCategory').value.toLowerCase();

    filteredPrices = allPrices.filter(item => {
        const matchProduct = !productType || item.product_type.toLowerCase().includes(productType);
        const matchCategory = !category || item.category.toLowerCase().includes(category);
        return matchProduct && matchCategory;
    });

    renderPricesTable();
}

/* ---------------------------
   Refresh Prices
---------------------------*/
async function refreshPrices() {
    const btn = event.target.closest('button');
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Refreshing...';
    btn.disabled = true;
    lucide.createIcons();

    await fetchAveragePrices();
    await fetchStats();

    btn.innerHTML = oldHTML;
    btn.disabled = false;
    lucide.createIcons();
}

/* ---------------------------
   Initialize
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchAveragePrices();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        fetchAveragePrices();
        fetchStats();
    }, 30000);
});
