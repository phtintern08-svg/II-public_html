const sidebarHTML = `
<aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[265px] shrink-0">
  <div class="p-5 flex items-center gap-3 text-xl font-bold">
     <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
    <a href="#">
  <span class="text-[#FFCC00]">Impromptu</span><span class="text-white">Indian</span>
</a>
  </div>

  <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto">
    <p class="uppercase text-xs mb-3 opacity-70">Menu</p>

    <a href="home.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="home" class="w-5 h-5"></i> <span>Home</span>
    </a>

    <a href="cart.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 relative hover:bg-black hover:text-white">
      <i data-lucide="shopping-cart" class="w-5 h-5"></i>
      <span>Cart</span>
      <span id="cartBadge" class="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-[10px] rounded-full min-w-[18px] h-[18px] px-[4px] flex items-center justify-center font-bold shadow-md hidden"></span>
    </a>

    <a href="orders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="shopping-bag" class="w-5 h-5"></i> <span>My Orders</span>
    </a>

    <a href="new-order.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="plus-circle" class="w-5 h-5"></i> <span>New Order</span>
    </a>

    <p class="uppercase text-xs mt-6 mb-3 opacity-70">Account</p>

    <a href="profile.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="user" class="w-5 h-5"></i> <span>Profile</span>
    </a>

    <a href="support.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="life-buoy" class="w-5 h-5"></i> <span>Support</span>
    </a>

    <a href="settings.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
      <i data-lucide="settings" class="w-5 h-5"></i> <span>Settings</span>
    </a>
  </nav>

  <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
    <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold"></div>
    <div>
      <p id="userName" class="font-semibold text-sm"></p>
      <a href="#" onclick="logout(event)" class="text-xs opacity-80 hover:underline">Logout</a>
    </div>
  </div>
</aside>

<!-- Mobile Toggle Button -->
<button id="mobile-menu-toggle" class="md:hidden fixed top-4 right-4 z-50 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition">
  <i data-lucide="menu" class="w-6 h-6"></i>
</button>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("sidebar-container");
  if (container) {
    container.innerHTML = sidebarHTML;

    // Active Link Logic
    const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
    const links = container.querySelectorAll(".menu-item");

    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPage) {
        link.classList.add("active");
        // Apply active styles directly to ensure they override
        link.style.backgroundColor = "#FFCC00";
        link.style.color = "#000";
      }
    });

    // Mobile Toggle Logic
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const sidebar = container.querySelector(".sidebar");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("-translate-x-full");
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener("click", (e) => {
        if (window.innerWidth < 768 &&
          !sidebar.contains(e.target) &&
          !toggleBtn.contains(e.target) &&
          !sidebar.classList.contains("-translate-x-full")) {
          sidebar.classList.add("-translate-x-full");
        }
      });
    }

    // Re-initialize icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Populate User Data
    populateUserData();

    // Cart Badge Logic
    updateCartBadge();
  }
});

// Populate user data from localStorage
function populateUserData() {
  const username = localStorage.getItem('username') || 'Guest';
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');

  if (userNameEl) {
    userNameEl.textContent = username;
  }

  if (userAvatarEl) {
    // Get first letter of username for avatar
    const initial = username.charAt(0).toUpperCase();
    userAvatarEl.textContent = initial;
  }
}

// Logout function
function logout(event) {
  event.preventDefault();

  // Clear all user data from localStorage
  localStorage.removeItem('user_id');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('phone');

  // Optionally clear cart data
  // localStorage.removeItem('threadly_cart');

  // Redirect to landing page
  window.location.href = window.location.hostname === 'localhost' ? 'http://localhost:5000/' : 'https://apparels.impromptuindian.com/';
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (total > 0) {
    badge.textContent = total;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}
