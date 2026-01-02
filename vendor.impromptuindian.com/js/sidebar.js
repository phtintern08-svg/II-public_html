(function () {
  /* Session Transfer Logic */
  (function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('user_id') && urlParams.has('role')) {
      const userId = urlParams.get('user_id');
      const role = urlParams.get('role');

      if (role === 'vendor') {
        localStorage.setItem('user_id', userId);
        localStorage.setItem('role', role);

        const username = urlParams.get('username');
        if (username) localStorage.setItem('username', username);

        const email = urlParams.get('email');
        if (email) localStorage.setItem('email', email);

        const phone = urlParams.get('phone');
        if (phone) localStorage.setItem('phone', phone);

        // Create user object for consistency
        const userObj = { user_id: userId, role: role, username, email, phone };
        localStorage.setItem('user', JSON.stringify(userObj));

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  })();

  // Use a safe way to declare ThreadlyApi to avoid "already declared" errors
  if (typeof window.ThreadlyApi === 'undefined') {
    window.ThreadlyApi = (() => {
      const rawBase =
        window.THREADLY_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('THREADLY_API_BASE') ||
        '';

      let base = rawBase.trim().replace(/\/$/, '');
      if (!base) {
        base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
      }

      const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

      return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options),
      };
    })();
  }

  const ThreadlyApi = window.ThreadlyApi;

  const sidebarHTML = `
  <aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[265px] shrink-0">
    <div class="p-5 flex items-center gap-3 text-xl font-bold">
      <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
      <a href="home.html">
        <span class="text-[#FFCC00]">Impromptu</span><span class="text-white">Indian</span>
      </a>
    </div>

    <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto scrollbar-hide" id="sidebar-nav">
      <!-- Navigation will be injected based on verification status -->
    </nav>

    <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
      <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold">C</div>
      <div>
        <p id="userName" class="font-semibold text-sm">Creative Printz</p>
        <a href="#" onclick="logout(event)" class="text-xs opacity-80 hover:underline">Logout</a>
      </div>
    </div>
  </aside>

  <!-- Mobile Toggle Button -->
  <button id="mobile-menu-toggle" class="md:hidden fixed top-4 right-4 z-50 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition">
    <i data-lucide="menu" class="w-6 h-6"></i>
  </button>

  <style>
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .submenu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .submenu.open {
      max-height: 500px;
    }
    .submenu-icon {
      transition: transform 0.3s ease;
    }
    .menu-item.active {
       background-color: #FFCC00 !important;
       color: #000 !important;
    }
  </style>
  `;

  async function fetchAndUpdateStatus() {
    const vendorId = localStorage.getItem('user_id');
    if (!vendorId) return;

    try {
      const verRes = await ThreadlyApi.fetch(`/vendor/verification/status/${vendorId}`);
      if (verRes.ok) {
        const verData = await verRes.json();
        localStorage.setItem('vendorVerificationStatus', verData.status);

        if (verData.status === 'approved') {
          const quotRes = await ThreadlyApi.fetch(`/vendor/quotation/status/${vendorId}`);
          if (quotRes.ok) {
            const quotData = await quotRes.json();
            localStorage.setItem('vendorQuotationStatus', quotData.status === 'approved' ? 'approved' : (quotData.status || 'pending'));
          }
        }

        const notifRes = await ThreadlyApi.fetch(`/vendor/notifications/${vendorId}`);
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          const unreadCount = notifs.filter(n => !n.is_read).length;
          localStorage.setItem('vendorUnreadNotifications', unreadCount);
        }

        // Fetch Vendor Order Stats for Sidebar
        const orderStatsRes = await ThreadlyApi.fetch(`/api/vendor/${vendorId}/order-stats`);
        if (orderStatsRes.ok) {
          const stats = await orderStatsRes.json();
          localStorage.setItem('vendorNewOrdersCount', stats.newOrders || 0);
        }

        renderSidebarNav();
      }
    } catch (e) {
      console.error('Error fetching status:', e);
    }
  }

  function renderSidebarNav() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const verificationStatus = localStorage.getItem('vendorVerificationStatus') || 'pending';
    const quotationStatus = localStorage.getItem('vendorQuotationStatus') || 'pending';
    const unreadCount = localStorage.getItem('vendorUnreadNotifications') || '0';
    const newOrdersCount = parseInt(localStorage.getItem('vendorNewOrdersCount') || '0');
    const isFullyVerified = verificationStatus === 'approved' && quotationStatus === 'approved';

    let navHTML = `<p class="uppercase text-xs mb-3 opacity-70">Vendor Menu</p>`;

    // Dashboard
    navHTML += `<a href="home.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span>Dashboard</span></a>`;

    // Verification
    let badgeClass = verificationStatus === 'approved' ? (quotationStatus === 'approved' ? 'bg-emerald-500' : 'bg-amber-500') : (verificationStatus === 'rejected' ? 'bg-red-500' : 'bg-amber-500');
    let badgeText = verificationStatus === 'approved' ? (quotationStatus === 'approved' ? 'Verified' : 'Quot. Pending') : (verificationStatus === 'rejected' ? 'Rejected' : 'Pending');

    navHTML += `<a href="verification.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="shield-check" class="w-5 h-5"></i> <span>Verification</span> <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full text-white ${badgeClass}">${badgeText}</span></a>`;

    if (isFullyVerified) {
      navHTML += `
        <a href="orders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="shopping-bag" class="w-5 h-5"></i> <span>Orders</span> ${newOrdersCount > 0 ? `<span class="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">${newOrdersCount}</span>` : ''}</a>
        <a href="production.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="settings" class="w-5 h-5"></i> <span>Production</span></a>
        <a href="payments.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="dollar-sign" class="w-5 h-5"></i> <span>Payments</span></a>
        <a href="notifications.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="bell" class="w-5 h-5"></i> <span>Notifications</span> ${unreadCount > 0 ? `<span class="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">${unreadCount}</span>` : ''}</a>
      `;
    }

    navHTML += `
      <a href="profile.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="user-cog" class="w-5 h-5"></i> <span>Profile & Settings</span></a>
      <a href="support.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white"><i data-lucide="headphones" class="w-5 h-5"></i> <span>Support</span></a>
    `;

    nav.innerHTML = navHTML;
    if (window.lucide) lucide.createIcons();
    setActiveLink();
  }

  function setActiveLink() {
    const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
    const links = document.querySelectorAll(".menu-item, .submenu-item");
    const parentPageMap = {
      'work-calendar.html': 'production.html', 'machine-slots.html': 'production.html',
      'payout-history.html': 'payments.html', 'earnings.html': 'payments.html',
      'new-orders.html': 'orders.html', 'in-production.html': 'orders.html',
      'ready-dispatch.html': 'orders.html', 'completed-orders.html': 'orders.html'
    };
    const parentPage = parentPageMap[currentPage];

    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPage || (parentPage && href === parentPage)) {
        link.classList.add("active");
        link.style.backgroundColor = "#FFCC00";
        link.style.color = "#000";
      }
    });
  }

  function populateUserData() {
    const username = localStorage.getItem('username') || 'Creative Printz';
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = username;
    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
  }

  function logout(event) {
    if (event) event.preventDefault();
    localStorage.clear();
    window.location.href = window.location.hostname === 'localhost' ? 'http://localhost:5000/' : 'https://apparels.impromptuindian.com/';
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sidebar-container");
    if (container) {
      container.innerHTML = sidebarHTML;
      renderSidebarNav();
      fetchAndUpdateStatus();
      populateUserData();

      const toggleBtn = document.getElementById("mobile-menu-toggle");
      const sidebar = container.querySelector(".sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => sidebar.classList.toggle("-translate-x-full"));
        document.addEventListener("click", (e) => {
          if (window.innerWidth < 768 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target) && !sidebar.classList.contains("-translate-x-full")) {
            sidebar.classList.add("-translate-x-full");
          }
        });
      }
    }
  });

  // Exports
  window.logout = logout;
  window.renderSidebarNav = renderSidebarNav;

})();
