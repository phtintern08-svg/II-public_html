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
function loadProfile() {
    // Sample data
    document.getElementById('riderName').value = 'John Doe';
    document.getElementById('riderPhone').value = '9876543210';
    document.getElementById('riderEmail').value = 'john.doe@example.com';
    document.getElementById('vehicleType').value = 'Bike';
    document.getElementById('vehicleNumber').value = 'KA01AB1234';
    document.getElementById('serviceZone').value = 'Bangalore Central';
    document.getElementById('memberSince').value = '15 Nov 2024';
    document.getElementById('adminContact').textContent = '+91 9999999999';

    // Set profile initial
    document.getElementById('profileInitial').textContent = 'JD';
}

// Load performance metrics
function loadPerformanceMetrics() {
    document.getElementById('totalDeliveries').textContent = '45';
    document.getElementById('successfulDeliveries').textContent = '42';
    document.getElementById('averageRating').textContent = '4.7';
    document.getElementById('successRate').textContent = '93%';
}

// Update profile
function updateProfile() {
    const email = document.getElementById('riderEmail').value;

    if (!email) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    showToast('Profile updated successfully', 'success');
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
