// quotation-reviews.js - Admin Quotation Review Workflow
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

let submissions = [];
let currentSubmissionId = null;

async function fetchQuotations() {
    try {
        const response = await ThreadlyApi.fetch('/admin/quotation-submissions');
        if (!response.ok) throw new Error('Failed to fetch submissions');
        submissions = await response.json();
        renderQuotations();
    } catch (e) {
        console.error(e);
        showToast('Error loading quotations', 'error');
    }
}

function renderQuotations() {
    const grid = document.getElementById('quotations-grid');
    grid.innerHTML = '';

    if (submissions.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="inbox" class="w-8 h-8 text-gray-500"></i>
                </div>
                <p class="text-gray-400 text-lg">No pending quotations</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    submissions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'quotation-card';
        card.innerHTML = `
            <div class="q-header">
                <div class="q-vendor-info">
                    <div class="q-vendor-name">${sub.vendor_name}</div>
                    <div class="q-date">
                        <i data-lucide="calendar" class="w-3 h-3"></i>
                        ${sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'}
                        <span class="q-commission-badge">${sub.proposed_commission_rate}% Comm.</span>
                    </div>
                </div>
            </div>
            
            <div class="q-file">
                <div class="q-file-icon">
                    <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                </div>
                <div class="q-filename" title="${sub.filename}">${sub.filename}</div>
            </div>
            
            <div class="q-actions">
                <span class="q-id">ID: #${sub.vendor_id}</span>
                <button class="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20" onclick="openQuotationModal(${sub.id})">
                    Review Quotation
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function openQuotationModal(id) {
    currentSubmissionId = id;
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('modal-vendor-name').textContent = sub.vendor_name;
    document.getElementById('modal-filename').textContent = sub.filename;
    document.getElementById('modal-commission').value = sub.proposed_commission_rate;
    document.getElementById('modal-remarks').value = '';

    // Set download link
    const downloadLink = document.getElementById('modal-download-link');
    downloadLink.href = ThreadlyApi.buildUrl(`/vendor/quotation/download/${sub.vendor_id}`);

    document.getElementById('quotation-modal').classList.remove('hidden');
}

function closeQuotationModal() {
    document.getElementById('quotation-modal').classList.add('hidden');
    currentSubmissionId = null;
}

async function approveQuotation() {
    if (!currentSubmissionId) return;

    const commission = document.getElementById('modal-commission').value;
    if (!commission) {
        showToast('Please enter final commission rate', 'error');
        return;
    }

    try {
        const response = await ThreadlyApi.fetch(`/admin/quotation-submissions/${currentSubmissionId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commission_rate: commission })
        });

        if (response.ok) {
            showToast('Quotation approved & vendor activated');
            closeQuotationModal();
            fetchQuotations();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error approving quotation', 'error');
    }
}

async function rejectQuotation() {
    if (!currentSubmissionId) return;

    const remarks = document.getElementById('modal-remarks').value;
    if (!remarks) {
        showToast('Please provide a rejection reason', 'error');
        return;
    }

    try {
        const response = await ThreadlyApi.fetch(`/admin/quotation-submissions/${currentSubmissionId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remarks: remarks })
        });

        if (response.ok) {
            showToast('Quotation rejected');
            closeQuotationModal();
            fetchQuotations();
        } else {
            showToast('Failed to reject', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting quotation', 'error');
    }
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchQuotations();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
