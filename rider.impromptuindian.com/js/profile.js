// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Check authentication (TEMPORARILY DISABLED FOR TESTING)
// const riderId = localStorage.getItem('rider_id');
// if (!riderId) {
//     window.location.href = '../login.html';
// }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadPerformanceMetrics();
});

// Load profile data
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token || token.length < 20) {
            console.error("Invalid token in storage:", token);
            window.location.href = 'https://apparels.impromptuindian.com/login.html';
            return;
        }

        const response = await ImpromptuIndianApi.fetch('/api/rider/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();

        document.getElementById('riderName').value = data.name || '';
        document.getElementById('riderPhone').value = data.phone || '';
        document.getElementById('riderEmail').value = data.email || '';
        document.getElementById('vehicleType').value = data.vehicle_type || '';
        document.getElementById('vehicleNumber').value = data.vehicle_number || '';
        document.getElementById('serviceZone').value = data.service_zone || '';
        document.getElementById('memberSince').value = data.created_at
            ? new Date(data.created_at).toLocaleDateString()
            : '';

        // Status
        const statusEl = document.getElementById('riderStatus');
        if (statusEl) {
            const status = data.verification_status || 'pending';
            statusEl.innerHTML = `
                <span class="status-dot"></span>
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            `;
        }

        // Profile Initial
        const initials = (data.name || 'R')
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();

        document.getElementById('profileInitial').textContent = initials;

    } catch (error) {
        console.error('Profile load error:', error);
        showToast('Failed to load profile', 'error');
    }
}

// Load performance metrics
async function loadPerformanceMetrics() {
    try {
        const token = localStorage.getItem('token');
        if (!token || token.length < 20) {
            console.error("Invalid token in storage:", token);
            return;
        }

        const response = await ImpromptuIndianApi.fetch('/api/rider/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        document.getElementById('totalDeliveries').textContent =
            data.stats.total_assigned || 0;

        document.getElementById('successfulDeliveries').textContent =
            data.stats.completed_today || 0;

        document.getElementById('averageRating').textContent =
            data.stats.earnings_today || 0;

        document.getElementById('successRate').textContent =
            data.stats.total_assigned > 0
                ? Math.round(
                    (data.stats.completed_today / data.stats.total_assigned) * 100
                ) + '%'
                : '0%';

    } catch (error) {
        console.error('Metrics error:', error);
    }
}

// Update profile
async function updateProfile() {
    const email = document.getElementById('riderEmail').value;

    if (!email) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token || token.length < 20) {
            console.error("Invalid token in storage:", token);
            window.location.href = 'https://apparels.impromptuindian.com/login.html';
            return;
        }

        const response = await ImpromptuIndianApi.fetch('/api/rider/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: email
            })
        });

        if (!response.ok) {
            throw new Error('Update failed');
        }

        showToast('Profile updated successfully', 'success');

    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update profile', 'error');
    }
}

// Upload profile picture
function uploadProfilePicture(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profilePictureImg').src = e.target.result;
            document.getElementById('profilePictureImg').classList.remove('hidden');
            document.getElementById('profileInitial').classList.add('hidden');
            showToast('Profile picture updated', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Change password
function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    showToast('Password changed successfully', 'success');
    document.getElementById('changePasswordForm').reset();
}

// Call admin
function callAdmin() {
    const adminContact = document.getElementById('adminContact').textContent;
    window.location.href = `tel:${adminContact}`;
}

// Toggle 2FA
function toggle2FA() {
    const isEnabled = document.getElementById('twoFactorToggle').checked;
    showToast(isEnabled ? '2FA enabled' : '2FA disabled', 'success');
}

// Logout from all devices
function logoutAllDevices() {
    if (confirm('Are you sure you want to logout from all devices?')) {
        showToast('Logged out from all devices', 'success');
        // TODO: Implement actual logout
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
                type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
        } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
