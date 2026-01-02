// vendor-requests.js – admin vendor verification workflow
// ThreadlyApi is provided by sidebar.js


function showToast(msg) {
  let type = 'success';
  let title = 'Success';

  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('please provided') || lowerMsg.includes('please provide')) {
    type = 'error';
    title = 'Error';
  } else if (lowerMsg.includes('info') || lowerMsg.includes('warning')) {
    type = 'info';
    title = 'Info';
  }

  showAlert(title, msg, type);
}

let requests = [];
let currentVendorId = null;

async function fetchRequests() {
  try {
    const response = await ThreadlyApi.fetch('/admin/vendor-requests');
    if (!response.ok) throw new Error('Failed to fetch requests');
    requests = await response.json();
    console.log('Fetched requests:', requests);
    renderRequests();
  } catch (e) {
    console.error(e);
    showToast('Error loading requests');
  }
}

function renderRequests() {
  const tbody = document.getElementById('requests-table');
  tbody.innerHTML = '';

  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No pending requests</td></tr>';
    return;
  }

  requests.forEach(r => {
    // Check if documents exist
    const hasDocs = r.documents && Object.keys(r.documents).length > 0;
    const statusDisplay = hasDocs ? r.status : 'Missing Docs';
    const statusClass = hasDocs ? r.status : 'rejected'; // Use red for missing docs

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.businessType}</td>
      <td>${r.submitted}</td>
      <td><span class="doc-status ${statusClass}">${statusDisplay}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="openVendorModal(${r.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function filterRequests() {
  const status = document.getElementById('status-filter').value;
  const term = document.getElementById('search-vendor').value.toLowerCase();
  const filtered = requests.filter(r => {
    const matchStatus = status === 'all' || r.status === status;
    const matchTerm = r.name.toLowerCase().includes(term) || r.businessType.toLowerCase().includes(term);
    return matchStatus && matchTerm;
  });
  const tbody = document.getElementById('requests-table');
  tbody.innerHTML = '';
  filtered.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.businessType}</td>
      <td>${r.submitted}</td>
      <td><span class="doc-status ${r.status}">${r.status}</span></td>
      <td class="text-right">
        <button class="btn-primary" onclick="openVendorModal(${r.id})"><i data-lucide="eye" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function openVendorModal(id) {
  currentVendorId = id;
  const vendor = requests.find(r => r.id === id);
  const body = document.getElementById('modal-body');

  // Document Icon Mapping
  const getDocIcon = (type) => {
    if (type.includes('business')) return 'building-2';
    if (type.includes('aadhar') || type.includes('pan')) return 'credit-card';
    if (type.includes('bank')) return 'landmark';
    if (type.includes('gst')) return 'file-text';
    if (type.includes('workshop')) return 'image';
    if (type.includes('signature')) return 'pen-tool';
    return 'file';
  };

  const docLabels = {
    'pan': 'PAN Card',
    'aadhar': 'Aadhar Card',
    'gst': 'GST Certificate',
    'business': 'Business Registration',
    'bank': 'Bank Details',
    'workshop': 'Workshop Images',
    'signature': 'Signature'
  };

  let docsHtml = '';
  if (vendor.documents) {
    docsHtml = '<div class="grid grid-cols-1 gap-3">';

    // Sort: Pending/Uploaded/Rejected (Needs Action) -> Approved (Done)
    const sortedDocs = Object.entries(vendor.documents).sort(([, a], [, b]) => {
      const priority = status => {
        if (status === 'pending' || status === 'uploaded') return 3;
        if (status === 'rejected') return 2;
        if (status === 'approved') return 0;
        return 1;
      };
      return priority(b.status) - priority(a.status);
    });

    sortedDocs.forEach(([key, doc]) => {
      const label = docLabels[key] || key;
      const iconName = getDocIcon(key);

      let extraInfo = '';
      if (key === 'pan' && doc.pan_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">PAN: ${doc.pan_number}</p>`;
      if (key === 'aadhar' && doc.aadhar_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">AADHAR: ${doc.aadhar_number}</p>`;
      if (key === 'gst' && doc.gst_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">GST: ${doc.gst_number}</p>`;
      if (key === 'bank') {
        if (doc.bank_account_number) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">Acc: ${doc.bank_account_number}</p>`;
        if (doc.ifsc_code) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">IFSC: ${doc.ifsc_code}</p>`;
      }

      let statusBadge = '';
      if (doc.status === 'approved') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>';
      else if (doc.status === 'rejected') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>';
      else statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Updated</span>';

      const isApproved = doc.status === 'approved';
      const containerClass = isApproved ? 'opacity-50 border-green-500/20' : 'hover:bg-gray-800 border-gray-700/50';
      const checkboxDisabled = isApproved ? 'disabled' : '';
      const checkboxClass = isApproved ? 'cursor-not-allowed opacity-50 bg-green-900 border-green-700' : 'cursor-pointer bg-gray-700 hover:border-red-500';

      docsHtml += `
            <div class="group flex flex-col p-3 bg-gray-800/50 border rounded-lg transition-all ${containerClass}">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                      <div class="flex items-center h-full">
                            <input type="checkbox" 
                                class="doc-reject-checkbox w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500 ${checkboxClass}" 
                                data-doctype="${key}" 
                                ${checkboxDisabled}
                                onchange="toggleReasonInput('${key}')">
                       </div>
                      <div class="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                          <i data-lucide="${iconName}" class="w-5 h-5"></i>
                      </div>
                      <div>
                          <p class="text-sm font-medium text-gray-200">${label}</p>
                          <p class="text-xs text-gray-500 truncate max-w-[120px]">${doc.fileName || 'No file uploaded'}</p>
                          ${extraInfo}
                      </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                      ${statusBadge}
                      <div class="flex gap-2 mt-1">
                        ${doc.fileName ?
          `<button onclick="previewDocument('${ThreadlyApi.baseUrl}/vendor/verification/document/${vendor.id}/${key}', '${doc.fileName}', '${key}')" 
                              class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none">
                              View <i data-lucide="eye" class="w-3 h-3"></i>
                           </button>` : ''
        }
                      </div>
                  </div>
                </div>
                
                <div id="reject-reason-${key}" class="hidden mt-3 w-full border-t border-gray-700/50 pt-2">
                    <label class="text-[10px] text-red-400 uppercase font-semibold mb-1 block">Rejection Reason</label>
                    <input type="text" id="reason-input-${key}"
                        class="w-full bg-gray-900 border border-red-500/30 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" 
                        placeholder="Enter reason (e.g., Blur, Invalid, Expired)">
                </div>
            </div>
          `;
    });
    docsHtml += '</div>';
  } else {
    docsHtml = `
          <div class="flex flex-col items-center justify-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
              <i data-lucide="folder-open" class="w-8 h-8 mb-2 opacity-50"></i>
              <p class="text-sm">No documents found</p>
          </div>
      `;
  }

  body.innerHTML = `
    <div class="flex flex-col lg:flex-row gap-6 h-full">
        
        <!-- Left Column: Vendor Details -->
        <div class="w-full lg:w-5/12 space-y-6">
            
            <!-- Profile Header -->
            <div class="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        ${vendor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">${vendor.name}</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-gray-600">ID: #${vendor.id}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full ${vendor.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} border border-transparent">
                                ${vendor.status ? vendor.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Business Info -->
            <div class="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                <div class="p-4 border-b border-gray-700/50 bg-gray-800/60">
                     <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Business Information</h4>
                </div>
                <div class="p-4 grid gap-4">
                    <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                        <span class="text-xs text-gray-500 uppercase font-semibold">Type</span>
                        <span class="text-sm text-gray-200">${vendor.businessType}</span>
                    </div>
                    <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                        <span class="text-xs text-gray-500 uppercase font-semibold">Email</span>
                        <span class="text-sm text-gray-200 truncate" title="${vendor.contact.email}">${vendor.contact.email}</span>
                    </div>
                    <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                        <span class="text-xs text-gray-500 uppercase font-semibold">Phone</span>
                        <span class="text-sm text-gray-200">${vendor.contact.phone}</span>
                    </div>
                    <div class="h-px bg-gray-700/50 my-1"></div>
                    <div class="grid grid-cols-[100px_1fr] items-start gap-2">
                        <span class="text-xs text-gray-500 uppercase font-semibold mt-1">Address</span>
                        <span class="text-sm text-gray-200">${vendor.address}</span>
                    </div>
                </div>
            </div>
            
        </div>

        <!-- Right Column: Documents -->
        <div class="w-full lg:w-7/12 flex flex-col h-full">
            <div class="bg-gray-800/40 rounded-xl border border-gray-700/50 flex flex-col h-full overflow-hidden">
                <div class="p-4 border-b border-gray-700/50 bg-gray-800/60 flex justify-between items-center">
                    <h4 class="text-sm font-semibold text-white uppercase tracking-wider">Verification Documents</h4>
                    <span class="text-xs text-gray-500 font-mono">${Object.keys(vendor.documents || {}).length} files</span>
                </div>
                <div class="p-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style="max-height: 400px;">
                    ${docsHtml}
                </div>
            </div>
        </div>

  `;

  document.getElementById('modal-title').textContent = `Vendor Application - ${vendor.name}`;


  document.getElementById('vendor-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
  updateModalButtons();
}

function closeVendorModal() {
  document.getElementById('vendor-modal').classList.add('hidden');
  currentVendorId = null;
}

async function approveVendor() {
  if (!currentVendorId) return;

  try {
    const response = await ThreadlyApi.fetch(`/admin/vendor-requests/${currentVendorId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (response.ok) {
      showToast(`Vendor approved`);
      closeVendorModal();
      fetchRequests();
    } else {
      showToast('Failed to approve vendor');
    }
  } catch (e) {
    console.error(e);
    showToast('Error approving vendor');
  }
}



function updateModalButtons() {
  const checkedCount = document.querySelectorAll('.doc-reject-checkbox:checked').length;
  const btnApprove = document.getElementById('btn-approve-vendor');
  const btnReject = document.getElementById('btn-reject-vendor');

  if (checkedCount > 0) {
    btnApprove.classList.add('hidden');
    btnReject.classList.remove('hidden');
  } else {
    btnApprove.classList.remove('hidden');
    btnReject.classList.add('hidden');
  }
}

function toggleReasonInput(docType) {
  const cb = document.querySelector(`.doc-reject-checkbox[data-doctype="${docType}"]`);
  const reasonDiv = document.getElementById(`reject-reason-${docType}`);
  if (cb && reasonDiv) {
    if (cb.checked) {
      reasonDiv.classList.remove('hidden');
      const input = reasonDiv.querySelector('input');
      if (input) input.focus();
    } else {
      reasonDiv.classList.add('hidden');
    }
  }
  updateModalButtons();
}

async function rejectVendor() {
  if (!currentVendorId) return;

  const checked = document.querySelectorAll('.doc-reject-checkbox:checked');
  const rejectedDocs = {};
  let hasError = false;

  checked.forEach(cb => {
    const type = cb.dataset.doctype;
    const reasonInput = document.getElementById(`reason-input-${type}`);
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      if (reasonInput) reasonInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
      hasError = true;
    } else {
      if (reasonInput) reasonInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    }
    rejectedDocs[type] = reason;
  });

  if (hasError) {
    showToast('Please enter reasons for all selected documents');
    return;
  }

  let reason = '';
  // If specific docs rejected
  if (Object.keys(rejectedDocs).length > 0) {
    reason = 'Documents rejected (see remarks)';
  } else {
    // Global rejection fallback
    reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    if (!reason.trim()) {
      showToast('Reason is required');
      return;
    }
  }

  try {
    const response = await ThreadlyApi.fetch(`/admin/vendor-requests/${currentVendorId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: reason,
        rejected_documents: rejectedDocs
      })
    });

    if (response.ok) {
      showToast(`Vendor rejected`);
      closeVendorModal();
      fetchRequests();
    } else {
      showToast('Failed to reject vendor');
    }
  } catch (e) {
    console.error(e);
    showToast('Error rejecting vendor');
  }
}



async function deleteVendorRequest() {
  if (!currentVendorId) return;

  showAlert('Confirm Delete', 'Are you sure you want to delete this vendor request? This will reset their verification status and remove all documents.', 'confirm', async () => {
    try {
      const response = await ThreadlyApi.fetch(`/ admin / vendor - requests / ${currentVendorId}/delete`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Vendor request deleted successfully');
        closeVendorModal();
        fetchRequests();
      } else {
        showToast('Failed to delete vendor request');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting vendor request');
    }
  });
}

function openAddVendorModal() {
  showToast('Add vendor form (placeholder)');
}

// Reveal on scroll
function onScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('show');
  });
}


