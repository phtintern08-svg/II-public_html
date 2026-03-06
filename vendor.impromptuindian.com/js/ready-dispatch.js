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
        // 🔥 FIX: Fetch packed_ready orders directly - backend will filter correctly
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/orders?status=packed_ready`, {
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
        // Backend already filters to packed_ready, no need for frontend filtering
        dispatchOrders = responseData.orders || responseData;

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
        const orderDbId = order.db_id || (order.id && order.id.toString().replace('ORD-', '')) || order.id;
        const displayId = order.id || `ORD-${String(orderDbId).padStart(3, '0')}`;

        return `
            <tr class="reveal show border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-bold text-white text-sm tracking-tight">#${displayId}</span>
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
                    <button onclick="openDispatchModal(${orderDbId})" 
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
    // 🔥 FIX: Store db_id (numeric) for API calls, keep display ID for UI
    selectedOrderId = orderId;
    const order = dispatchOrders.find(o => o.db_id === orderId || o.id === orderId);
    const displayId = order ? (order.id || `ORD-${String(orderId).padStart(3, '0')}`) : `ORD-${String(orderId).padStart(3, '0')}`;
    document.getElementById('modal-order-id').textContent = `#${displayId}`;
    document.getElementById('dispatch-modal').classList.remove('hidden');
    
    // Pre-fill delivery start time with current time rounded up to next hour (12-hour format)
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const startHour12 = nextHour.getHours() % 12 || 12;
    const startMinute = String(nextHour.getMinutes()).padStart(2, '0');
    const startAMPM = nextHour.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('delivery-start').value = `${startHour12}:${startMinute}`;
    document.getElementById('delivery-start-ampm').value = startAMPM;
    
    // Pre-fill end time as 2 hours after start time
    const endTime = new Date(nextHour);
    endTime.setHours(endTime.getHours() + 2);
    const endHour12 = endTime.getHours() % 12 || 12;
    const endMinute = String(endTime.getMinutes()).padStart(2, '0');
    const endAMPM = endTime.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('delivery-end').value = `${endHour12}:${endMinute}`;
    document.getElementById('delivery-end-ampm').value = endAMPM;
}

function closeDispatchModal() {
    document.getElementById('dispatch-modal').classList.add('hidden');
    selectedOrderId = null;
    
    // Reset form
    document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
        radio.checked = false;
    });
    document.getElementById('rider-section').classList.add('hidden');
    document.getElementById('rider-name').value = '';
    document.getElementById('rider-phone').value = '';
    document.getElementById('delivery-start').value = '';
    document.getElementById('delivery-start-ampm').value = 'AM';
    document.getElementById('delivery-end').value = '';
    document.getElementById('delivery-end-ampm').value = 'AM';
}

function toggleDeliveryFields() {
    const method = document.querySelector('input[name="delivery-method"]:checked')?.value;
    const riderSection = document.getElementById("rider-section");

    if (method === "inhouse") {
        riderSection.classList.remove("hidden");
    } else {
        riderSection.classList.add("hidden");
    }
}

function updateDeliveryCardStyles() {
    // This function ensures the card styles update when radio buttons change
    // The CSS handles most of it, but this ensures consistency
    const cards = document.querySelectorAll('.delivery-option-card');
    cards.forEach(card => {
        const radio = card.querySelector('input[type="radio"]');
        const inner = card.querySelector('.delivery-card-inner');
        if (radio.checked) {
            inner.classList.add('ring-2');
        } else {
            inner.classList.remove('ring-2');
        }
    });
}

function convertTo24Hour(time12, ampm) {
    // time12 format: "4:00" or "12:30"
    const [hours, minutes] = time12.split(':').map(Number);
    let hours24 = hours;
    
    if (ampm === 'PM' && hours !== 12) {
        hours24 = hours + 12;
    } else if (ampm === 'AM' && hours === 12) {
        hours24 = 0;
    }
    
    return hours24 * 60 + minutes; // Return minutes since midnight for easy comparison
}

async function confirmDispatch() {
    if (!selectedOrderId) return;

    const method = document.querySelector('input[name="delivery-method"]:checked')?.value;

    if (!method) {
        alert("Please select delivery option");
        return;
    }

    let riderName = null;
    let riderPhone = null;
    let deliveryTime = null;

    if (method === "inhouse") {
        riderName = document.getElementById("rider-name").value.trim();
        riderPhone = document.getElementById("rider-phone").value.trim();
        const startTime = document.getElementById("delivery-start").value.trim();
        const startAMPM = document.getElementById("delivery-start-ampm").value;
        const endTime = document.getElementById("delivery-end").value.trim();
        const endAMPM = document.getElementById("delivery-end-ampm").value;

        if (!riderName || !riderPhone || !startTime || !endTime) {
            alert("Please fill all rider details including delivery time window");
            return;
        }

        // Validate time format (HH:MM or H:MM)
        const timePattern = /^([0-9]|1[0-2]):[0-5][0-9]$/;
        if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
            alert("Please enter valid time format (e.g., 4:00 or 12:30)");
            return;
        }

        // Convert to 24-hour format for comparison
        const start24 = convertTo24Hour(startTime, startAMPM);
        const end24 = convertTo24Hour(endTime, endAMPM);

        // Validate that end time is after start time
        if (start24 >= end24) {
            alert("End time must be after start time");
            return;
        }

        deliveryTime = `${startTime} ${startAMPM} - ${endTime} ${endAMPM}`;
    }

    try {
        // 🔥 FIX: Use correct vendor endpoint with db_id (numeric ID)
        const response = await ImpromptuIndianApi.fetch(
            `/api/vendor/orders/${selectedOrderId}/production-stage`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stage_id: 'dispatched',
                    delivery_method: method,
                    rider_name: riderName,
                    rider_phone: riderPhone,
                    expected_delivery: deliveryTime,
                    notes: method === 'inhouse' 
                        ? `Order dispatched with in-house rider: ${riderName}` 
                        : 'Order dispatched - platform rider will be assigned automatically.'
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Dispatch failed');
        }

        // Success Feedback
        closeDispatchModal();

        // Optimistic update
        dispatchOrders = dispatchOrders.filter(o => o.db_id !== selectedOrderId);
        renderDispatchTable();
        updateUIState();

        // 🔥 FIX: Refresh order stats immediately for real-time update
        if (window.fetchOrderStats) {
            window.fetchOrderStats();
        }

        alert('Order successfully dispatched!');

    } catch (error) {
        console.error('Dispatch error:', error);
        alert('Failed to dispatch order. Please try again.');
    }
}
