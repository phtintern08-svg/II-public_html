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
    <p class="text-gray-400 mb-6 text-base md:text-xl">Looks like you haven't added anything to your cart yet.</p>

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

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = 50;
  const total = subtotal + shipping;

  main.innerHTML = `
  <h1 class="text-3xl font-bold mb-2">Your Cart</h1>
  <p class="text-gray-400 mb-6">Review your items before checkout.</p>

  <div class="bg-[#0b1220] rounded-xl divide-y border border-gray-700 mb-6" id="cartItems">
    ${cart.map(item => {
      const color = item.color || item.selectedColor || '';
      const size = item.selectedSize || item.size || '';
      let detailsText = '';
      
      if (color && size) {
        detailsText = `${color} — ${size}`;
      } else if (size) {
        detailsText = `Size: ${size}`;
      } else if (color) {
        detailsText = `Color: ${color}`;
      }
      
      return `
      <div class="p-5 flex items-center gap-4">
        <img src="${item.image || item.image_url || '../images/placeholder.png'}" class="w-20 h-20 rounded object-cover" />
        <div class="flex-1">
          <div class="font-semibold">${item.name || item.product_name || 'Product'}</div>
          ${detailsText ? `<div class="text-gray-400 text-sm">${detailsText}</div>` : ''}
          <div class="font-bold mt-1">₹${item.price || 0}</div>
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
      `;
    }).join("")}
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

    <button onclick="openCheckout()" class="w-full mt-6 bg-[#FFCC00] hover:bg-yellow-400 py-3 rounded-lg text-black font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
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

/* ------------------------------------------
   CHECKOUT & PAYMENT
-------------------------------------------*/
let currentPaymentMethod = 'card';

function openCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    showAlert("Empty Cart", "Your cart is empty. Add items to proceed.", "error");
    return;
  }

  // Check if user is logged in
  const token = localStorage.getItem('access_token');
  if (!token) {
    showAlert("Login Required", "Please login to proceed with checkout.", "error");
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50;
  const total = subtotal + shipping;

  // Update payment modal with cart totals
  document.getElementById('checkoutSubtotal').textContent = `₹${subtotal.toLocaleString()}`;
  document.getElementById('checkoutShipping').textContent = `₹${shipping}`;
  document.getElementById('checkoutTotal').textContent = `₹${total.toLocaleString()}`;
  
  // Update pay button amounts
  document.querySelectorAll('.checkout-pay-amount').forEach(el => {
    el.textContent = `₹${total.toLocaleString()}`;
  });

  // Show checkout modal
  document.getElementById('checkoutModal').classList.remove('hidden');
  switchPaymentTab('card');
  lucide.createIcons();
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.add('hidden');
}

function switchPaymentTab(method) {
  currentPaymentMethod = method;
  
  // Update tab buttons
  document.querySelectorAll('[id^="checkout-tab-"]').forEach(btn => {
    btn.classList.remove('bg-blue-900/10', 'border-blue-500', 'text-blue-400');
    btn.classList.add('border-transparent', 'text-gray-400');
  });
  
  const activeTab = document.getElementById(`checkout-tab-${method}`);
  if (activeTab) {
    activeTab.classList.add('bg-blue-900/10', 'border-blue-500', 'text-blue-400');
    activeTab.classList.remove('border-transparent', 'text-gray-400');
  }

  // Update payment views
  document.querySelectorAll('[id^="checkout-view-"]').forEach(view => {
    view.classList.add('hidden');
  });
  
  const activeView = document.getElementById(`checkout-view-${method}`);
  if (activeView) {
    activeView.classList.remove('hidden');
  }

  lucide.createIcons();
}

async function processCheckoutPayment() {
  const cart = getCart();
  if (cart.length === 0) {
    showAlert("Empty Cart", "Your cart is empty.", "error");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50;
  const total = subtotal + shipping;

  const btn = document.getElementById('checkoutPayBtn');
  const originalText = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
    lucide.createIcons();

    const gateway = new FakePaymentGateway();
    let paymentResult;

    if (currentPaymentMethod === 'card') {
      const cardNum = document.getElementById('checkoutCardNumber').value.replace(/\s/g, '');
      const expiry = document.getElementById('checkoutCardExpiry').value;
      const cvv = document.getElementById('checkoutCardCvv').value;
      const cardName = document.getElementById('checkoutCardName').value;

      if (!cardName || cardName.trim().length < 3) {
        throw new Error("Please enter cardholder name");
      }
      if (!cardNum || cardNum.length < 13) {
        throw new Error("Please enter a valid card number");
      }
      if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
        throw new Error("Please enter valid expiry date (MM/YY)");
      }
      if (!cvv || cvv.length < 3) {
        throw new Error("Please enter valid CVV");
      }

      paymentResult = await gateway.processCardPayment({
        number: cardNum,
        expiry: expiry,
        cvv: cvv,
        name: cardName
      }, total);

    } else if (currentPaymentMethod === 'upi') {
      const upiId = document.getElementById('checkoutUpiId').value;
      if (!upiId || !upiId.includes('@')) {
        throw new Error("Please enter a valid UPI ID");
      }
      paymentResult = await gateway.processUpiPayment(upiId, total);

    } else if (currentPaymentMethod === 'netbanking') {
      const bank = document.getElementById('checkoutBankSelect').value;
      if (!bank) {
        throw new Error("Please select a bank");
      }
      paymentResult = await gateway.processNetBankingPayment(bank, total);

    } else if (currentPaymentMethod === 'cod') {
      paymentResult = await gateway.processCOD(total);
    }

    // Payment successful - create orders
    await createCartOrders(paymentResult);
    
    // Clear cart and show success
    saveCart([]);
    closeCheckout();
    showAlert("Order Placed!", `Your order has been placed successfully! Transaction ID: ${paymentResult.transactionId}`, "success");
    
    // Reload cart page
    setTimeout(() => {
      loadCartPage();
    }, 1500);

  } catch (error) {
    console.error('Payment error:', error);
    showAlert("Payment Failed", error.message || "Payment could not be processed. Please try again.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    lucide.createIcons();
  }
}

async function createCartOrders(paymentResult) {
  const cart = getCart();
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error("Authentication required");
  }

  // Get customer address (use first address or prompt)
  try {
    const addressRes = await window.ImpromptuIndianApi.fetch('/api/customer/addresses', {
      credentials: 'include'
    });
    
    if (!addressRes.ok) {
      throw new Error("Failed to fetch address");
    }
    
    const addresses = await addressRes.json();
    if (!addresses || addresses.length === 0) {
      throw new Error("Please add a delivery address in your profile first");
    }
    
    const address = addresses[0]; // Use first address
    
    // Create order for each cart item
    for (const item of cart) {
      const orderData = {
        product_type: item.productType || 'T-Shirt',
        category: item.category || 'Regular Fit',
        color: item.color || 'Black',
        fabric: item.fabric || 'Cotton',
        quantity: item.quantity,
        price_per_piece: item.price,
        delivery_date: null,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
        transaction_id: paymentResult.transactionId,
        payment_method: paymentResult.method,
        payment_details: JSON.stringify(paymentResult),
        sample_cost: item.price * item.quantity,
        sample_size: item.size || 'M'
      };
      
      const orderRes = await window.ImpromptuIndianApi.fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });
      
      if (!orderRes.ok) {
        const error = await orderRes.json().catch(() => ({}));
        console.error('Order creation failed:', error);
        throw new Error(error.error || 'Failed to create order');
      }
    }
  } catch (error) {
    console.error('Create orders error:', error);
    throw error;
  }
}

/* INIT - Wait for DOM to be ready */
document.addEventListener('DOMContentLoaded', function () {
  // Wait a bit for sidebar to load
  setTimeout(() => {
    lucide.createIcons();
    loadCartPage();
  }, 100);
});
