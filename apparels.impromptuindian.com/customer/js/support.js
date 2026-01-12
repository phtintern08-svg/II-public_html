// Support Page JavaScript
lucide.createIcons();

// Auto-highlight active sidebar link
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".menu-item").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.includes(currentPage)) link.classList.add("active");
});

// Accordion Logic
document.querySelectorAll(".accordion").forEach(acc => {
    acc.addEventListener("click", () => {
        acc.classList.toggle("accordion-active");
    });
});

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (total > 0) {
        badge.style.display = "flex";
        badge.textContent = total;
    } else {
        badge.style.display = "none";
    }
}

updateCartBadge();
