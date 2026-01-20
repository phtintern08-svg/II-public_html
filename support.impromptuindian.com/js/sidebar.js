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
        fetch: (path, options = {}) => {
          // Include credentials to send cookies (REQUIRED for subdomain SSO)
          return fetch(buildUrl(path), {
            ...options,
            credentials: 'include'
          });
        },
      };
    })();
  }

  const ImpromptuIndianApi = window.ImpromptuIndianApi;

  const sidebarHTML = `
  <aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[265px] shrink-0">
    <div class="p-5 flex items-center gap-3 text-xl font-bold">
      <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
      <a href="home.html">
        <span class="text-[#FFCC00]">Impromptu</span><span class="text-white">Indian</span>
      </a>
    </div>

    <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto scrollbar-hide">
      <p class="uppercase text-xs mb-3 opacity-70">Support Menu</p>

      <a href="home.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span>Support Dashboard</span>
      </a>

      <a href="live-tickets.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="mail" class="w-5 h-5"></i> <span>Live Tickets</span>
        <span class="notification-badge" id="tickets-count-badge" style="display:none">0</span>
      </a>

      <a href="sla-monitor.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="clock" class="w-5 h-5"></i> <span>SLA Monitor</span>
      </a>

      <a href="disputes.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="alert-triangle" class="w-5 h-5"></i> <span>Disputes</span>
      </a>

      <a href="payment-issues.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="dollar-sign" class="w-5 h-5"></i> <span>Payment Issues</span>
      </a>

      <a href="delivery-issues.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="package" class="w-5 h-5"></i> <span>Delivery Issues</span>
      </a>

      <a href="support-agents.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="users" class="w-5 h-5"></i> <span>Support Agents</span>
      </a>

      <a href="reports.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bar-chart-3" class="w-5 h-5"></i> <span>Reports</span>
      </a>

      <a href="settings.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="settings" class="w-5 h-5"></i> <span>Support Settings</span>
      </a>
    </nav>

    <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
      <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold">S</div>
      <div>
        <p id="userName" class="font-semibold text-sm">Support</p>
        <button id="logoutBtn" type="button" class="text-xs opacity-80 hover:underline bg-transparent border-0 text-white cursor-pointer p-0">Logout</button>
      </div>
    </div>
  </aside>

  <button id="mobile-menu-toggle" class="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition">
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
  </style>
  `;

  function setActiveLink() {
    const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
    const links = document.querySelectorAll(".menu-item");

    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPage) {
        link.classList.add("active");
        link.style.backgroundColor = "#FFCC00";
        link.style.color = "#000";
      }
    });
  }

  function populateUserData() {
    const username = localStorage.getItem('username') || 'Support';
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = username;
    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
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

})();
