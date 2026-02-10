document.addEventListener('DOMContentLoaded', () => {
    fetchDispatchOrders();
    lucide.createIcons();

    // Reveal animation for static elements
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

let dispatchOrders = [];
let selectedOrderId = null;

async function fetchDispatchOrders() {
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/orders?status=in_production`, {
            headers: {
                'Content-Type': 'application/json'
            },
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn('Authentication failed - redirecting to login');
                window.location.href = 'https://apparels.impromptuindian.com/login.html';
                return;
            }
            throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const responseData = await response.json();
        const allOrders = responseData.orders || responseData;

        // Filter for 'packed_ready' orders
        dispatchOrders = allOrders.filter(o => o.currentStage === 'packed_ready' || o.currentStage === 'packed');

        renderDispatchTable();
        updateUIState();
    } catch (error) {
        console.error('Error fetching dispatch orders:', error);
    }
}

function updateUIState() {
    const tableContainer = document.getElementById('list-view');
    const emptyState = document.getElementById('empty-state');

    if (dispatchOrders.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        tableContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
}

function renderDispatchTable() {
    const tbody = document.getElementById('dispatch-table-body');
    if (!tbody) return;

    tbody.innerHTML = dispatchOrders.map(order => {
        // Mock data for packed date if not available (since API mostly returns current state)
        // In real app, this might come from status history
        const packedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <tr class="reveal show border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-bold text-white text-sm tracking-tight">#${order.db_id}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-200 mb-1">${order.productType}</span>
                        <div class="flex items-center gap-2">
                             <span class="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                                ${order.quantity} Units
                            </span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                     <span class="text-xs font-mono text-gray-400 font-bold">${order.quantity} pcs</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 text-gray-400">
                        <i data-lucide="package-check" class="w-4 h-4 text-emerald-500"></i>
                        <span class="text-sm font-medium">Ready since ${packedDate}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                         <span class="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300">Standard Delivery</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="openDispatchModal(${order.db_id})" 
                        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-green-900/20 transition-all hover:scale-105">
                        <i data-lucide="truck" class="w-4 h-4"></i>
                        Dispatch
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function openDispatchModal(orderId) {
    selectedOrderId = orderId;
    document.getElementById('modal-order-id').textContent = `#ORD-${String(orderId).padStart(3, '0')}`;
    document.getElementById('dispatch-modal').classList.remove('hidden');
}

function closeDispatchModal() {
    document.getElementById('dispatch-modal').classList.add('hidden');
    selectedOrderId = null;
}

async function confirmDispatch() {
    if (!selectedOrderId) return;

    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)

    try {
        // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${selectedOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'dispatched',
                remarks: 'Order dispatched by vendor logistics.'
            })
        });

        if (!response.ok) throw new Error('Dispatch failed');

        // Success Feedback
        closeDispatchModal();

        // Optimistic update
        dispatchOrders = dispatchOrders.filter(o => o.db_id !== selectedOrderId);
        renderDispatchTable();
        updateUIState();

        alert('Order successfully dispatched!');

    } catch (error) {
        console.error('Dispatch error:', error);
        alert('Failed to dispatch order. Please try again.');
    }
}
