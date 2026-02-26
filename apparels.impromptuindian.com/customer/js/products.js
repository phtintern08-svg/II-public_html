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
      <div class="bg-white text-black rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer product-card" onclick="openProductDetail('${p.id}')">
        <div class="relative">
          <img src="${p.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'}" 
               class="w-full h-64 md:h-72 object-cover transition-transform duration-300 hover:scale-105"
               alt="${p.name}"
               onerror="this.src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80'">
          ${item ? `<div class="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">In Cart (${item.quantity})</div>` : ''}
        </div>

        <div class="p-4">
          <div class="font-semibold text-lg mb-1 line-clamp-1">${p.name}</div>
          ${p.product_type ? `<div class="text-xs text-gray-500 mb-1">${p.product_type}${p.category && p.category !== 'N/A' ? ` • ${p.category}` : ''}</div>` : ''}
          ${p.description ? `<div class="text-sm text-gray-600 mb-2 line-clamp-2">${p.description}</div>` : ''}
          ${p.sizes && p.sizes.length > 0 ? `<div class="text-xs text-gray-500 mb-2">Available Sizes: ${p.sizes.join(', ')}</div>` : ''}
          <div class="mt-2 font-bold text-xl text-[#1273EB]">₹${parseFloat(p.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>

          <div id="controls-${p.id}" class="mt-4" onclick="event.stopPropagation()">
            ${item ? qtyControls(p.id, item.quantity) : addBtn(p.id)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

/* ADD TO CART */
function addToCart(id, size = null, quantity = 1) {
  let cart = getCart();
  const p = products.find(x => x.id === id);

  if (!p) return;

  // Create cart item with size if provided
  const cartItem = {
    ...p,
    quantity: quantity,
    selectedSize: size || (p.sizes && p.sizes.length > 0 ? p.sizes[0] : null)
  };

  // Check if item already exists in cart (same product + same size)
  const existingIndex = cart.findIndex(x => 
    x.id === id && x.selectedSize === cartItem.selectedSize
  );

  if (existingIndex >= 0) {
    // Update quantity if item exists
    cart[existingIndex].quantity += quantity;
  } else {
    // Add new item
    cart.push(cartItem);
  }

  saveCart(cart);
  renderProducts();
  
  // Update modal if open
  if (currentProductDetail && currentProductDetail.id === id) {
    updateModalCartState();
  }
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

/* GET PRODUCT TYPE FROM URL */
function getProductTypeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("product_type");
}

/* LOAD PRODUCTS FROM API */
async function loadProducts() {
  try {
    const productType = getProductTypeFromURL();
    
    let url = "/api/products";
    if (productType) {
      url += `?product_type=${encodeURIComponent(productType)}`;
    }
    
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    products = data.products || [];
    renderProducts();
    
    // Update page title if filtered by product type
    if (productType) {
      const titleElement = document.querySelector("h1, .page-title");
      if (titleElement) {
        titleElement.textContent = `${productType} Products`;
      }
    }
  } catch (error) {
    console.error("Failed to load products:", error);
    const productGrid = document.getElementById("productGrid");
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-400 text-lg">Failed to load products.</p>
          <p class="text-gray-500 text-sm mt-2">Please refresh the page or try again later.</p>
        </div>
      `;
    }
  }
}

// Product Detail Modal State
let currentProductDetail = null;
let selectedSize = null;
let modalQuantity = 1;

/* OPEN PRODUCT DETAIL MODAL */
function openProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentProductDetail = product;
  selectedSize = null;
  modalQuantity = 1;

  // Set main image
  const mainImage = document.getElementById('modal-main-image');
  if (mainImage) {
    mainImage.src = product.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80';
  }

  // Set product name
  const productName = document.getElementById('modal-product-name');
  if (productName) {
    productName.textContent = product.name;
  }

  // Set product type
  const productType = document.getElementById('modal-product-type');
  if (productType) {
    productType.textContent = product.product_type 
      ? `${product.product_type}${product.category && product.category !== 'N/A' ? ` • ${product.category}` : ''}`
      : '';
  }

  // Set price
  const price = document.getElementById('modal-price');
  if (price) {
    price.textContent = `₹${parseFloat(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  // Set description
  const description = document.getElementById('modal-description');
  const descriptionSection = document.getElementById('modal-description-section');
  if (description) {
    if (product.description) {
      description.textContent = product.description;
      if (descriptionSection) descriptionSection.classList.remove('hidden');
    } else {
      if (descriptionSection) descriptionSection.classList.add('hidden');
    }
  }

  // Render sizes
  const sizesContainer = document.getElementById('modal-sizes');
  const sizeSection = document.getElementById('modal-size-section');
  if (sizesContainer && product.sizes && product.sizes.length > 0) {
    sizesContainer.innerHTML = product.sizes.map(size => `
      <button onclick="selectSize('${size}')" 
              class="size-btn px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-[#1273EB] hover:bg-blue-50 transition-colors font-medium"
              data-size="${size}">
        ${size}
      </button>
    `).join('');
    if (sizeSection) sizeSection.classList.remove('hidden');
  } else {
    if (sizeSection) sizeSection.classList.add('hidden');
  }

  // Render thumbnails (if multiple images)
  const thumbnailsContainer = document.getElementById('modal-thumbnails');
  if (thumbnailsContainer) {
    // Use images array if available, otherwise use single image
    const images = product.images && Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.image ? [product.image] : []);
    
    if (images.length > 1) {
      thumbnailsContainer.innerHTML = images.map((img, idx) => {
        const imgUrl = img.startsWith('http') || img.startsWith('/') ? img : `/api/uploads/${img}`;
        return `
          <button onclick="changeMainImage('${imgUrl}')" 
                  class="thumbnail-btn border-2 rounded-lg overflow-hidden hover:border-[#1273EB] transition-colors ${idx === 0 ? 'border-[#1273EB]' : 'border-gray-300'}">
            <img src="${imgUrl}" 
                 alt="Thumbnail ${idx + 1}" 
                 class="w-full h-full object-cover aspect-square">
          </button>
        `;
      }).join('');
    } else {
      thumbnailsContainer.innerHTML = '';
    }
  }

  // Reset quantity
  const quantityDisplay = document.getElementById('modal-quantity');
  if (quantityDisplay) {
    quantityDisplay.textContent = '1';
  }

  // Update modal state
  updateModalCartState();

  // Show modal
  const modal = document.getElementById('productDetailModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Attach event listeners
  attachModalListeners();
}

/* CLOSE PRODUCT DETAIL MODAL */
function closeProductDetail() {
  const modal = document.getElementById('productDetailModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  currentProductDetail = null;
  selectedSize = null;
  modalQuantity = 1;
}

/* SELECT SIZE */
function selectSize(size) {
  selectedSize = size;
  
  // Update button styles
  document.querySelectorAll('.size-btn').forEach(btn => {
    if (btn.dataset.size === size) {
      btn.classList.add('border-[#1273EB]', 'bg-blue-50');
      btn.classList.remove('border-gray-300');
    } else {
      btn.classList.remove('border-[#1273EB]', 'bg-blue-50');
      btn.classList.add('border-gray-300');
    }
  });

  // Hide size error
  const sizeError = document.getElementById('modal-size-error');
  if (sizeError) {
    sizeError.classList.add('hidden');
  }

  updateModalCartState();
}

/* CHANGE MAIN IMAGE */
function changeMainImage(imageUrl) {
  const mainImage = document.getElementById('modal-main-image');
  if (mainImage) {
    mainImage.src = imageUrl.startsWith('http') ? imageUrl : `/api/uploads/${imageUrl}`;
  }

  // Update thumbnail selection
  document.querySelectorAll('.thumbnail-btn').forEach((btn, idx) => {
    const img = btn.querySelector('img');
    if (img && (img.src.includes(imageUrl) || img.src.includes(imageUrl.split('/').pop()))) {
      btn.classList.add('border-[#1273EB]');
      btn.classList.remove('border-gray-300');
    } else {
      btn.classList.remove('border-[#1273EB]');
      btn.classList.add('border-gray-300');
    }
  });
}

/* ATTACH MODAL EVENT LISTENERS */
function attachModalListeners() {
  // Quantity controls
  const qtyDecrease = document.getElementById('modal-qty-decrease');
  const qtyIncrease = document.getElementById('modal-qty-increase');
  const quantityDisplay = document.getElementById('modal-quantity');

  if (qtyDecrease) {
    qtyDecrease.onclick = () => {
      if (modalQuantity > 1) {
        modalQuantity--;
        if (quantityDisplay) quantityDisplay.textContent = modalQuantity;
      }
    };
  }

  if (qtyIncrease) {
    qtyIncrease.onclick = () => {
      modalQuantity++;
      if (quantityDisplay) quantityDisplay.textContent = modalQuantity;
    };
  }

  // Add to cart button
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.onclick = () => {
      if (!currentProductDetail) return;

      // Check if size is required and selected
      if (currentProductDetail.sizes && currentProductDetail.sizes.length > 0 && !selectedSize) {
        const sizeError = document.getElementById('modal-size-error');
        if (sizeError) {
          sizeError.classList.remove('hidden');
        }
        return;
      }

      addToCart(currentProductDetail.id, selectedSize, modalQuantity);
      closeProductDetail();
      
      // Show success message
      showToast('Product added to cart!', 'success');
    };
  }

  // Buy now button
  const buyNowBtn = document.getElementById('modal-buy-now');
  if (buyNowBtn) {
    buyNowBtn.onclick = () => {
      if (!currentProductDetail) return;

      // Check if size is required and selected
      if (currentProductDetail.sizes && currentProductDetail.sizes.length > 0 && !selectedSize) {
        const sizeError = document.getElementById('modal-size-error');
        if (sizeError) {
          sizeError.classList.remove('hidden');
        }
        return;
      }

      // Add to cart and redirect
      addToCart(currentProductDetail.id, selectedSize, modalQuantity);
      window.location.href = 'cart.html';
    };
  }
}

/* UPDATE MODAL CART STATE */
function updateModalCartState() {
  if (!currentProductDetail) return;

  const cart = getCart();
  const cartItem = cart.find(x => 
    x.id === currentProductDetail.id && 
    x.selectedSize === (selectedSize || (currentProductDetail.sizes && currentProductDetail.sizes[0]))
  );

  const addToCartBtn = document.getElementById('modal-add-to-cart');
  if (addToCartBtn) {
    if (cartItem) {
      addToCartBtn.innerHTML = `
        <i data-lucide="check" class="w-5 h-5"></i>
        <span>In Cart (${cartItem.quantity})</span>
      `;
      addToCartBtn.classList.add('bg-green-500', 'hover:bg-green-600');
      addToCartBtn.classList.remove('bg-[#FFCC00]', 'hover:bg-yellow-400');
    } else {
      addToCartBtn.innerHTML = `
        <i data-lucide="shopping-cart" class="w-5 h-5"></i>
        <span>Add to Cart</span>
      `;
      addToCartBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
      addToCartBtn.classList.add('bg-[#FFCC00]', 'hover:bg-yellow-400');
    }
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* TOAST NOTIFICATION */
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-semibold transform transition-all duration-300 translate-x-full`;
  
  if (type === 'success') {
    toast.classList.add('bg-green-500');
  } else if (type === 'error') {
    toast.classList.add('bg-red-500');
  } else {
    toast.classList.add('bg-blue-500');
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductDetail();
  }
});

/* INIT */
loadProducts();
updateCartBadge();
