// Vendor Analytics Page JavaScript
lucide.createIcons();

/* ---------------------------
   CHART DATA
---------------------------*/
const chartData = [
    { month: 'January', revenue: 1860 },
    { month: 'February', revenue: 3050 },
    { month: 'March', revenue: 2370 },
    { month: 'April', revenue: 730 },
    { month: 'May', revenue: 2090 },
    { month: 'June', revenue: 2140 },
];

/* ---------------------------
   INITIALIZE CHART
---------------------------*/
function initializeChart() {
    const ctx = document.getElementById('revenueChart');

    if (!ctx) return;

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.month),
            datasets: [{
                label: 'Revenue',
                data: chartData.map(d => d.revenue),
                backgroundColor: '#3b82f6',
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    return chart;
}

/* ---------------------------
   ANIMATE STATS
---------------------------*/
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        // Format based on the element's original content
        const originalText = element.dataset.originalValue;
        if (originalText.includes('$')) {
            element.textContent = '$' + Math.floor(current).toLocaleString();
        } else if (originalText.includes('%')) {
            element.textContent = Math.floor(current) + '%';
        } else if (originalText.includes('.')) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(element => {
        const text = element.textContent;
        element.dataset.originalValue = text;

        // Extract numeric value
        let numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));

        if (!isNaN(numericValue)) {
            element.textContent = text.replace(/[0-9.]+/, '0');

            // Delay animation slightly for stagger effect
            setTimeout(() => {
                animateValue(element, 0, numericValue, 1000);
            }, 300);
        }
    });
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chart
    initializeChart();

    // Animate stats on load
    setTimeout(animateStats, 500);

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
