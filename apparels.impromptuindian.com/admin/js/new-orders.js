// new-orders.js – admin escrow order management (mock)
// ImpromptuIndianApi is provided by sidebar.js

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

// Mock escrow orders
let orders = [];
let approvedVendors = [];

async function fetchApprovedVendors() {
  try {
    const token = localStorage.getItem('token');
    const response = await ImpromptuIndianApi.fetch('/api/admin/vendors?status=verified', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch vendors');
    const data = await response.json();
    approvedVendors = data.vendors || data;
    console.log('Approved vendors fetched:', approvedVendors);
  } catch (e) {
    console.error('Failed to fetch approved vendors', e);
    showToast('Failed to load vendors', 'error');
  }
}

async function fetchOrders() {
  try {
    const token = localStorage.getItem('token');
    const response = await ImpromptuIndianApi.fetch('/api/orders/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const responseData = await response.json();
    const data = responseData.orders || responseData;

    const productionStatuses = ['assigned', 'accepted', 'material_prep', 'printing', 'quality_check', 'packed'];

    orders = data
      .filter(o => !productionStatuses.includes(o.status.toLowerCase()))
      .map(o => ({
        id: o.id,
        customer: o.customer ? o.customer.username : 'Unknown',
        type: o.product_type,
        qty: o.quantity,
        amount: o.sample_cost || 0,  // UPDATED: Show sample cost paid, not bulk estimate
        deadline: o.delivery_date || 'No deadline',
        // Map all pre-production statuses to 'unassigned' for the main filter
        status: ['pending_admin_review', 'pending', 'sample_payment_received', 'awaiting_sample_payment'].includes(o.status.toLowerCase()) ? 'unassigned' : o.status.toLowerCase(),
        details: [o.color, o.neck_type, o.fabric, o.print_type].filter(Boolean).join(', '),
        address: `${o.address_line1}, ${o.city}`,
        urgent: false,
        vendor: null
      }));

    filterOrders();
    calculateSummary();
  } catch (e) {
    console.error('Failed to fetch orders', e);
    showToast('Failed to load orders', 'error');
  }
}

let currentOrderId = null;

function calculateSummary() {
  const total = orders.length;
  const unassigned = orders.filter(o => o.status === 'unassigned').length;
  const escrow = orders.reduce((sum, o) => sum + o.amount, 0);
  const urgent = orders.filter(o => o.urgent).length;

  document.getElementById('total-orders').textContent = total;
  document.getElementById('unassigned-orders').textContent = unassigned;
  document.getElementById('escrow-amount').textContent = `₹${escrow.toLocaleString()}`;
  document.getElementById('urgent-orders').textContent = urgent;
}

function renderOrders(ordersToRender = orders) {
  const tbody = document.getElementById('orders-table');
  tbody.innerHTML = '';
  ordersToRender.forEach(o => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/5 transition-colors duration-200';
    tr.innerHTML = `
      <td class="px-4 py-4 font-mono text-sm text-[#1273EB]" data-label="Order ID">#${o.id}</td>
      <td class="px-4 py-4" data-label="Customer">
        <div class="flex flex-col">
          <span class="font-semibold text-gray-100">${o.customer}</span>
          <span class="text-xs text-gray-500 font-medium truncate max-w-[150px]">${o.address}</span>
        </div>
      </td>
      <td class="px-4 py-4" data-label="Apparel Type">
        <span class="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">${o.type}</span>
      </td>
      <td class="px-4 py-4" data-label="Qty">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-gray-200">${o.qty}</span>
          <span class="text-xs text-gray-500">pcs</span>
        </div>
      </td>
      <td class="px-4 py-4 font-bold text-yellow-400" data-label="Amount">₹${o.amount > 0 ? o.amount.toLocaleString() : '—'}</td>
      <td class="px-4 py-4" data-label="Deadline">
        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-400"></i>
          ${o.deadline}
        </div>
      </td>
      <td class="px-4 py-4" data-label="Status">
        <span class="status-${o.status} shadow-sm">${o.status}</span>
      </td>
      <td class="px-4 py-4 text-right" data-label="Actions">
        <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" onclick="openOrderModal(${o.id})">
          <i data-lucide="external-link" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterOrders() {
  const status = document.getElementById('status-filter').value;
  const term = document.getElementById('search-order').value.toLowerCase();
  const filtered = orders.filter(o => {
    const matchStatus = status === 'all' || o.status === status;
    const matchTerm = o.id.toString().includes(term) || o.customer.toLowerCase().includes(term);
    return matchStatus && matchTerm;
  });
  renderOrders(filtered);
}

async function openOrderModal(id) {
  currentOrderId = id;
  const order = orders.find(o => o.id === id);
  const body = document.getElementById('modal-body');

  // Fetch latest vendors before rendering
  await fetchApprovedVendors();

  body.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-6">
        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="info" class="w-4 h-4"></i> Core Information
          </h3>
          <div class="grid grid-cols-2 gap-y-4 text-sm">
            <div class="text-gray-500">Order ID</div>
            <div class="font-mono text-blue-300">#${order.id}</div>
            
            <div class="text-gray-500">Customer</div>
            <div class="font-semibold text-gray-100">${order.customer}</div>
            
            <div class="text-gray-500">Quantity</div>
            <div class="font-bold text-gray-100">${order.qty} <span class="text-xs text-gray-500 font-normal ml-1">Pieces</span></div>
            
            <div class="text-gray-500">Sample Paid</div>
            <div class="font-bold text-yellow-400">₹${order.amount > 0 ? order.amount.toLocaleString() : '—'}</div>

            <div class="text-gray-500">Deadline</div>
            <div class="flex items-center gap-2 text-blue-200">
               <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
               ${order.deadline}
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-yellow-400 mb-4 uppercase tracking-widest">
            <i data-lucide="palette" class="w-4 h-4"></i> Product Details
          </h3>
          <div class="space-y-3">
             <div class="flex items-center justify-between text-sm py-2 border-b border-white/5">
                <span class="text-gray-500">Apparel Type</span>
                <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-xs capitalize">${order.type}</span>
             </div>
             <div class="flex items-start justify-between text-sm py-2">
                <span class="text-gray-500">Customization</span>
                <span class="text-gray-200 text-right max-w-[200px]">${order.details}</span>
             </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 class="flex items-center gap-2 text-md font-bold text-green-400 mb-4 uppercase tracking-widest">
            <i data-lucide="map-pin" class="w-4 h-4"></i> Shipping Details
          </h3>
          <p class="text-sm text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
            ${order.address}
          </p>
        </div>

        <div class="bg-blue-600/5 rounded-xl p-5 border border-blue-500/20">
          <h3 class="flex items-center gap-2 text-md font-bold text-blue-400 mb-4 uppercase tracking-widest">
            <i data-lucide="user-check" class="w-4 h-4"></i> Business Assignment
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">Choose Vendor</label>
              <select id="vendor-select" class="w-full p-3 bg-gray-900 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option value="">Select an approved vendor...</option>
                ${approvedVendors.map(v => `<option value="${v.id}">${v.business_name}</option>`).join('')}
              </select>
            </div>
            
            <div>
              <label class="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">Internal Operations Notes</label>
              <textarea id="admin-notes" class="w-full p-3 bg-gray-900 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" rows="3" placeholder="Add specific instructions for this order..."></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-title').textContent = `Order #${order.id} - ${order.customer}`;
  document.getElementById('order-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.add('hidden');
  currentOrderId = null;
}

async function assignVendor() {
  const vendorId = document.getElementById('vendor-select')?.value;
  if (!vendorId) {
    showToast('Please select a vendor', 'warning');
    return;
  }

  try {
    const response = await ImpromptuIndianApi.fetch('/api/admin/assign-vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: currentOrderId,
        vendor_id: parseInt(vendorId)
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to assign vendor');
    }

    const data = await response.json();
    showToast(data.message || 'Vendor assigned successfully', 'success');

    // Remove from local state because it moved to production
    const orderIdx = orders.findIndex(o => o.id === currentOrderId);
    if (orderIdx !== -1) {
      orders.splice(orderIdx, 1);
    }

    closeOrderModal();
    filterOrders();
    calculateSummary();
  } catch (e) {
    console.error('Assignment failed', e);
    showToast(e.message || 'Failed to assign vendor', 'error');
  }
}

function rejectOrder() {
  if (!currentOrderId) return;
  const idx = orders.findIndex(o => o.id === currentOrderId);
  orders.splice(idx, 1);
  showToast('Order rejected successfully', 'success');
  closeOrderModal();
  renderOrders();
  calculateSummary();
}

async function refreshOrders() {
  await fetchApprovedVendors();
  await fetchOrders();
  showToast('Data refreshed successfully', 'success');
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add('show');
    }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  // Show all reveal elements immediately (they're already in view on page load)
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('show');
    });
  });

  try {
    await fetchApprovedVendors();
    await fetchOrders();
    calculateSummary();
  } catch (error) {
    console.error('Error initializing page:', error);
  }

  // Also set up scroll listener for any elements that come into view later
  onScroll();
  window.addEventListener('scroll', onScroll);

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
});