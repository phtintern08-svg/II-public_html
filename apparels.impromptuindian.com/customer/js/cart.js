// Cart Page JavaScript
const CART_KEY = "threadly_cart";

/* ------------------------------------------
   CART HELPERS
-------------------------------------------*/
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  // Update badge if it exists
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
    if (total > 0) {
      badge.textContent = total;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

/* ------------------------------------------
   RENDER CART PAGE
-------------------------------------------*/
function loadCartPage() {
  const main = document.getElementById("mainContent");
  const cart = getCart();

  if (cart.length === 0) {
    main.innerHTML = `
    <h1 class="text-3xl font-bold mb-2">Your Cart is Empty</h1>
    <p class="text-gray-400 mb-6">Looks like you haven't added anything to your cart yet.</p>

    <div class="border border-gray-600 border-dashed rounded-xl p-10 text-center">
      <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-500 mx-auto"></i>

      <button onclick="window.location='products.html'"
        class="mt-6 px-5 py-2 bg-[#FFCC00] hover:bg-yellow-400 rounded text-black font-semibold transition-colors">
        Start Shopping
      </button>
    </div>
  `;
    lucide.createIcons();
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50;
  const total = subtotal + shipping;

  main.innerHTML = `
  <h1 class="text-3xl font-bold mb-2">Your Cart</h1>
  <p class="text-gray-400 mb-6">Review your items before checkout.</p>

  <div class="bg-[#0b1220] rounded-xl divide-y border border-gray-700 mb-6" id="cartItems">
    ${cart.map(item => `
      <div class="p-5 flex items-center gap-4">
        <img src="${item.image}" class="w-20 h-20 rounded object-cover" />

        <div class="flex-1">
          <div class="font-semibold">${item.name}</div>
          <div class="text-gray-400 text-sm">${item.color} — ${item.size}</div>
          <div class="font-bold mt-1">₹${item.price}</div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="changeQty('${item.id}', -1)" class="px-3 py-1 border rounded border-gray-600 hover:bg-gray-700">-</button>
          <span class="w-8 text-center">${item.quantity}</span>
          <button onclick="changeQty('${item.id}', 1)" class="px-3 py-1 border rounded border-gray-600 hover:bg-gray-700">+</button>
        </div>

        <button onclick="removeItem('${item.id}')" class="text-red-400 hover:text-red-300">
          <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
      </div>
    `).join("")}
  </div>

  <div class="bg-[#0b1220] rounded-xl p-6 border border-gray-700">
    <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
      <i data-lucide="file-text" class="w-5 h-5 text-[#FFCC00]"></i>
      Order Summary
    </h2>

    <div class="space-y-4">
      <div class="flex justify-between items-center text-gray-300">
        <span class="text-sm font-medium">Subtotal</span>
        <span class="text-base font-semibold">₹${subtotal.toLocaleString()}</span>
      </div>

      <div class="flex justify-between items-center text-gray-300">
        <span class="text-sm font-medium">Shipping</span>
        <span class="text-base font-semibold">₹${shipping}</span>
      </div>

      <hr class="border-gray-700 my-4">

      <div class="flex justify-between items-center">
        <span class="text-lg font-bold text-white">Total</span>
        <span class="text-2xl font-bold text-[#FFCC00]">₹${total.toLocaleString()}</span>
      </div>
    </div>

    <button class="w-full mt-6 bg-[#FFCC00] hover:bg-yellow-400 py-3 rounded-lg text-black font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
      <i data-lucide="credit-card" class="w-5 h-5"></i>
      Proceed to Checkout
    </button>

    <button onclick="clearCart()" class="w-full mt-3 bg-[#1273EB] hover:bg-[#0e5ac0] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
      Clear Cart
    </button>
  </div>
`;

  lucide.createIcons();
}

/* ------------------------------------------
   CHANGE QUANTITY
-------------------------------------------*/
function changeQty(id, delta) {
  let cart = getCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(x => x.id !== id);
  }

  saveCart(cart);
  loadCartPage();
}

/* ------------------------------------------
   REMOVE ITEM
-------------------------------------------*/
function removeItem(id) {
  showAlert("Remove Item", "Remove this item from cart?", "confirm", () => {
    let cart = getCart().filter(x => x.id !== id);
    saveCart(cart);
    loadCartPage();
  });
}

/* ------------------------------------------
   CLEAR CART
-------------------------------------------*/
function clearCart() {
  showAlert("Clear Cart", "Are you sure you want to clear your entire cart?", "confirm", () => {
    localStorage.setItem(CART_KEY, "[]");
    saveCart([]);
    loadCartPage();
  });
}

/* INIT - Wait for DOM to be ready */
document.addEventListener('DOMContentLoaded', function () {
  // Wait a bit for sidebar to load
  setTimeout(() => {
    lucide.createIcons();
    loadCartPage();
  }, 100);
});
