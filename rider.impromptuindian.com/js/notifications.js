// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Check authentication (TEMPORARILY DISABLED FOR TESTING)
// const riderId = localStorage.getItem('rider_id');
// if (!riderId) {
//     window.location.href = '../login.html';
// }

// Global state
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});

// Load notifications
function loadNotifications() {
    const container = document.getElementById('notificationsContainer');

    // Sample notifications
    const notifications = [
        {
            id: 1,
            type: 'job',
            title: 'New Delivery Assigned',
            message: 'Order #ORD125 has been assigned to you. Pickup from ABC Textiles.',
            time: '5 minutes ago',
            unread: true
        },
        {
            id: 2,
            type: 'payment',
            title: 'Payout Released',
            message: 'Your payout of ₹5,000 has been transferred to your account.',
            time: '2 hours ago',
            unread: true
        },
        {
            id: 3,
            type: 'admin',
            title: 'Important Notice',
            message: 'Please update your vehicle documents before 15th December.',
            time: '1 day ago',
            unread: false
        },
        {
            id: 4,
            type: 'system',
            title: 'App Update Available',
            message: 'A new version of the app is available. Please update for better performance.',
            time: '2 days ago',
            unread: false
        }
    ];

    displayNotifications(notifications);
}

// Display notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsContainer');

    const filtered = currentFilter === 'all' ? notifications :
        currentFilter === 'unread' ? notifications.filter(n => n.unread) :
            notifications.filter(n => n.type === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="info-card text-center py-12">
                <i data-lucide="inbox" class="w-16 h-16 mx-auto mb-4 text-muted"></i>
                <p class="text-lg text-muted">No notifications found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map(notification => `
        <div class="notification-item ${notification.unread ? 'unread' : ''}" onclick="markAsRead(${notification.id})">
            <div class="notification-header">
                <div class="notification-icon ${notification.type}">
                    <i data-lucide="${getNotificationIcon(notification.type)}" class="w-5 h-5"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        ${notification.time}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

// Filter notifications
function filterNotifications(filter) {
    currentFilter = filter;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    loadNotifications();
}

// Mark as read
function markAsRead(notificationId) {
    showToast('Notification marked as read', 'success');
    // TODO: Implement actual mark as read functionality
}

// Mark all as read
function markAllAsRead() {
    showToast('All notifications marked as read', 'success');
    loadNotifications();
}

// Get notification icon
function getNotificationIcon(type) {
    switch (type) {
        case 'job': return 'package';
        case 'payment': return 'dollar-sign';
        case 'admin': return 'user';
        case 'system': return 'bell';
        default: return 'bell';
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
