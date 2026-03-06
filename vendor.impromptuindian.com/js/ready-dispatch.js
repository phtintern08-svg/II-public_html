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
    
    // Pre-fill delivery time with current time rounded up to next hour (12-hour format)
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const hour12 = nextHour.getHours() % 12 || 12;
    const minute = String(nextHour.getMinutes()).padStart(2, '0');
    const ampm = nextHour.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('delivery-time').value = `${hour12}:${minute}`;
    document.getElementById('delivery-ampm').value = ampm;
    
    // Add phone number input validation
    setupPhoneValidation();
}

function setupPhoneValidation() {
    const phoneInput = document.getElementById('rider-phone');
    if (!phoneInput) return;
    
    // Remove existing event listeners by cloning and replacing
    const newPhoneInput = phoneInput.cloneNode(true);
    phoneInput.parentNode.replaceChild(newPhoneInput, phoneInput);
    
    // Format input as user types (allow spaces/dashes, but show formatted)
    newPhoneInput.addEventListener('input', function(e) {
        let value = e.target.value;
        
        // Remove all non-digit characters except + at the start
        value = value.replace(/[^\d+]/g, '');
        
        // Remove +91 if present at start
        if (value.startsWith('+91')) {
            value = value.substring(3);
        } else if (value.startsWith('91') && value.length > 10) {
            value = value.substring(2);
        }
        
        // Limit to 10 digits
        value = value.substring(0, 10);
        
        // Update the input value
        e.target.value = value;
        
        // Validate and update border color
        validatePhoneNumber(e.target);
    });
    
    // Validate on blur
    newPhoneInput.addEventListener('blur', function(e) {
        validatePhoneNumber(e.target);
    });
}

function validatePhoneNumber(input) {
    const value = sanitizePhoneNumber(input.value);
    const phonePattern = /^[6-9]\d{9}$/;
    const isValid = phonePattern.test(value);
    
    if (value && !isValid) {
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-700', 'border-green-500');
    } else if (value && isValid) {
        input.classList.add('border-green-500');
        input.classList.remove('border-gray-700', 'border-red-500');
    } else {
        input.classList.remove('border-red-500', 'border-green-500');
        input.classList.add('border-gray-700');
    }
    
    return isValid;
}

function sanitizePhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove country code if present (+91 or 91)
    if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = cleaned.substring(2);
    }
    
    // Return only the 10-digit number
    return cleaned.substring(0, 10);
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
    document.getElementById('delivery-time').value = '';
    document.getElementById('delivery-ampm').value = 'AM';
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
        let riderPhone = document.getElementById("rider-phone").value.trim();
        const time = document.getElementById("delivery-time").value.trim();
        const ampm = document.getElementById("delivery-ampm").value;

        if (!riderName || !riderPhone || !time) {
            alert("Please fill all rider details including delivery time");
            return;
        }

        // Sanitize and validate phone number
        riderPhone = sanitizePhoneNumber(riderPhone);
        const phonePattern = /^[6-9]\d{9}$/;
        
        if (!phonePattern.test(riderPhone)) {
            alert("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9");
            document.getElementById("rider-phone").focus();
            return;
        }

        // Validate time format (HH:MM or H:MM)
        const timePattern = /^([0-9]|1[0-2]):[0-5][0-9]$/;
        if (!timePattern.test(time)) {
            alert("Please enter valid time format (e.g., 4:00 or 12:30)");
            return;
        }

        deliveryTime = `by ${time} ${ampm}`;
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
