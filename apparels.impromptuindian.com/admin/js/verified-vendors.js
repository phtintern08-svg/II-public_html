// verified-vendors.js – admin verified vendor management
// ThreadlyApi is provided by sidebar.js

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

let vendors = [];
let currentVendorId = null;

async function fetchVendors() {
  try {
    const response = await ThreadlyApi.fetch('/admin/verified-vendors');
    if (!response.ok) throw new Error('Failed to fetch verified vendors');
    vendors = await response.json();
    renderVendors();
  } catch (e) {
    console.error(e);
    showToast('Error loading verified vendors', 'error');
  }
}

function renderVendors() {
  const tbody = document.getElementById('vendors-table');
  tbody.innerHTML = '';

  if (vendors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No verified vendors yet</td></tr>';
    return;
  }

  vendors.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.name}</td>
      <td>${v.businessType}</td>
      <td>${v.email}</td>
      <td>${v.phone || 'N/A'}</td>
      <td>${v.commissionRate}%</td>
      <td><span class="status-${v.status}">${v.status}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewVendor(${v.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterVendors() {
  const term = document.getElementById('search-vendor').value.toLowerCase();

  const filtered = vendors.filter(v => {
    const matchTerm = v.name.toLowerCase().includes(term) ||
      v.email.toLowerCase().includes(term) ||
      v.businessType.toLowerCase().includes(term);
    return matchTerm;
  });

  const tbody = document.getElementById('vendors-table');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No vendors match your search</td></tr>';
    return;
  }

  filtered.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.name}</td>
      <td>${v.businessType}</td>
      <td>${v.email}</td>
      <td>${v.phone || 'N/A'}</td>
      <td>${v.commissionRate}%</td>
      <td><span class="status-${v.status}">${v.status}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="viewVendor(${v.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function viewVendor(id) {
  currentVendorId = id;
  const vendor = vendors.find(v => v.id === id);
  const body = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Vendor Information</h3>
        <p><strong>Name:</strong> ${vendor.name}</p>
        <p><strong>Business Type:</strong> ${vendor.businessType}</p>
        <p><strong>Email:</strong> ${vendor.email}</p>
        <p><strong>Phone:</strong> ${vendor.phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${vendor.address}</p>
        <p><strong>Status:</strong> <span class="status-${vendor.status}">${vendor.status}</span></p>
        <p><strong>Joined Date:</strong> ${vendor.joinedDate}</p>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-2">Business Configuration</h3>
        <p><strong>Commission Rate:</strong> ${vendor.commissionRate}%</p>
        <p><strong>Payment Cycle:</strong> ${vendor.paymentCycle}</p>
        <p><strong>Service Zone:</strong> ${vendor.serviceZone}</p>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Admin Notes</label>
        <textarea id="admin-notes" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Add internal notes about this vendor..."></textarea>
      </div>
    </div>
  `;

  document.getElementById('modal-title').textContent = vendor.name;
  document.getElementById('vendor-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeVendorModal() {
  document.getElementById('vendor-modal').classList.add('hidden');
  currentVendorId = null;
}

async function suspendVendor() {
  if (!currentVendorId) return;

  showAlert('Confirm Suspension', 'Are you sure you want to suspend this vendor?', 'confirm', async () => {
    try {
      // TODO: Implement suspend endpoint
      const vendor = vendors.find(v => v.id === currentVendorId);
      showToast(`${vendor.name} suspension feature coming soon`, 'info');
      closeVendorModal();
    } catch (e) {
      console.error(e);
      showToast('Error suspending vendor', 'error');
    }
  });
}

async function reactivateVendor() {
  if (!currentVendorId) return;

  try {
    // TODO: Implement reactivate endpoint
    const vendor = vendors.find(v => v.id === currentVendorId);
    showToast(`${vendor.name} reactivation feature coming soon`, 'info');
    closeVendorModal();
  } catch (e) {
    console.error(e);
    showToast('Error reactivating vendor', 'error');
  }
}

function openAddVendorModal() {
  showToast('Add vendor functionality coming soon', 'info');
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fetchVendors();
  onScroll();
  window.addEventListener('scroll', onScroll);
});
