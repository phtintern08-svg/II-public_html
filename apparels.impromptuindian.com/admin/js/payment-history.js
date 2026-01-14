// payment-history.js – admin view of all payment transactions

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Payment transactions data
let payments = [];

// Fetch payments from backend
async function fetchPayments() {
    try {
        const response = await ImpromptuIndianApi.fetch('/api/admin/payments');

        console.log('Payment fetch response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch payments: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
        }

        payments = await response.json();
        console.log('Payments fetched:', payments);
        renderPayments();
    } catch (e) {
        console.error('Failed to fetch payments', e);
        showToast('Failed to load payment history: ' + e.message);

        // Show error in table
        const tbody = document.getElementById('payments-table');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-8 text-red-400">
                    <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>Error loading payment history</p>
                    <p class="text-sm text-gray-500 mt-2">${e.message}</p>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

function renderPayments() {
    const tbody = document.getElementById('payments-table');
    tbody.innerHTML = '';

    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-400">
                    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>No payment records found</p>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    payments.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors';

        const paymentDate = p.processed_at || p.created_at;
        const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN') : 'N/A';

        // Payment method icon
        let methodIcon = 'credit-card';
        if (p.payment_method === 'upi') methodIcon = 'smartphone';
        else if (p.payment_method === 'netbanking') methodIcon = 'banknote';
        else if (p.payment_method === 'cod') methodIcon = 'wallet';

        // Status badge
        let statusClass = 'bg-gray-500/20 text-gray-400';
        if (p.status === 'success') statusClass = 'bg-green-500/20 text-green-400';
        else if (p.status === 'pending') statusClass = 'bg-yellow-500/20 text-yellow-400';
        else if (p.status === 'failed') statusClass = 'bg-red-500/20 text-red-400';

        tr.innerHTML = `
            <td class="px-4 py-4">
                <span class="font-mono text-blue-400">${p.transaction_id}</span>
            </td>
            <td class="px-4 py-4">
                <div class="flex flex-col">
                    <span class="font-semibold">${p.customer_name}</span>
                    <span class="text-xs text-gray-500">${p.customer_email}</span>
                </div>
            </td>
            <td class="px-4 py-4">
                <span class="text-gray-300">#${p.order_id}</span>
            </td>
            <td class="px-4 py-4">
                <span class="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold">
                    ${p.order_product}
                </span>
            </td>
            <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                    <i data-lucide="${methodIcon}" class="w-4 h-4 text-gray-400"></i>
                    <span class="capitalize text-gray-300">${p.payment_method}</span>
                </div>
            </td>
            <td class="px-4 py-4 font-bold text-yellow-400">
                ₹${p.amount.toLocaleString('en-IN')}
            </td>
            <td class="px-4 py-4">
                <span class="text-gray-400 text-sm">${formattedDate}</span>
            </td>
            <td class="px-4 py-4">
                <span class="px-2 py-1 rounded-full ${statusClass} text-xs font-bold uppercase">
                    ${p.status}
                </span>
            </td>
            <td class="px-4 py-4 text-right">
                <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" 
                    onclick="viewDetails(${p.id})">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

function filterPayments() {
    const status = document.getElementById('status-filter')?.value || 'all';
    const term = document.getElementById('search-vendor')?.value.toLowerCase() || '';

    const filtered = payments.filter(p => {
        const matchStatus = status === 'all' || p.status === status;
        const matchTerm =
            p.customer_name.toLowerCase().includes(term) ||
            p.transaction_id.toLowerCase().includes(term) ||
            p.order_id.toString().includes(term);
        return matchStatus && matchTerm;
    });

    const tbody = document.getElementById('payments-table');
    tbody.innerHTML = '';

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors';

        const paymentDate = p.processed_at || p.created_at;
        const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN') : 'N/A';

        let methodIcon = 'credit-card';
        if (p.payment_method === 'upi') methodIcon = 'smartphone';
        else if (p.payment_method === 'netbanking') methodIcon = 'banknote';
        else if (p.payment_method === 'cod') methodIcon = 'wallet';

        let statusClass = 'bg-gray-500/20 text-gray-400';
        if (p.status === 'success') statusClass = 'bg-green-500/20 text-green-400';
        else if (p.status === 'pending') statusClass = 'bg-yellow-500/20 text-yellow-400';
        else if (p.status === 'failed') statusClass = 'bg-red-500/20 text-red-400';

        tr.innerHTML = `
            <td class="px-4 py-4">
                <span class="font-mono text-blue-400">${p.transaction_id}</span>
            </td>
            <td class="px-4 py-4">
                <div class="flex flex-col">
                    <span class="font-semibold">${p.customer_name}</span>
                    <span class="text-xs text-gray-500">${p.customer_email}</span>
                </div>
            </td>
            <td class="px-4 py-4">
                <span class="text-gray-300">#${p.order_id}</span>
            </td>
            <td class="px-4 py-4">
                <span class="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold">
                    ${p.order_product}
                </span>
            </td>
            <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                    <i data-lucide="${methodIcon}" class="w-4 h-4 text-gray-400"></i>
                    <span class="capitalize text-gray-300">${p.payment_method}</span>
                </div>
            </td>
            <td class="px-4 py-4 font-bold text-yellow-400">
                ₹${p.amount.toLocaleString('en-IN')}
            </td>
            <td class="px-4 py-4">
                <span class="text-gray-400 text-sm">${formattedDate}</span>
            </td>
            <td class="px-4 py-4">
                <span class="px-2 py-1 rounded-full ${statusClass} text-xs font-bold uppercase">
                    ${p.status}
                </span>
            </td>
            <td class="px-4 py-4 text-right">
                <button class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-400 hover:text-white" 
                    onclick="viewDetails(${p.id})">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
}

async function viewDetails(paymentId) {
    try {
        const response = await ImpromptuIndianApi.fetch(`/api/admin/payments/${paymentId}`);
        if (!response.ok) throw new Error('Failed to fetch payment details');

        const payment = await response.json();

        // Parse payment details if it's JSON
        let paymentDetailsStr = 'N/A';
        if (payment.payment_details) {
            try {
                const details = JSON.parse(payment.payment_details);
                if (details.cardLast4) {
                    paymentDetailsStr = `Card ending in ${details.cardLast4}`;
                } else if (details.upiId) {
                    paymentDetailsStr = `UPI: ${details.upiId}`;
                } else if (details.bank) {
                    paymentDetailsStr = `Bank: ${details.bank}`;
                } else {
                    paymentDetailsStr = JSON.stringify(details);
                }
            } catch (e) {
                paymentDetailsStr = payment.payment_details;
            }
        }

        const message = `
Payment Details:
━━━━━━━━━━━━━━━━━━━━
Transaction ID: ${payment.transaction_id}
Customer: ${payment.customer.name}
Email: ${payment.customer.email}

Order ID: #${payment.order_id}
Product: ${payment.order.product_type}
Quantity: ${payment.order.quantity} pieces

Payment Method: ${payment.payment_method.toUpperCase()}
Payment Details: ${paymentDetailsStr}
Amount: ₹${payment.amount.toLocaleString('en-IN')}
Status: ${payment.status.toUpperCase()}

Created: ${new Date(payment.created_at).toLocaleString('en-IN')}
Processed: ${payment.processed_at ? new Date(payment.processed_at).toLocaleString('en-IN') : 'Pending'}
        `.trim();

        alert(message);
    } catch (e) {
        console.error('Error fetching payment details:', e);
        showToast('Failed to load payment details');
    }
}

function exportPayments() {
    let csv = 'Transaction ID,Customer,Email,Order ID,Product,Method,Amount,Date,Status\n';
    payments.forEach(p => {
        const date = p.processed_at || p.created_at;
        const formattedDate = date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
        csv += `${p.transaction_id},${p.customer_name},${p.customer_email},${p.order_id},${p.order_product},${p.payment_method},${p.amount},${formattedDate},${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Payment history exported successfully');
}

function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchPayments();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
