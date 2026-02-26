(function () {
  // Use a safe way to declare ImpromptuIndianApi to avoid "already declared" errors
  if (typeof window.ImpromptuIndianApi === 'undefined') {
    window.ImpromptuIndianApi = (() => {
      const rawBase =
        window.IMPROMPTU_INDIAN_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
        '';

      let base = rawBase.trim().replace(/\/$/, '');
      if (!base) {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) {
          base = origin.replace(/\/$/, '');
        } else {
          // Use relative paths - no absolute URLs
          base = '';
        }
      }

      const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

      return {
        baseUrl: base,
        buildUrl,
        fetch: async (path, options = {}) => {
          // 🔥 SECURITY: Automatically inject Authorization header if token exists
          // This prevents missing token errors across all admin API calls
          // 🔥 FIX: Read token once and reuse it (prevents duplicate localStorage reads)
          let token = localStorage.getItem('token');

          // 🔥 CRITICAL FIX: Validate token before sending
          // localStorage stores values as strings, so null/undefined become "null"/"undefined"
          // A valid JWT is always 200+ characters, so reject anything too short
          if (!token || token === 'null' || token === 'undefined' || token.trim() === '' || token.length < 20) {
            token = null;
            // Log for debugging (only in development)
            if (token !== null) {
              console.warn('Invalid token detected and rejected', {
                tokenValue: token,
                tokenLength: token ? token.length : 0,
                path: path
              });
            }
          }

          // Merge headers - ensure Authorization is included if token exists
          const headers = {
            ...(options.headers || {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };

          // 🔥 FIX: Use pure JWT header authentication - remove cookie-based auth
          // Mixing JWT header + HttpOnly cookies causes inconsistent authentication
          // Backend should ONLY check Authorization header, not cookies
          const response = await fetch(buildUrl(path), {
            ...options,
            headers
            // 🔥 REMOVED: credentials: 'include' - causes cookie/JWT conflict
          });

          // 🔥 GLOBAL 401 HANDLING: Centralize authentication error handling
          // This prevents inconsistent auth checks across different files
          // 🔥 PRODUCTION-SAFE: Only clear auth if user was actually authenticated
          // Prevents false logouts from temporary backend hiccups or misconfigured endpoints
          if (response.status === 401) {
            // 🔥 DEBUG: Log 401 details to help identify which endpoint is failing
            console.error('401 DEBUG - Authentication failed', {
              path: path,
              url: buildUrl(path),
              tokenExists: !!token,
              tokenLength: token ? token.length : 0,
              method: options.method || 'GET',
              timestamp: new Date().toISOString()
            });

            // Only act if:
            // 1. User actually had a token (was authenticated)
            // 2. This is NOT a logout endpoint (prevents weird loops)
            if (token && !path.includes('/api/logout')) {
              console.warn('Session expired (401) - clearing auth and redirecting to login', {
                path: path,
                hadToken: !!token
              });

              // Clear all auth-related localStorage
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('user_id');

              // 🔥 FIX: More robust login page check - handles /login, /login/, /auth/login.html, etc.
              // Only redirect if not already on login page
              // Use replace() instead of href to prevent back button issues
              const isLoginPage = window.location.pathname.endsWith('login.html') ||
                window.location.pathname.endsWith('login') ||
                window.location.href.includes('login');

              if (!isLoginPage) {
                window.location.replace('/login.html');
              }
            } else {
              // No token existed or logout endpoint - don't clear state unnecessarily
              console.debug('401 received but no token present or logout endpoint - not clearing auth', {
                path: path,
                hadToken: !!token,
                isLogoutEndpoint: path.includes('/api/logout')
              });
            }

            // Return response anyway so caller can handle it if needed
            return response;
          }

          return response;
        },
      };
    })();
  }

  const ImpromptuIndianApi = window.ImpromptuIndianApi;

  const sidebarHTML = `
  <aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[240px] shrink-0">
    <div class="p-5 flex items-center gap-3 text-xl font-bold">
      <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
      <a href="home.html">
        <span class="text-[#FFCC00]">Impromptu</span><span class="text-white">Indian</span>
      </a>
    </div>

    <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto scrollbar-hide">
      <p class="uppercase text-xs mb-3 opacity-70">Admin Menu</p>

      <a href="home.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span>Dashboard</span>
      </a>

      <a href="orders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="shopping-bag" class="w-5 h-5"></i> <span>Orders</span>
        <span class="notification-badge" id="orders-count-badge" style="display:none">0</span>
      </a>

      <a href="vendors.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="store" class="w-5 h-5"></i> <span>Vendors</span>
      </a>

      <a href="product-approval.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="package-check" class="w-5 h-5"></i> <span>Products</span>
        <span class="notification-badge" id="products-count" style="display:none">0</span>
      </a>

      <a href="riders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bike" class="w-5 h-5"></i> <span>Riders</span>
      </a>

      <a href="delivery.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="truck" class="w-5 h-5"></i> <span>Delivery</span>
      </a>

      <a href="customers.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="users" class="w-5 h-5"></i> <span>Customers</span>
      </a>

      <a href="payments.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="dollar-sign" class="w-5 h-5"></i> <span>Payments</span>
      </a>

      <a href="notifications.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bell" class="w-5 h-5"></i> <span>Notifications</span>
        <span class="notification-badge" id="notifications-count">0</span>
      </a>

      <a href="reports.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bar-chart-3" class="w-5 h-5"></i> <span>Reports</span>
      </a>

      <a href="settings.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="settings" class="w-5 h-5"></i> <span>Settings</span>
      </a>

      <a href="support.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="headphones" class="w-5 h-5"></i> <span>Support</span>
      </a>
    </nav>

    <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
      <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold">A</div>
      <div>
        <p id="userName" class="font-semibold text-sm">Admin</p>
        <button id="logoutBtn" type="button" class="text-xs opacity-80 hover:underline bg-transparent border-0 text-white cursor-pointer p-0">Logout</button>
      </div>
    </div>
  </aside>

  <button id="mobile-menu-toggle" class="md:hidden fixed top-4 right-4 z-50 p-2 rounded-full shadow-lg transition" style="background-color: #FFCC00;">
    <i data-lucide="menu" class="w-6 h-6" style="color: #1273EB;"></i>
  </button>

  <style>
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .notification-badge {
      margin-left: auto;
      background-color: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      min-width: 1.25rem;
      text-align: center;
    }
    .submenu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
      opacity: 0;
    }
    .submenu.open {
      max-height: 500px;
      opacity: 1;
    }
    .submenu-item {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
    }
    .submenu-item:hover {
      color: white;
    }
    .menu-item.open {
      background-color: rgba(0, 0, 0, 0.2);
    }
    #vendor-chevron {
      transition: transform 0.3s ease;
    }
  </style>
  `;

  function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (!submenu) return;
    const parent = submenu.previousElementSibling;
    const chevron = parent.querySelector('i[data-lucide="chevron-down"]');

    if (submenu.classList.contains('open')) {
      submenu.classList.remove('open');
      submenu.classList.add('hidden');
      parent.classList.remove('open');
      if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
      }
    } else {
      document.querySelectorAll('.submenu.open').forEach(s => {
        s.classList.remove('open');
        s.classList.add('hidden');
        const prevParent = s.previousElementSibling;
        if (prevParent) prevParent.classList.remove('open');
        const prevChevron = prevParent?.querySelector('i[data-lucide="chevron-down"]');
        if (prevChevron) prevChevron.style.transform = 'rotate(0deg)';
      });
      submenu.classList.add('open');
      submenu.classList.remove('hidden');
      parent.classList.add('open');
      if (chevron) {
        chevron.style.transform = 'rotate(180deg)';
      }
    }
    
    // Reinitialize icons after toggle
    if (window.lucide) lucide.createIcons();
  }

  function setActiveLink() {
    const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
    const links = document.querySelectorAll(".menu-item, .submenu-item");

    const parentPageMap = {
      'vendor-requests.html': 'vendors.html', 'quotation-reviews.html': 'vendors.html',
      'verified-vendors.html': 'vendors.html', 'rejected-vendors.html': 'vendors.html',
      'product-approval.html': 'product-approval.html',
      'rider-requests.html': 'riders.html', 'verified-riders.html': 'riders.html',
      'rejected-riders.html': 'riders.html', 'riders-list.html': 'riders.html',
      'rider-assignments.html': 'delivery.html', 'delivery-history.html': 'delivery.html',
      'vendor-payouts.html': 'payments.html', 'payment-history.html': 'payments.html',
      'new-orders.html': 'orders.html', 'in-production.html': 'orders.html',
      'ready-dispatch.html': 'orders.html', 'completed-orders.html': 'orders.html',
      'support-tickets.html': 'support.html',
      'support-credentials.html': 'support.html',
      'support-overview.html': 'support.html',
      'support-settings.html': 'support.html'
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
    const username = localStorage.getItem('username') || 'Admin';
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = username;
    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
  }

  async function fetchSidebarCounts() {
    try {
      // Fetch Order Stats
      const orderStatsResponse = await ImpromptuIndianApi.fetch('/api/admin/order-stats');
      if (orderStatsResponse.ok) {
        const stats = await orderStatsResponse.json();
        const ordersBadge = document.getElementById('orders-count-badge');
        if (ordersBadge) {
          if (stats.newOrders > 0) {
            ordersBadge.textContent = stats.newOrders;
            ordersBadge.style.display = 'inline-block';
          } else {
            ordersBadge.style.display = 'none';
          }
        }
      }

      const vendorRequestsResponse = await ImpromptuIndianApi.fetch('/api/admin/vendor-requests');
      if (vendorRequestsResponse.ok) {
        const vendorRequests = await vendorRequestsResponse.json();
        const pendingCount = vendorRequests.filter(v => v.status === 'pending').length;
        const el = document.getElementById('vendor-requests-count');
        if (el) {
          el.textContent = pendingCount;
          el.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      }

      const quotationResponse = await ImpromptuIndianApi.fetch('/api/admin/quotation-submissions');
      if (quotationResponse.ok) {
        const quotations = await quotationResponse.json();
        const el = document.getElementById('quotation-reviews-count');
        if (el) {
          el.textContent = quotations.length;
          el.style.display = quotations.length > 0 ? 'inline-block' : 'none';
        }
      }

      const cartProductsResponse = await ImpromptuIndianApi.fetch('/api/admin/cart-products/pending');
      if (cartProductsResponse.ok) {
        const data = await cartProductsResponse.json();
        const products = data.products || [];
        const productsCountEl = document.getElementById('products-count');
        if (productsCountEl) {
          productsCountEl.textContent = products.length;
          productsCountEl.style.display = products.length > 0 ? 'inline-block' : 'none';
        }
      }

      const riderRequestsResponse = await ImpromptuIndianApi.fetch('/api/admin/rider-requests');
      if (riderRequestsResponse.ok) {
        const riderRequests = await riderRequestsResponse.json();
        const pendingRiders = riderRequests.filter(r => r.status === 'pending' || r.status === 'verification_submitted').length;
        const el = document.getElementById('rider-requests-count');
        if (el) {
          el.textContent = pendingRiders;
          el.style.display = pendingRiders > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (error) {
      console.error('Error fetching sidebar counts:', error);
    }
  }

  async function logout(event) {
    // Prevent ALL event propagation and default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    console.log('LOGOUT CLICKED');

    try {
      // Call backend to delete HttpOnly cookie
      await ImpromptuIndianApi.fetch('/api/logout', {
        method: 'POST'
      });
    } catch (e) {
      console.warn('Logout API call failed');
    }

    // Clear all auth storage
    localStorage.clear();

    // HARD redirect (cannot be overridden, prevents back button)
    window.location.replace('https://apparels.impromptuindian.com/login.html');

    return false;  // Cancel any inline handler behavior
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sidebar-container");
    if (container) {
      container.innerHTML = sidebarHTML;

      // Attach logout handler (must be after sidebar HTML is injected)
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
      }

      if (window.lucide) lucide.createIcons();
      setActiveLink();
      populateUserData();
      fetchSidebarCounts();

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
  window.toggleSubmenu = toggleSubmenu;
  window.fetchSidebarCounts = fetchSidebarCounts;

})();