function previewDocument(url, filename, type) {
  // Check if image for simpler preview
  const isImg = filename.toLowerCase().match(/\.(jpeg|jpg|png|gif|webp)$/i);

  const previewContent = isImg
    ? `<img src="${url}" class="max-w-full max-h-[70vh] object-contain mx-auto rounded-md shadow-lg" alt="${filename}">`
    : `<iframe src="${url}" class="w-full h-[70vh] rounded-md border border-gray-700 bg-white" frameborder="0"></iframe>`;

  const modalHtml = `
    <div id="previewModal" class="fixed inset-0 flex items-center justify-center z-[150]">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onclick="closePreviewModal()"></div>
        
        <div class="relative bg-[#1a202c] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
                <div class="flex items-center gap-3">
                     <div class="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white truncate max-w-[200px] md:max-w-md">${filename}</h3>
                        <p class="text-xs text-gray-400">Document Preview</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <a href="${url}" download="${filename}" class="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" title="Download">
                        <i data-lucide="download" class="w-5 h-5"></i>
                    </a>
                    <button onclick="closePreviewModal()" class="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>

            <div class="p-4 bg-gray-900/50 flex-1 overflow-auto flex items-center justify-center relative">
               ${previewContent}
            </div>
            
        </div>
    </div>
    `;

  const existing = document.getElementById('previewModal');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (window.lucide) lucide.createIcons();
}

function closePreviewModal() {
  const m = document.getElementById('previewModal');
  if (m) m.remove();
}

window.addEventListener('DOMContentLoaded', () => {
  fetchRequests();
  onScroll();
  window.addEventListener('scroll', onScroll);
});
