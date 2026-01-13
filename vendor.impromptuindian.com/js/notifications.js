(function () {
    // Standardize API access
    if (typeof window.ImpromptuIndianApi === 'undefined') {
        window.ImpromptuIndianApi = (() => {
            const rawBase =
                window.IMPROMPTU_INDIAN_API_BASE ||
                window.APP_API_BASE ||
                localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
                '';

            let base = rawBase.trim().replace(/\/$/, '');
            if (!base) {
                const origin = window.location.origin;
                if (origin && origin.startsWith('http')) {
                    base = origin.replace(/\/$/, '');
                } else {
                    base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
                }
            }

            const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

            return {
                baseUrl: base,
                buildUrl,
                fetch: (path, options = {}) => fetch(buildUrl(path), options)
            };
        })();
    }

    const ImpromptuIndianApi = window.ImpromptuIndianApi;

    let notifications = [];
    let currentFilter = 'all';

    async function fetchNotifications() {
        const vendorId = localStorage.getItem('user_id');
        if (!vendorId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await ImpromptuIndianApi.fetch(`/api/vendor/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const notificationsData = data.notifications || data;
                notifications = notificationsData.map(n => ({
                    id: n.id,
                    type: n.type || 'system',
                    title: n.title,
                    message: n.message,
                    time: new Date(n.created_at),
                    read: n.is_read
                }));
                renderNotifications();
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
        }
    }

    function getIcon(type) {
        const icons = {
            orders: 'shopping-bag',
            payments: 'dollar-sign',
            deadlines: 'clock',
            verification: 'shield-check',
            system: 'settings'
        };
        return icons[type] || 'bell';
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function renderNotifications() {
        const filtered = currentFilter === 'all' ? notifications : notifications.filter(n => n.type === currentFilter);
        const list = document.getElementById('notifications-list');

        if (!list) return;

        if (filtered.length === 0) {
            list.innerHTML = '<div class="empty-state text-center py-10"><i data-lucide="inbox" class="w-12 h-12 text-gray-600 mb-3 mx-auto"></i><p class="text-gray-400">No notifications</p></div>';
            if (window.lucide) lucide.createIcons();
            return;
        }

        list.innerHTML = filtered.map(notif => `
            <div class="notif-item ${notif.read ? 'read' : 'unread'}" onclick="markAsRead(${notif.id})">
                <div class="notif-icon ${notif.type}">
                    <i data-lucide="${getIcon(notif.type)}" class="w-5 h-5"></i>
                </div>
                <div class="notif-content">
                    <h4 class="notif-title">${notif.title}</h4>
                    <p class="notif-message">${notif.message}</p>
                    <p class="notif-time">${getTimeAgo(notif.time)}</p>
                </div>
                ${!notif.read ? '<div class="notif-badge"></div>' : ''}
            </div>
        `).join('');

        updateCount();
        if (window.lucide) lucide.createIcons();
    }

    function updateCount() {
        const unread = notifications.filter(n => !n.read).length;
        const el = document.getElementById('notif-count');
        if (el) el.textContent = `${unread} unread notification${unread !== 1 ? 's' : ''}`;
    }

    function filterNotifications(type) {
        currentFilter = type;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        }
        renderNotifications();
    }

    async function markAsRead(id) {
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            try {
                const response = await ImpromptuIndianApi.fetch(`/vendor/notifications/${id}/read`, {
                    method: 'POST'
                });
                if (response.ok) {
                    notif.read = true;
                    renderNotifications();
                }
            } catch (e) {
                console.error('Error marking as read:', e);
            }
        }
    }

    async function markAllAsRead() {
        const unread = notifications.filter(n => !n.read);
        for (const notif of unread) {
            await markAsRead(notif.id);
        }
        showToast('All notifications marked as read');
    }

    function showToast(message) {
        const toast = document.getElementById('success-toast');
        if (!toast) return;
        const messageEl = document.getElementById('toast-message');
        if (messageEl) messageEl.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        fetchNotifications();
        setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('show')), 100);
        if (window.lucide) lucide.createIcons();
    });

    // Global Exports
    window.markAsRead = markAsRead;
    window.markAllAsRead = markAllAsRead;
    window.filterNotifications = filterNotifications;
    window.fetchNotifications = fetchNotifications;

})();
