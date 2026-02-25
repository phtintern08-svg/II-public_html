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

// Products loaded from API (no static data)
let products = [];

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
  const productGrid = document.getElementById("productGrid");
  
  if (!productGrid) {
    console.error("Product grid element not found");
    return;
  }

  if (products.length === 0) {
    productGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-400 text-lg">No products available at the moment.</p>
        <p class="text-gray-500 text-sm mt-2">Check back soon for new arrivals!</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = products.map(p => {
    const item = cart.find(x => x.id === p.id);
    const sizeText = p.size ? ` - ${p.size}` : '';
    const colorText = p.color ? `${p.color}${sizeText}` : (p.size ? sizeText : '');
    
    return `
      <div class="bg-white text-black rounded-lg overflow-hidden">
        <img src="${p.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'}" 
             class="w-full h-40 object-cover"
             alt="${p.name}"
             onerror="this.src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'">

        <div class="p-4">
          <div class="font-semibold">${p.name}</div>
          ${colorText ? `<div class="text-sm text-gray-500">${colorText}</div>` : ''}
          ${p.sizes && p.sizes.length > 0 ? `<div class="text-xs text-gray-400 mt-1">Sizes: ${p.sizes.join(', ')}</div>` : ''}
          ${p.colors && p.colors.length > 0 ? `<div class="text-xs text-gray-400">Colors: ${p.colors.join(', ')}</div>` : ''}
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

/* LOAD PRODUCTS FROM API */
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    products = data.products || [];
    renderProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
    document.getElementById("productGrid").innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-400 text-lg">Failed to load products.</p>
        <p class="text-gray-500 text-sm mt-2">Please refresh the page or try again later.</p>
      </div>
    `;
  }
}

/* INIT */
loadProducts();
updateCartBadge();
