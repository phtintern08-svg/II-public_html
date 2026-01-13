// rejected-vendors.js – admin rejected vendor re-application review (live data)
// ImpromptuIndianApi is provided by sidebar.js

function showToast(msg) {
  const toast = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  if (!toast || !txt) return;
  txt.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

let rejectedVendors = [];
let currentVendorId = null;

async function fetchRejectedVendors() {
  try {
    const token = localStorage.getItem('token');
    const response = await ImpromptuIndianApi.fetch('/api/admin/vendors?status=rejected', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch rejected vendors');

    const data = await response.json();
    const all = data.vendors || data;
    rejectedVendors = all
      // .filter(v => v.status === 'rejected') // No longer needed
      .map(v => ({
        id: v.id,
        name: v.name,
        submittedOn: v.submitted,
        rejectionReason: v.adminRemarks || 'Documents rejected',
        documents: v.documents || {},
        reapplied: false, // could be extended later if you track re-applications
      }));

    renderRejected();
  } catch (e) {
    console.error('Error loading rejected vendors', e);
    showToast('Error loading rejected vendors');
  }
}

function renderRejected() {
  const tbody = document.getElementById('rejected-table');
  tbody.innerHTML = '';
  if (rejectedVendors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">No rejected vendors</td></tr>';
    return;
  }

  rejectedVendors.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.name} ${v.reapplied ? '<span class="text-blue-400 text-xs">(Re-applied)</span>' : ''}</td>
      <td>${v.submittedOn}</td>
      <td><span class="rejection-reason">${v.rejectionReason}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="reviewReapply(${v.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterRejected() {
  const term = document.getElementById('search-rejected').value.toLowerCase();
  const filtered = rejectedVendors.filter(v => v.name.toLowerCase().includes(term));

  const tbody = document.getElementById('rejected-table');
  tbody.innerHTML = '';
  filtered.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.name} ${v.reapplied ? '<span class="text-blue-400 text-xs">(Re-applied)</span>' : ''}</td>
      <td>${v.submittedOn}</td>
      <td><span class="rejection-reason">${v.rejectionReason}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="reviewReapply(${v.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function reviewReapply(id) {
  currentVendorId = id;
  const vendor = rejectedVendors.find(v => v.id === id);
  const body = document.getElementById('reapply-body');

  body.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Vendor Information</h3>
        <p><strong>Name:</strong> ${vendor.name}</p>
        <p><strong>Submitted On:</strong> ${vendor.submittedOn}</p>
        <p><strong>Previous Rejection Reason:</strong> <span class="rejection-reason">${vendor.rejectionReason}</span></p>
        <p><strong>Re-applied:</strong> ${vendor.reapplied ? 'Yes' : 'No'}</p>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-2">Document Status</h3>
        <div class="doc-status-grid">
          <div class="doc-status-card">
            <h4>PAN Card</h4>
            <p>Tax identification</p>
            <span class="doc-status ${vendor.documents.pan.status}">${vendor.documents.pan.status}</span>
            ${vendor.documents.pan.reason ? `<p class="text-xs text-red-400 mt-1">${vendor.documents.pan.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>Aadhar Card</h4>
            <p>Identity proof</p>
            <span class="doc-status ${vendor.documents.aadhar.status}">${vendor.documents.aadhar.status}</span>
            ${vendor.documents.aadhar.reason ? `<p class="text-xs text-red-400 mt-1">${vendor.documents.aadhar.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>GST Certificate</h4>
            <p>Tax registration</p>
            <span class="doc-status ${vendor.documents.gst.status}">${vendor.documents.gst.status}</span>
            ${vendor.documents.gst.reason ? `<p class="text-xs text-red-400 mt-1">${vendor.documents.gst.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>Bank Details</h4>
            <p>Payment information</p>
            <span class="doc-status ${vendor.documents.bank.status}">${vendor.documents.bank.status}</span>
            ${vendor.documents.bank.reason ? `<p class="text-xs text-red-400 mt-1">${vendor.documents.bank.reason}</p>` : ''}
          </div>
          <div class="doc-status-card">
            <h4>Shop Images</h4>
            <p>Business premises</p>
            <span class="doc-status ${vendor.documents.shop.status}">${vendor.documents.shop.status}</span>
            ${vendor.documents.shop.reason ? `<p class="text-xs text-red-400 mt-1">${vendor.documents.shop.reason}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Admin Feedback</label>
        <textarea id="admin-feedback" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Provide feedback to vendor about corrections needed..."></textarea>
      </div>
      
      <div>
        <label class="block mb-2 font-semibold">Commission Rate (%) if approving</label>
        <input type="number" id="commission-rate" class="w-full p-2 bg-gray-800 rounded" value="15" min="0" max="100" />
      </div>
    </div>
  `;

  document.getElementById('reapply-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeReapplyModal() {
  document.getElementById('reapply-modal').classList.add('hidden');
  currentVendorId = null;
}

async function approveReapply() {
  if (!currentVendorId) return;

  // For now, simply show a toast; actual re-apply approval flow would
  // use backend endpoints to move vendor out of rejected state.
  const commissionRate = document.getElementById('commission-rate')?.value;
  const vendor = rejectedVendors.find(v => v.id === currentVendorId);

  showToast(`${vendor.name} approved with ${commissionRate}% commission (mock)`);
  closeReapplyModal();
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fetchRejectedVendors();
  onScroll();
  window.addEventListener('scroll', onScroll);
});
