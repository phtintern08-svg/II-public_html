// rider-requests.js

function showToast(msg) {
    // You might need a toast container in HTML if not present, but using customAlert or simple console for now if missing
    // or reusing the one if you added it (I didn't add toast to rider-requests.html, but I did add customAlert)
    // Actually I'll use showAlert from custom-alert.js usually
    if (window.showAlert) {
        window.showAlert('Notification', msg, 'success');
    } else {
        alert(msg);
    }
}

let riderRequests = [];
let currentRiderId = null;

async function fetchRiderRequests() {
    try {
        const response = await ThreadlyApi.fetch('/admin/rider-requests');
        if (!response.ok) throw new Error('Failed to fetch rider requests');

        const all = await response.json();
        // The endpoint returns pending, under-review, and rejected.
        // We might want to filter or just show all in the table and let frontend filter handle it.
        riderRequests = all;
        filterRequests();
    } catch (e) {
        console.error('Error loading rider requests', e);
        if (window.showAlert) window.showAlert('Error', 'Failed to load rider requests', 'error');
    }
}

function renderRequests(data) {
    const tbody = document.getElementById('requests-table');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500">No rider requests found</td></tr>';
        return;
    }

    data.forEach(r => {
        // Status badge styling
        let statusClass = 'bg-yellow-500/20 text-yellow-400';
        if (r.status === 'rejected') statusClass = 'bg-red-500/20 text-red-400';
        if (r.status === 'under-review') statusClass = 'bg-blue-500/20 text-blue-400';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-gray-400">${r.email || ''}</div>
            </td>
            <td>${r.vehicleType}</td>
            <td>${r.submitted}</td>
            <td><span class="px-2 py-1 rounded text-xs ${statusClass}">${r.status}</span></td>
            <td class="text-right">
                <button class="btn-primary" onclick="openRiderModal(${r.id})">Review</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRequests() {
    const status = document.getElementById('status-filter').value;
    const search = document.getElementById('search-rider').value.toLowerCase();

    const filtered = riderRequests.filter(r => {
        const matchesStatus = status === 'all' || r.status === status;
        const matchesSearch = r.name.toLowerCase().includes(search) || (r.email && r.email.toLowerCase().includes(search));
        return matchesStatus && matchesSearch;
    });

    renderRequests(filtered);
}

function openRiderModal(id) {
    currentRiderId = id;
    const rider = riderRequests.find(r => r.id === id);
    const modalBody = document.getElementById('modal-body');

    // Document Icon Mapping
    const getDocIcon = (type) => {
        if (type.includes('dl') || type.includes('license')) return 'car';
        if (type.includes('aadhar') || type.includes('pan')) return 'credit-card';
        if (type.includes('insurance')) return 'shield';
        if (type.includes('rc') || type.includes('vehicle')) return 'file-text';
        if (type.includes('photo')) return 'user';
        return 'file';
    };

    // Build documents HTML
    let docsHtml = '';
    const docLabels = {
        'dl': 'Driving License',
        'aadhar': 'Aadhar Card',
        'pan': 'PAN Card',
        'vehicle_rc': 'Vehicle RC',
        'insurance': 'Vehicle Insurance',
        'photo': 'Profile Photo'
    };

    if (rider.documents) {
        docsHtml = '<div class="grid grid-cols-1 gap-3">';
        Object.entries(rider.documents).forEach(([key, doc]) => {
            const label = docLabels[key] || key;

            // Extract extra info from doc object if available (backend needs to send this in documents dict)
            // Assuming documents dict structure from backend includes extra fields mixed in or specific keys
            // For now, let's look for known keys in the `doc` object.

            let extraInfo = '';

            if (key === 'dl') {
                if (doc.dl_number) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">DL: ${doc.dl_number}</p>`;
                if (doc.dl_name) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">Name: ${doc.dl_name}</p>`;
                if (doc.dl_validity) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">Valid: ${doc.dl_validity}</p>`;
            }
            if (key === 'bank') {
                if (doc.bank_account_number) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">Acc: ${doc.bank_account_number}</p>`;
                if (doc.ifsc_code) extraInfo += `<p class="text-[10px] text-gray-400 mt-0.5">IFSC: ${doc.ifsc_code}</p>`;
            }
            if (key === 'pan' && doc.pan_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">PAN: ${doc.pan_number}</p>`;
            if (key === 'aadhar' && doc.aadhar_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">AADHAR: ${doc.aadhar_number}</p>`;
            if (key === 'vehicle_rc' && doc.vehicle_rc_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">RC: ${doc.vehicle_rc_number}</p>`;
            if (key === 'insurance' && doc.insurance_policy_number) extraInfo = `<p class="text-[10px] text-gray-400 mt-0.5">Policy: ${doc.insurance_policy_number}</p>`;

            // Status Badges
            let statusBadge = '';
            if (doc.status === 'approved') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>';
            else if (doc.status === 'rejected') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>';
            else statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>';

            const iconName = getDocIcon(key);

            docsHtml += `
            <div class="group flex flex-col p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all">
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                         <div class="flex items-center h-full">
                            <input type="checkbox" 
                                class="doc-reject-checkbox w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500 cursor-pointer" 
                                data-doctype="${key}" 
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
                    `<button onclick="previewDocument('${ThreadlyApi.baseUrl}/rider/verification/document/${rider.id}/${key}', '${doc.fileName}', '${key}')" 
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

    // Modal Content
    modalBody.innerHTML = `
        <div class="flex flex-col lg:flex-row gap-6 h-full">
            
            <!-- Left Column: Rider Details -->
            <div class="w-full lg:w-5/12 space-y-6">
                
                <!-- Profile Header -->
                <div class="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            ${rider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white">${rider.name}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-gray-600">ID: #${rider.id}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${rider.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} border border-transparent">
                                    ${rider.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact & Vehicle Info -->
                <div class="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                    <div class="p-4 border-b border-gray-700/50 bg-gray-800/60">
                         <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Rider Information</h4>
                    </div>
                    <div class="p-4 grid gap-4">
                        <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Email</span>
                            <span class="text-sm text-gray-200 truncate" title="${rider.email}">${rider.email}</span>
                        </div>
                        <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Phone</span>
                            <span class="text-sm text-gray-200">${rider.phone}</span>
                        </div>
                        <div class="h-px bg-gray-700/50 my-1"></div>
                        <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Vehicle</span>
                            <span class="text-sm text-gray-200 capitalize flex items-center gap-2">
                                <i data-lucide="bike" class="w-3 h-3 text-blue-400"></i> ${rider.vehicleType || 'Not set'}
                            </span>
                        </div>
                        <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Plate No.</span>
                            <span class="text-sm font-mono bg-gray-900 px-2 py-1 rounded text-gray-300 inline-block w-fit border border-gray-700">
                                ${rider.vehicleNumber || 'N/A'}
                            </span>
                        </div>
                        <div class="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Zone</span>
                            <span class="text-sm text-gray-200">${rider.serviceZone || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                
                ${rider.adminRemarks ? '' : ''}
            </div>

            <!-- Right Column: Documents -->
            <div class="w-full lg:w-7/12 flex flex-col h-full">
                 <div class="bg-gray-800/40 rounded-xl border border-gray-700/50 flex-1 flex flex-col overflow-hidden">
                    <div class="p-4 border-b border-gray-700/50 bg-gray-800/60 flex justify-between items-center">
                         <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Verification Documents</h4>
                         <span class="text-xs text-gray-500">${Object.keys(rider.documents || {}).length} files</span>
                    </div>
                    <div class="p-4 overflow-y-auto max-h-[400px] scrollbar-hide">
                        ${docsHtml}
                    </div>
                 </div>
            </div>
        </div>
    `;

    document.getElementById('rider-modal').classList.remove('hidden');

    // Re-initialize icons for the new content
    lucide.createIcons();
    updateRiderModalButtons();
}

function previewDocument(url, filename, type) {
    // Determine if we can preview it roughly by extension or just try iframe
    // Images and PDFs are good in iframe/img.
    // We'll use an iframe for broad compatibility (PDFs) and img for images if we wanted specific handling,
    // but iframe handles both usually.
    // However, for better image scaling, let's check extension.

    // Clean filename check
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
    lucide.createIcons();
}

function closePreviewModal() {
    const el = document.getElementById('previewModal');
    if (el) el.remove();
}

function closeRiderModal() {
    document.getElementById('rider-modal').classList.add('hidden');
    currentRiderId = null;
}

async function approveRider() {
    if (!currentRiderId) return;

    // Beautiful native-replacement dialog logic could go here, but sticking to standard logic for now
    // If you have a custom confirm modal, use it.
    if (confirm('Are you sure you want to approve this rider? They will be able to start accepting orders immediately.')) {
        await performApprove();
    }
}

async function performApprove() {
    try {
        const resp = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}/approve`, {
            method: 'POST'
        });
        if (resp.ok) {
            closeRiderModal();
            fetchRiderRequests(); // Refresh list
            if (window.fetchSidebarCounts) window.fetchSidebarCounts();
            if (window.showAlert) window.showAlert('Success', 'Rider approved successfully', 'success');
        } else {
            const err = await resp.json();
            if (window.showAlert) window.showAlert('Error', err.error || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        if (window.showAlert) window.showAlert('Error', 'Network error', 'error');
    }
}

function rejectRider() {
    handlePartialRejection();
}


function updateRiderModalButtons() {
    const checkedCount = document.querySelectorAll('.doc-reject-checkbox:checked').length;
    const btnApprove = document.getElementById('btn-approve-rider');
    const btnReject = document.getElementById('btn-reject-rider');

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
    updateRiderModalButtons();
}

function handlePartialRejection() {
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

    if (Object.keys(rejectedDocs).length > 0) {
        executeRejection('See specific document remarks', rejectedDocs);
    } else {
        showToast('Please select documents to reject and provide reasons.');
    }
}

async function executeRejection(reason, rejectedDocs = {}) {
    if (!currentRiderId) return;

    try {
        const payload = {
            reason: reason,
            rejected_documents: rejectedDocs
        };

        const response = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Rider rejected successfully');
            closeRejectionModal();
            closeRiderModal();
            fetchRiderRequests();
        } else {
            const err = await response.json();
            showToast(err.error || 'Failed to reject rider');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting rider');
    }
}



function openRejectionModal() {
    const inputModalHtml = `
    <div id="rejectionModal" class="fixed inset-0 flex items-center justify-center z-[110]">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeRejectionModal()"></div>
        <div class="relative bg-[#1a202c] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all scale-100 p-0 overflow-hidden">
            <div class="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-3">
                <div class="p-2 bg-red-500/20 rounded-full text-red-500">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">Reject Application</h3>
                    <p class="text-xs text-red-300">This action will notify the rider.</p>
                </div>
            </div>
            <div class="p-6">
                 <label class="block text-sm font-medium text-gray-400 mb-2">Reason for rejection <span class="text-red-500">*</span></label>
                 <textarea id="rejectionReasonInput" 
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none" 
                    rows="4" 
                    placeholder="E.g. Blurred documents, Invalid driving license..."></textarea>
            </div>
            <div class="bg-gray-800/50 p-4 flex justify-end gap-3 border-t border-gray-700/50">
                <button onclick="closeRejectionModal()" 
                    class="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    Cancel
                </button>
                <button onclick="confirmRejectRider()" 
                    class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-red-900/20 transition-all flex items-center gap-2">
                    <span>Reject Rider</span>
                    <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </button>
            </div>
        </div>
    </div>
    `;

    const existing = document.getElementById('rejectionModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', inputModalHtml);
    lucide.createIcons();

    setTimeout(() => {
        document.getElementById('rejectionReasonInput').focus();
    }, 100);
}

function closeRejectionModal() {
    const el = document.getElementById('rejectionModal');
    if (el) el.remove();
}

async function confirmRejectRider() {
    const reason = document.getElementById('rejectionReasonInput').value;
    if (!reason.trim()) {
        const input = document.getElementById('rejectionReasonInput');
        input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        input.focus();
        return;
    }

    const btn = document.querySelector('#rejectionModal button:last-child');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
    btn.disabled = true;
    lucide.createIcons();

    try {
        const resp = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason })
        });

        if (resp.ok) {
            closeRejectionModal();
            closeRiderModal();
            fetchRiderRequests();
            if (window.fetchSidebarCounts) window.fetchSidebarCounts();
            if (window.showAlert) window.showAlert('Application Rejected', 'The rider has been notified of the rejection.', 'success');
        } else {
            const err = await resp.json();
            closeRejectionModal();
            if (window.showAlert) window.showAlert('Error', err.error || 'Failed to reject', 'error');
        }
    } catch (e) {
        console.error(e);
        closeRejectionModal();
        if (window.showAlert) window.showAlert('Error', 'Network error occurred', 'error');
    }
}

async function deleteRiderRequest() {
    if (!currentRiderId) return;
    if (!confirm('Are you sure you want to DELETE this request? This cannot be undone.')) return;

    try {
        const resp = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}`, {
            method: 'DELETE'
        });
        if (resp.ok) {
            closeRiderModal();
            fetchRiderRequests();
            if (window.showAlert) window.showAlert('Success', 'Request deleted', 'success');
        } else {
            const err = await resp.json();
        }
    } catch (e) {
        console.error(e);
    }
}

// Reveal animation on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 50) el.classList.add('active');
    });
}

async function rejectSpecificDocument(docType) {
    if (!currentRiderId) return;

    const reason = prompt(`Enter rejection reason for this document:`);
    if (reason === null) return;
    if (!reason.trim()) {
        showToast('Reason is required');
        return;
    }

    try {
        const response = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}/document/${docType}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', reason: reason })
        });

        if (response.ok) {
            showToast('Document rejected');
            await fetchRiderRequests();
            openRiderModal(currentRiderId);
        } else {
            showToast('Failed to reject document');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting document');
    }
}

window.addEventListener('scroll', onScroll);

document.addEventListener('DOMContentLoaded', () => {
    fetchRiderRequests();
    setTimeout(onScroll, 100); // Trigger initial reveal
});
