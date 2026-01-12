// verified-riders.js

function showToast(msg) {
    if (window.showAlert) {
        window.showAlert('Notification', msg, 'success');
    } else {
        alert(msg);
    }
}

let verifiedRiders = [];

async function fetchVerifiedRiders() {
    try {
        const response = await ThreadlyApi.fetch('/admin/verified-riders');
        if (!response.ok) throw new Error('Failed to fetch verified riders');

        verifiedRiders = await response.json();
        renderRiders(verifiedRiders);
    } catch (e) {
        console.error('Error loading verified riders', e);
        if (window.showAlert) window.showAlert('Error', 'Failed to load verified riders', 'error');
    }
}

function renderRiders(data) {
    const tbody = document.getElementById('riders-table');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-500">No active riders found</td></tr>';
        return;
    }

    data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-gray-400">${r.email}</div>
            </td>
            <td>${r.vehicleType}</td>
            <td>${r.vehicleNumber}</td>
            <td>${r.serviceZone}</td>
            <td><span class="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Active</span></td>
            <td class="text-right">
                <button class="btn-secondary" onclick="openRiderModal(${r.id})">Details</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRiders() {
    const term = document.getElementById('search-rider').value.toLowerCase();
    const filtered = verifiedRiders.filter(r =>
        r.name.toLowerCase().includes(term) ||
        (r.email && r.email.toLowerCase().includes(term)) ||
        (r.serviceZone && r.serviceZone.toLowerCase().includes(term))
    );
    renderRiders(filtered);
}

function openRiderModal(id) {
    const rider = verifiedRiders.find(r => r.id === id);
    if (!rider) return;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-lg font-bold mb-4">Rider Profile</h3>
                <div class="space-y-3 text-sm">
                    <p><span class="text-gray-400">Name:</span> ${rider.name}</p>
                    <p><span class="text-gray-400">Email:</span> ${rider.email}</p>
                    <p><span class="text-gray-400">Phone:</span> ${rider.phone}</p>
                    <p><span class="text-gray-400">Joined Date:</span> ${rider.joinedDate}</p>
                </div>
            </div>
            <div>
                <h3 class="text-lg font-bold mb-4">Service Details</h3>
                <div class="space-y-3 text-sm">
                    <p><span class="text-gray-400">Vehicle Type:</span> ${rider.vehicleType}</p>
                    <p><span class="text-gray-400">Vehicle Number:</span> ${rider.vehicleNumber}</p>
                    <p><span class="text-gray-400">Service Zone:</span> ${rider.serviceZone}</p>
                </div>
            </div>
        </div>
        
        <div class="mt-6 border-t border-gray-700 pt-4">
            <h3 class="text-lg font-bold mb-4">Performance Stats</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-gray-800 p-3 rounded">
                    <p class="text-2xl font-bold text-blue-400">${rider.totalDeliveries}</p>
                    <p class="text-xs text-gray-400">Total Deliveries</p>
                </div>
                <div class="bg-gray-800 p-3 rounded">
                    <p class="text-2xl font-bold text-yellow-400">${rider.averageRating}</p>
                    <p class="text-xs text-gray-400">Avg Rating</p>
                </div>
                <div class="bg-gray-800 p-3 rounded">
                    <p class="text-2xl font-bold text-green-400">₹${rider.totalEarnings}</p>
                    <p class="text-xs text-gray-400">Earnings</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('rider-modal').classList.remove('hidden');
}

function closeRiderModal() {
    document.getElementById('rider-modal').classList.add('hidden');
}

// Suspend/Reactivate would need backend support for state change
function suspendRider() {
    alert("Suspend functionality requires backend implementation");
    closeRiderModal();
}

function reactivateRider() {
    alert("Reactivate functionality requires backend implementation");
    closeRiderModal();
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
    fetchVerifiedRiders();
    setTimeout(onScroll, 100);
});
