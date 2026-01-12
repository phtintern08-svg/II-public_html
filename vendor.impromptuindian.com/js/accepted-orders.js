// Vendor Accepted Orders Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const mockOrders = [
    {
        id: "ORD-001",
        customerName: "Alice Johnson",
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        status: "In Progress",
        quantity: 50,
        vendorName: "Creative Printz"
    },
    {
        id: "ORD-005",
        customerName: "Ethan Hunt",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: "In Progress",
        quantity: 200,
        vendorName: "Creative Printz"
    },
    {
        id: "ORD-003",
        customerName: "Charlie Brown",
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        status: "Accepted",
        quantity: 75,
        vendorName: "Creative Printz"
    }
];

/* ---------------------------
   STATE
---------------------------*/
let orders = [...mockOrders];
let isUpdating = null;
let countdownIntervals = {};

/* ---------------------------
   COUNTDOWN TIMER
---------------------------*/
function formatTimeRemaining(deadline) {
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) {
        return { text: 'Deadline passed', isOverdue: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return { text: `in ${days} day${days > 1 ? 's' : ''}`, isOverdue: false };
    } else if (hours > 0) {
        return { text: `in ${hours} hour${hours > 1 ? 's' : ''}`, isOverdue: false };
    } else {
        return { text: `in ${minutes} minute${minutes > 1 ? 's' : ''}`, isOverdue: false };
    }
}

function updateCountdown(orderId, deadline) {
    const element = document.getElementById(`countdown-${orderId}`);
    if (element) {
        const { text, isOverdue } = formatTimeRemaining(deadline);
        element.textContent = text;

        if (isOverdue) {
            element.classList.add('text-red-500');
        } else {
            element.classList.remove('text-red-500');
        }
    }
}

function startCountdown(orderId, deadline) {
    // Clear existing interval if any
    if (countdownIntervals[orderId]) {
        clearInterval(countdownIntervals[orderId]);
    }

    // Update immediately
    updateCountdown(orderId, deadline);

    // Update every minute
    countdownIntervals[orderId] = setInterval(() => {
        updateCountdown(orderId, deadline);
    }, 60000); // Update every minute
}

/* ---------------------------
   RENDER FUNCTIONS
---------------------------*/
function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');

    // Filter orders for current vendor (not delivered)
    const vendorOrders = orders.filter(o =>
        o.vendorName === 'Creative Printz' && o.status !== 'Delivered'
    );

    if (vendorOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-gray-400 py-8">
                    No active orders at the moment.
                </td>
            </tr>
        `;
        return;
    }

    const html = vendorOrders.map(order => `
        <tr>
            <td class="font-medium">${order.id}</td>
            <td>${order.customerName}</td>
            <td>
                <div class="flex items-center gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-gray-400"></i>
                    <span id="countdown-${order.id}" class="countdown-text"></span>
                </div>
            </td>
            <td>
                <div class="flex items-center gap-2">
                    <select 
                        class="status-select" 
                        data-order-id="${order.id}"
                        ${isUpdating === order.id ? 'disabled' : ''}
                    >
                        <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                        <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    ${isUpdating === order.id ? '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>' : ''}
                </div>
            </td>
            <td class="text-right">${order.quantity}</td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    lucide.createIcons();

    // Start countdowns for all orders
    vendorOrders.forEach(order => {
        startCountdown(order.id, order.deadline);
    });

    // Attach event listeners to status selects
    attachStatusChangeListeners();
}

/* ---------------------------
   STATUS UPDATE
---------------------------*/
function attachStatusChangeListeners() {
    const selects = document.querySelectorAll('.status-select');

    selects.forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;

            await handleStatusChange(orderId, newStatus);
        });
    });
}

async function handleStatusChange(orderId, newStatus) {
    isUpdating = orderId;
    renderOrdersTable();

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update order status
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;

        showToast(`Order status updated to ${newStatus}`);

        isUpdating = null;
        renderOrdersTable();
    }
}

/* ---------------------------
   TOAST NOTIFICATION
---------------------------*/
function showToast(message) {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    messageEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

/* ---------------------------
   CLEANUP
---------------------------*/
function cleanup() {
    // Clear all countdown intervals
    Object.values(countdownIntervals).forEach(interval => {
        clearInterval(interval);
    });
    countdownIntervals = {};
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    renderOrdersTable();

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add("show");
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener("scroll", revealOnScroll);
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
