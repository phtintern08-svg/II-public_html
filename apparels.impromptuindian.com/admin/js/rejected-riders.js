// rejected-riders.js

let rejectedRiders = [];
let currentRiderId = null;

async function fetchRejectedRiders() {
    try {
        // Fetch rejected riders from new endpoint (filtered by backend)
        const response = await ThreadlyApi.fetch('/admin/rejected-riders');
        if (!response.ok) throw new Error('Failed to fetch rejected riders');

        const all = await response.json();
        rejectedRiders = all; // Already filtered by backend

        renderRejected(rejectedRiders);
    } catch (e) {
        console.error('Error loading rejected riders', e);
    }
}

function renderRejected(data) {
    const tbody = document.getElementById('rejected-table');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">No rejected applications found</td></tr>';
        return;
    }

    data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-gray-400">${r.email || ''}</div>
            </td>
            <td>${r.submitted}</td>
            <td><span class="text-red-400 text-sm">${r.adminRemarks || 'Reason not specified'}</span></td>
            <td class="text-right">
                <button class="btn-primary" onclick="openReapplyModal(${r.id})">Review</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRejected() {
    const term = document.getElementById('search-rejected').value.toLowerCase();
    const filtered = rejectedRiders.filter(r =>
        r.name.toLowerCase().includes(term) ||
        (r.email && r.email.toLowerCase().includes(term))
    );
    renderRejected(filtered);
}

function openReapplyModal(id) {
    currentRiderId = id;
    const rider = rejectedRiders.find(r => r.id === id);
    const body = document.getElementById('reapply-body');

    body.innerHTML = `
        <div class="space-y-4">
            <div>
                <h3 class="text-lg font-semibold mb-2">Rider Information</h3>
                <p><strong>Name:</strong> ${rider.name}</p>
                <p><strong>Submitted On:</strong> ${rider.submitted}</p>
                <p><strong>Rejection Reason:</strong> <span class="text-red-400">${rider.adminRemarks}</span></p>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-2">Review Documents</h3>
                 <p class="text-sm text-gray-400 mb-2">Check if the rider has re-uploaded corrected documents.</p>
                <!-- We could list documents again here similar to rider-requests.js -->
            </div>
            
            <div>
                <label class="block mb-2 font-semibold">Admin Remarks</label>
                <textarea id="admin-feedback" class="w-full p-2 bg-gray-800 text-white rounded" rows="3" placeholder="Notes..."></textarea>
            </div>
        </div>
    `;

    document.getElementById('reapply-modal').classList.remove('hidden');
}

function closeReapplyModal() {
    document.getElementById('reapply-modal').classList.add('hidden');
    currentRiderId = null;
}

async function approveReapply() {
    if (!currentRiderId) return;

    if (confirm('Approve this rider?')) {
        try {
            const resp = await ThreadlyApi.fetch(`/admin/rider-requests/${currentRiderId}/approve`, {
                method: 'POST'
            });
            if (resp.ok) {
                closeReapplyModal();
                fetchRejectedRiders();
                if (window.showAlert) window.showAlert('Success', 'Rider approved', 'success');
            } else {
                alert('Failed to approve');
            }
        } catch (e) {
            console.error(e);
        }
    }
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 50) el.classList.add('active');
    });
}

window.addEventListener('scroll', onScroll);

document.addEventListener('DOMContentLoaded', () => {
    fetchRejectedRiders();
    setTimeout(onScroll, 100);
});
