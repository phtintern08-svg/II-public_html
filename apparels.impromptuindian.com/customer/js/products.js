// Products Page JavaScript
lucide.createIcons();

const CART_KEY = "threadly_cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(c) {
  localStorage.setItem(CART_KEY, JSON.stringify(c));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  const count = getCart().reduce((a, b) => a + b.quantity, 0);

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* SAMPLE PRODUCTS */
const products = [
  { id: "p1", name: "Basic Tee", color: "Black", size: "S", price: 1200, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80" },
  { id: "p2", name: "Basic Tee", color: "Black", size: "M", price: 1200, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80" },
  { id: "p3", name: "Basic Tee", color: "Black", size: "L", price: 1200, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80" },
  { id: "p4", name: "Basic Tee", color: "White", size: "M", price: 1200, image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80" },
];

/* TEMPLATE BUTTONS */
function addBtn(id) {
  return `
    <button onclick="addToCart('${id}')"
      class="w-full bg-[#FFCC00] hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
      <i data-lucide="shopping-cart" class="w-4 h-4"></i>
      Add to Cart
    </button>
  `;
}

function qtyControls(id, qty) {
  return `
    <div class="flex items-center gap-3">
      <button onclick="changeQty('${id}', -1)" class="px-3 py-1 border rounded">-</button>
      <span id="qty-${id}" class="font-bold">${qty}</span>
      <button onclick="changeQty('${id}', 1)" class="px-3 py-1 border rounded">+</button>
    </div>
  `;
}

/* RENDER PRODUCTS */
function renderProducts() {
  const cart = getCart();

  document.getElementById("productGrid").innerHTML = products.map(p => {
    const item = cart.find(x => x.id === p.id);
    return `
      <div class="bg-white text-black rounded-lg overflow-hidden">
        <img src="${p.image}" class="w-full h-40 object-cover">

        <div class="p-4">
          <div class="font-semibold">${p.name}</div>
          <div class="text-sm text-gray-500">${p.color} - ${p.size}</div>
          <div class="mt-2 font-bold">₹${p.price}</div>

          <div id="controls-${p.id}" class="mt-4">
            ${item ? qtyControls(p.id, item.quantity) : addBtn(p.id)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

/* ADD TO CART */
function addToCart(id) {
  let cart = getCart();
  const p = products.find(x => x.id === id);

  cart.push({ ...p, quantity: 1 });
  saveCart(cart);

  renderProducts();
}

/* CHANGE QTY */
function changeQty(id, delta) {
  let cart = getCart();
  let item = cart.find(x => x.id === id);

  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(x => x.id !== id);
    saveCart(cart);
    renderProducts();
    return;
  }

  saveCart(cart);
  renderProducts();
}

/* INIT */
renderProducts();
updateCartBadge();
