// Earnings Summary Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const earningsData = {
    totalEarnings: 45680,
    monthEarnings: 12234,
    lastMonthEarnings: 10650,
    pendingEarnings: 2450,
    nextPayoutDate: '2025-12-01',
    commissionRate: 15,
    monthlyData: [
        { month: 'Jul', earnings: 8500 },
        { month: 'Aug', earnings: 9200 },
        { month: 'Sep', earnings: 10650 },
        { month: 'Oct', earnings: 11400 },
        { month: 'Nov', earnings: 12234 },
        { month: 'Dec', earnings: 0 }
    ],
    transactions: [
        { orderId: 'ORD-002', date: '2025-11-20', customer: 'Bob Williams', gross: 450, commission: 67.50, net: 382.50 },
        { orderId: 'ORD-004', date: '2025-11-18', customer: 'Diana Prince', gross: 680, commission: 102, net: 578 },
        { orderId: 'ORD-006', date: '2025-11-15', customer: 'Frank Miller', gross: 920, commission: 138, net: 782 },
        { orderId: 'ORD-007', date: '2025-11-12', customer: 'Grace Lee', gross: 1200, commission: 180, net: 1020 },
        { orderId: 'ORD-011', date: '2025-11-08', customer: 'Henry Ford', gross: 540, commission: 81, net: 459 }
    ]
};

/* ---------------------------
   RENDER EARNINGS CARDS
---------------------------*/
function renderEarningsCards() {
    const monthChange = ((earningsData.monthEarnings - earningsData.lastMonthEarnings) / earningsData.lastMonthEarnings * 100).toFixed(1);
    const nextPayout = new Date(earningsData.nextPayoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    animateValue('total-earnings', 0, earningsData.totalEarnings, 1000, true);
    animateValue('month-earnings', 0, earningsData.monthEarnings, 1000, true);
    animateValue('pending-earnings', 0, earningsData.pendingEarnings, 1000, true);
    animateValue('commission-rate', 0, earningsData.commissionRate, 1000, false, '%');

    document.getElementById('month-change').textContent = `+${monthChange}% from last month`;
    document.getElementById('next-payout').textContent = `Next payout: ${nextPayout}`;
}

function animateValue(elementId, start, end, duration, isCurrency = false, suffix = '') {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }

        if (isCurrency) {
            element.textContent = '$' + Math.floor(current).toLocaleString();
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

/* ---------------------------
   EARNINGS CHART
---------------------------*/
function initializeEarningsChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: earningsData.monthlyData.map(d => d.month),
            datasets: [{
                label: 'Earnings',
                data: earningsData.monthlyData.map(d => d.earnings),
                backgroundColor: '#10b981',
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => '$' + context.parsed.y.toLocaleString()
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#9ca3af', font: { size: 12 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#9ca3af', font: { size: 12 }, callback: (value) => '$' + value }
                }
            }
        }
    });
}

/* ---------------------------
   COMMISSION BREAKDOWN
---------------------------*/
function renderCommissionBreakdown() {
    const breakdown = document.getElementById('commission-breakdown');
    const gross = earningsData.monthEarnings / (1 - earningsData.commissionRate / 100);
    const commission = gross - earningsData.monthEarnings;

    breakdown.innerHTML = `
        <div class="breakdown-item">
            <div class="breakdown-label">
                <span>Gross Earnings</span>
                <i data-lucide="info" class="w-4 h-4 text-gray-500"></i>
            </div>
            <div class="breakdown-value">$${gross.toFixed(2)}</div>
        </div>
        <div class="breakdown-item">
            <div class="breakdown-label">
                <span>Platform Commission (${earningsData.commissionRate}%)</span>
            </div>
            <div class="breakdown-value text-red-400">-$${commission.toFixed(2)}</div>
        </div>
        <div class="breakdown-separator"></div>
        <div class="breakdown-item breakdown-total">
            <div class="breakdown-label">
                <span>Net Earnings</span>
            </div>
            <div class="breakdown-value text-green-400">$${earningsData.monthEarnings.toLocaleString()}</div>
        </div>
    `;
    lucide.createIcons();
}

/* ---------------------------
   TRANSACTIONS TABLE
---------------------------*/
function renderTransactions() {
    const tbody = document.getElementById('transactions-table');

    const html = earningsData.transactions.map(txn => `
        <tr>
            <td class="font-medium">${txn.orderId}</td>
            <td>${new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
            <td>${txn.customer}</td>
            <td>$${txn.gross.toFixed(2)}</td>
            <td class="text-red-400">-$${txn.commission.toFixed(2)}</td>
            <td class="text-right text-green-400 font-semibold">$${txn.net.toFixed(2)}</td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
}

/* ---------------------------
   DOWNLOAD STATEMENT
---------------------------*/
function downloadStatement() {
    showToast('Downloading monthly statement...');
    // In real app, generate and download PDF
}

/* ---------------------------
   TOAST
---------------------------*/
function showToast(message) {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    messageEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderEarningsCards();
        initializeEarningsChart();
        renderCommissionBreakdown();
        renderTransactions();
    }, 300);

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
