// Settings Page JavaScript
lucide.createIcons();

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
    const total = cart.reduce((s, i) => s + i.quantity, 0);

    if (total > 0) {
        badge.textContent = total;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

updateCartBadge();
