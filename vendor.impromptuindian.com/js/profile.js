// Vendor Profile Page JavaScript
lucide.createIcons();

const ImpromptuIndianApi = window.ImpromptuIndianApi || (() => {
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
        fetch: (path, options = {}) => fetch(buildUrl(path), options)
    };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

// Save bank details
function saveBankDetails() {
    const bankDetails = {
        accountName: document.getElementById('fldAccountName').value,
        accountNumber: document.getElementById('fldAccountNumber').value,
        ifsc: document.getElementById('fldIfsc').value,
        paymentCycle: document.getElementById('fldPaymentCycle').value
    };

    localStorage.setItem('vendorBankDetails', JSON.stringify(bankDetails));
    showToast('Financial records updated!');
}

// Save notification settings
function saveNotificationSettings() {
    const settings = {
        email: document.getElementById('checkEmailNotif').checked,
        sms: document.getElementById('checkSmsNotif').checked
    };

    localStorage.setItem('vendorNotificationSettings', JSON.stringify(settings));
    showToast('Communication preferences saved!');
}

// Load vendor data
async function loadVendorProfile() {
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    // No need to check localStorage.token - backend uses HttpOnly cookies for security
    try {
        // Always fetch fresh data from backend - don't rely on localStorage
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            
            // Store complete vendor profile data from database
            localStorage.setItem('vendor_profile', JSON.stringify(data));
            
            // Update localStorage with fresh data from database
            if (data.username) localStorage.setItem('username', data.username);
            if (data.email) localStorage.setItem('email', data.email);
            if (data.phone) localStorage.setItem('phone', data.phone);
            if (data.business_name) localStorage.setItem('business_name', data.business_name);
            if (data.business_type) localStorage.setItem('business_type', data.business_type);
            if (data.bio) localStorage.setItem('bio', data.bio);
            if (data.avatar_url) localStorage.setItem('avatar_url', data.avatar_url);
            if (data.address) localStorage.setItem('address', data.address);
            if (data.city) localStorage.setItem('city', data.city);
            if (data.state) localStorage.setItem('state', data.state);
            if (data.pincode) localStorage.setItem('pincode', data.pincode);
            
            // Populate form fields
            if (document.getElementById('profileBusinessName')) {
                document.getElementById('profileBusinessName').value = data.business_name || '';
            }
            if (document.getElementById('profileEmail')) {
                document.getElementById('profileEmail').value = data.email || '';
            }
            if (document.getElementById('profilePhone')) {
                document.getElementById('profilePhone').value = data.phone || '';
            }
            if (document.getElementById('profileBusinessType')) {
                document.getElementById('profileBusinessType').value = data.business_type || '';
            }
            if (document.getElementById('profileBio')) {
                document.getElementById('profileBio').value = data.bio || '';
            }

            // Address details
            if (document.getElementById('fldFullAddress')) {
                document.getElementById('fldFullAddress').value = data.address || '';
            }
            if (document.getElementById('fldCity')) {
                document.getElementById('fldCity').value = data.city || '';
            }
            if (document.getElementById('fldState')) {
                document.getElementById('fldState').value = data.state || '';
            }
            if (document.getElementById('fldPincode')) {
                document.getElementById('fldPincode').value = data.pincode || '';
            }

            if (data.latitude && data.longitude) {
                if (document.getElementById('coordDisplay')) {
                    document.getElementById('coordDisplay').textContent = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
                }
                window.currentCoords = { lat: data.latitude, lon: data.longitude };
            }

            // Update avatar
            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial) {
                avatarInitial.textContent = (data.business_name || data.username || '').charAt(0).toUpperCase();
            }

            // Additional details for the new UI
            if (data.created_at && document.getElementById('profileMemberSince')) {
                const date = new Date(data.created_at);
                const options = { day: '2-digit', month: 'short', year: 'numeric' };
                document.getElementById('profileMemberSince').value = date.toLocaleDateString('en-GB', options);
            }
            if (data.service_zone && document.getElementById('profileServiceZone')) {
                document.getElementById('profileServiceZone').value = data.service_zone;
            }
            
            console.log('Vendor profile loaded from database:', data);
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to fetch vendor profile:', response.status, errorData);
            
            // If 401/403, token might be invalid - redirect to login
            if (response.status === 401 || response.status === 403) {
                console.warn('Authentication failed - redirecting to login');
                window.location.href = 'https://apparels.impromptuindian.com/login.html';
            }
        }

        // Load Bank Details from LocalStorage (Fallback for now)
        const bank = JSON.parse(localStorage.getItem('vendorBankDetails') || '{}');
        if (bank.accountName) {
            document.getElementById('fldAccountName').value = bank.accountName;
            document.getElementById('fldAccountNumber').value = bank.accountNumber;
            document.getElementById('fldIfsc').value = bank.ifsc;
            document.getElementById('fldPaymentCycle').value = bank.paymentCycle || 'monthly';
        }

        // Load Notif Settings
        const notifs = JSON.parse(localStorage.getItem('vendorNotificationSettings') || '{}');
        if (notifs.email !== undefined) {
            document.getElementById('checkEmailNotif').checked = notifs.email;
            document.getElementById('checkSmsNotif').checked = notifs.sms;
        }

    } catch (error) {
        console.error('Error loading vendor profile:', error);
    }
}

// Save profile changes (Basic Details)
async function saveProfileChanges() {
    // ✅ FIX: Remove dependency on localStorage.user_id - rely only on JWT token
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    const businessName = document.getElementById('profileBusinessName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const businessType = document.getElementById('profileBusinessType').value;
    const bio = document.getElementById('profileBio').value;

    if (!businessName || !email || !phone) {
        showToast('Business Name, Email, and Phone are required', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                business_name: businessName,
                phone: phone,
                business_type: businessType,
                bio: bio
            })
        });

        if (response.ok) {
            const result = await response.json();
            
            // ✅ FIX: Update localStorage with fresh data from backend response
            if (result.profile) {
                const profile = result.profile;
                localStorage.setItem('vendor_profile', JSON.stringify(profile));
                if (profile.username) localStorage.setItem('username', profile.username);
                if (profile.business_name) localStorage.setItem('business_name', profile.business_name);
                if (profile.email) localStorage.setItem('email', profile.email);
                if (profile.phone) localStorage.setItem('phone', profile.phone);
                if (profile.business_type) localStorage.setItem('business_type', profile.business_type);
                if (profile.bio) localStorage.setItem('bio', profile.bio);
            }

            showToast('Profile updated successfully!');

            // Sync UI
            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial) avatarInitial.textContent = businessName.charAt(0).toUpperCase();
        } else {
            const err = await response.json().catch(() => ({ error: 'Update failed' }));
            showToast(err.error || 'Update failed', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

// Save Location details
async function saveLocation() {
    // ✅ FIX: Remove dependency on localStorage.user_id - rely only on JWT token
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    const fullAddress = document.getElementById('fldFullAddress').value;
    const city = document.getElementById('fldCity').value;
    const state = document.getElementById('fldState').value;
    const pincode = document.getElementById('fldPincode').value;

    const coords = window.currentCoords || { lat: null, lon: null };

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: fullAddress,
                city: city,
                state: state,
                pincode: pincode,
                latitude: coords.lat,
                longitude: coords.lon
            })
        });

        if (response.ok) {
            showToast('Shop location saved successfully!');
        } else {
            showToast('Failed to save location', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

/* ------------------------------------------------
   USE CURRENT LOCATION  MAPMYINDIA (MAPPLS)
--------------------------------------------------*/

const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
let map = null;
let marker = null;
let mapplsLoadingPromise = null;

// Load Mappls SDK dynamically (DEFINED BEFORE USE to avoid order dependency issues)
// CRITICAL: Creates script dynamically instead of reusing existing tag (browser edge case fix)
async function loadMapplsSDK() {
  if (window.mappls && window.mappls.Map) {
    console.log("Mappls SDK already loaded");
    return;
  }

  if (mapplsLoadingPromise) return mapplsLoadingPromise;

  mapplsLoadingPromise = (async () => {
    try {
      const res = await window.ImpromptuIndianApi.fetch("/api/config", {
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to load config");

      const config = await res.json();
      const apiKey = config?.mappls?.apiKey;
      if (!apiKey) throw new Error("Mappls API key missing");

      // ✅ CSS - Element must exist in HTML
      // CRITICAL: URL must include /api/ segment: /advancedmaps/api/${apiKey}/map_sdk.css
      const css = document.getElementById("mappls-css");
      if (!css) {
        throw new Error('Mappls CSS element (id="mappls-css") not found in HTML. Add <link id="mappls-css" rel="stylesheet" /> to <head>');
      }
      css.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk.css`;

      // ✅ JS - CREATE SCRIPT DYNAMICALLY (DO NOT REUSE EXISTING TAG)
      // CRITICAL: JavaScript SDK URL must include mandatory query parameters for initialization
      // Without layer=vector&v=3.0, SDK loads but window.mappls remains undefined
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Mappls SDK failed to load (404 – invalid URL or key not whitelisted)"));
        document.head.appendChild(script);
      });

      if (!window.mappls) {
        throw new Error("Mappls loaded but mappls is undefined");
      }

      // Validate that required plugins are loaded
      if (!window.mappls.Map) {
        throw new Error("Mappls Map plugin not loaded");
      }

      // Note: Search plugins can be added later if needed via ?plugins=search,autosuggest
      // For now, we load base SDK first to ensure it works
      console.log("✅ Mappls SDK loaded successfully");
    } catch (err) {
      console.error('Mappls SDK load error:', err);
      mapplsLoadingPromise = null; // Reset on error so it can be retried
      throw err;
    }
  })();

  return mapplsLoadingPromise;
}

// Bind map search event listeners once (outside click handler to prevent reassignment)
const mapSearchBtn = document.getElementById("mapSearchBtn");
const mapSearchInput = document.getElementById("mapSearchInput");

if (mapSearchBtn && !mapSearchBtn.dataset.bound) {
  mapSearchBtn.dataset.bound = "1";
  const performMapSearch = () => {
    const query = mapSearchInput ? mapSearchInput.value.trim() : "";
    if (!query) return;

    const oldText = mapSearchBtn.innerText;
    mapSearchBtn.innerText = "...";
    mapSearchBtn.disabled = true;

    // ? USE CLIENT-SIDE SDK SEARCH
    // This runs from the browser using the whitelisted domain, bypassing backend 412 blocks.
    const searchOptions = {
      query: query
    };

    try {
      // Check if search plugin is available before using it
      if (typeof mappls.search !== 'function') {
        throw new Error("Mappls search plugin not loaded. Please refresh the page.");
      }

      // Try calling as function first (common in v3.0 updates)
      mappls.search(searchOptions, (data) => {
        mapSearchBtn.innerText = oldText;
        mapSearchBtn.disabled = false;

        if (data && data.length > 0) {
          const result = data[0];
          const newLat = parseFloat(result.latitude || result.lat);
          const newLng = parseFloat(result.longitude || result.lng);

          // eLoc is precise unique ID for a place
          const eLoc = result.eLoc;

          if (!isNaN(newLat) && !isNaN(newLng) && map && marker) {
            map.setCenter([newLat, newLng]);
            marker.setPosition({ lat: newLat, lng: newLng });
            map.setZoom(17); // Close zoom for confirmed search
          } else if (eLoc) {
            // Fallback: If only eLoc is returned (sometimes happens)
            // We might need to resolve eLoc, but usually SDK returns lat/lng
            console.warn("Received eLoc only:", eLoc);
          }
        } else {
          // Try Autosuggest if Search fails (sometimes different results)
          // Check if autosuggest plugin is available
          if (typeof mappls.autoSuggest === 'function') {
            new mappls.autoSuggest({ query: query }, (autoData) => {
            if (autoData && autoData.length > 0) {
              const autoRes = autoData[0];
              const aLat = parseFloat(autoRes.latitude || autoRes.lat);
              const aLng = parseFloat(autoRes.longitude || autoRes.lng);
              if (!isNaN(aLat) && map && marker) {
                map.setCenter([aLat, aLng]);
                marker.setPosition({ lat: aLat, lng: aLng });
                map.setZoom(17);
                return;
              }
            }
            showToast("Location not found. Try a broader area name.", "error");
            });
          } else {
            showToast("Location not found. Try a broader area name.", "error");
          }
        }
      });
    } catch (e) {
      console.error("SDK Search Error", e);
      mapSearchBtn.innerText = oldText;
      mapSearchBtn.disabled = false;
      showToast("Search service is unavailable.", "error");
    }
  };
  
  mapSearchBtn.onclick = performMapSearch;
  if (mapSearchInput) {
    mapSearchInput.onkeypress = (e) => {
      if (e.key === 'Enter') performMapSearch();
    };
  }
}

function initMapEvents() {
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener("click", async () => {
      const btnHTML = useCurrentLocationBtn.innerHTML;
      useCurrentLocationBtn.innerHTML =
        '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Getting Location...';
      useCurrentLocationBtn.disabled = true;
      lucide.createIcons();

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation not supported");
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            let lat, lng;
            if (pos.coords) {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              // Debugging Location Accuracy
              console.log(`GPS Success: Lat ${lat}, Lng ${lng}, Acc ${pos.coords.accuracy}m`);
            } else if (Array.isArray(pos)) {
              [lat, lng] = pos;
            }

            const mapModal = document.getElementById("mapModal");
            mapModal.classList.remove("hidden");
            const activeModal = mapModal.querySelector('.active-modal');
            if (activeModal) {
              setTimeout(() => {
                activeModal.classList.add('show');
              }, 10);
            }

            // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
            requestAnimationFrame(async () => {
              try {
                // Load SDK if not already loaded
                await loadMapplsSDK();

                if (typeof mappls === 'undefined' || !mappls.Map) {
                  throw new Error("Mappls SDK not loaded");
                }

                // CRITICAL: Set container height before map creation (Mappls needs non-zero dimensions)
                const container = document.getElementById("mapContainer");
                if (container) {
                  container.style.height = "100%";
                  container.style.minHeight = "420px";
                }

                // Smart Zoom based on Accuracy
                // If accuracy is poor (>500m), set zoom to 16
                // If good, zoom in tight
                const zoomLevel = (pos.coords.accuracy > 500) ? 16 : 18;

                if (!map) {
                  map = new mappls.Map("mapContainer", {
                    center: [lat, lng],
                    zoom: zoomLevel
                  });

                  marker = new mappls.Marker({
                    map: map,
                    position: { lat: lat, lng: lng },
                    draggable: true
                  });

                  // Add accuracy circle
                  const accuracy = pos.coords ? pos.coords.accuracy : 50;
                  new mappls.Circle({
                    map: map,
                    center: [lat, lng],
                    radius: accuracy, // meters
                    fillColor: "#3b82f6",
                    fillOpacity: 0.15,
                    strokeOpacity: 0.3,
                  });

                  console.log('Map initialized correctly');

                  // Force resize to handle modal animation timing
                  setTimeout(() => {
                    if (map && map.resize) map.resize();
                  }, 300);

                  setTimeout(() => {
                    if (map && map.resize) map.resize();
                  }, 800);

                } else {
                  // Map already exists - update position and resize
                  map.setCenter([lat, lng]);
                  marker.setPosition({ lat: lat, lng: lng });
                  map.setZoom(zoomLevel);
                  // Resize map to handle container size changes
                  if (map.resize) {
                    requestAnimationFrame(() => map.resize());
                  }
                }
              } catch (err) {
                console.error("Map initialization error:", err);
                showToast("Map service failed to load. Please try again later.", "error");
                useCurrentLocationBtn.innerHTML = btnHTML;
                useCurrentLocationBtn.disabled = false;
                return;
              }
            });

            // Reset button
            useCurrentLocationBtn.innerHTML = btnHTML;
            useCurrentLocationBtn.disabled = false;
            lucide.createIcons();

          },

          (err) => {
            console.error("GPS Error", err);

            // Even if GPS fails/denied, OPEN THE MAP ANYWAY so they can search
            // Default to Bangalore center
            let lat = 12.9716;
            let lng = 77.5946;

            const mapModal = document.getElementById("mapModal");
            mapModal.classList.remove("hidden");
            const activeModal = mapModal.querySelector('.active-modal');
            if (activeModal) {
              setTimeout(() => {
                activeModal.classList.add('show');
              }, 10);
            }

            // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
            requestAnimationFrame(async () => {
              try {
                // Load SDK if not already loaded
                await loadMapplsSDK();

                if (typeof mappls === 'undefined' || !mappls.Map) {
                  throw new Error("Mappls SDK not loaded");
                }

                // CRITICAL: Set container height before map creation (Mappls needs non-zero dimensions)
                const container = document.getElementById("mapContainer");
                if (container) {
                  container.style.height = "100%";
                  container.style.minHeight = "420px";
                }

                if (!map) {
                  map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                  marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                  console.log('Map initialized correctly');

                  // Force resize to handle modal animation timing
                  setTimeout(() => {
                    if (map && map.resize) map.resize();
                  }, 300);

                  setTimeout(() => {
                    if (map && map.resize) map.resize();
                  }, 800);
                } else {
                  // Map already exists - update position and resize
                  map.setCenter([lat, lng]);
                  marker.setPosition({ lat: lat, lng: lng });
                  map.setZoom(12);
                  // Resize map to handle container size changes
                  if (map.resize) {
                    requestAnimationFrame(() => map.resize());
                  }
                }
              } catch (err) {
                console.error("Map initialization error:", err);
                showToast("Map service failed to load. Please try again later.", "error");
              }
            });

            useCurrentLocationBtn.innerHTML = btnHTML;
            useCurrentLocationBtn.disabled = false;
            lucide.createIcons();
          },
          // Aggressive GPS Options
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        /* -------------------------------
           CONFIRM LOCATION ? REVERSE GEOCODE -> SAVE
        ------------------------------- */
        const confirmBtn = document.getElementById("confirmLocationBtn");
        if (confirmBtn && !confirmBtn.dataset.bound) {
          confirmBtn.dataset.bound = "1";
          confirmBtn.addEventListener("click", async () => {
          if (!marker) return;

          const btn = document.getElementById("confirmLocationBtn");
          const oldHTML = btn.innerHTML;
          btn.innerHTML =
            '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
          btn.disabled = true;
          lucide.createIcons();

          try {
            const pos = marker.getPosition(); // Returns { lat, lng } or similar object
            // Mappls SDK docs say getPosition() returns object with lat, lng properties
            const lat = pos.lat || pos[0];
            const lng = pos.lng || pos[1];

            // Use MapmyIndia Reverse Geocoding via LocationService
            if (typeof LocationService === "undefined") {
              throw new Error("LocationService not available");
            }
            const locService = new LocationService();
            const addressData = await locService.reverseGeocodeMappls(lat, lng);

            // Populate form fields with reverse geocoded data
            const area = addressData.area || addressData.street || addressData.subLocality || addressData.locality || '';
            const house = addressData.houseNumber || addressData.house_number || '';

            document.getElementById('fldFullAddress').value = `${house ? house + ', ' : ''}${area}`;
            document.getElementById('fldCity').value = addressData.city || addressData.district || '';
            document.getElementById('fldState').value = addressData.state || '';
            document.getElementById('fldPincode').value = addressData.pincode || '';

            document.getElementById('coordDisplay').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            window.currentCoords = { lat, lon: lng };

            // Close modal
            const mapModal = document.getElementById("mapModal");
            if (mapModal) {
              const activeModal = mapModal.querySelector('.active-modal');
              if (activeModal) {
                activeModal.classList.remove('show');
                setTimeout(() => mapModal.classList.add('hidden'), 300);
              }
            }

            showToast('Location pinned successfully!');

          } catch (err) {
            console.error(err);
            showToast("Unable to fetch address details.", "error");
          } finally {
            btn.innerHTML = oldHTML;
            btn.disabled = false;
            lucide.createIcons();
          }
          });
        }

      } catch (error) {
        console.error(error);
        showToast("An unexpected error occurred.", "error");
        useCurrentLocationBtn.innerHTML = btnHTML;
        useCurrentLocationBtn.disabled = false;
      }
    });
  }
}

// Toast helper
function showToast(message, type = 'success') {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    // Update visuals based on type
    if (type === 'error') {
        toast.classList.replace('bg-emerald-600/90', 'bg-rose-600/90');
        toast.querySelector('p.font-bold').textContent = 'Update Interrupted';
    } else {
        toast.classList.replace('bg-rose-600/90', 'bg-emerald-600/90');
        toast.querySelector('p.font-bold').textContent = 'Transformation Successful';
    }

    messageEl.textContent = message;

    // Smooth Entry
    toast.classList.remove('translate-x-12', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');

    setTimeout(() => {
        // Smooth Exit
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-12', 'opacity-0');
    }, 4000);
}

// Change Password
async function changePassword() {
    // ✅ FIX: Remove dependency on localStorage.user_id - rely only on JWT token
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('All fields required', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('New passwords match', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/change-password`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        if (response.ok) {
            showToast('Password updated!');
            document.querySelectorAll('input[type="password"]').forEach(i => i.value = '');
        } else {
            const err = await response.json();
            showToast(err.error || 'Update failed', 'error');
        }
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadVendorProfile();

    // Reveal On Scroll
    const reveal = () => {
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add('show');
        });
    };
    window.addEventListener('scroll', reveal);
    setTimeout(reveal, 100);

    // ✅ FIX: Use saveLocation directly - no aliasing needed
    document.getElementById('saveLocationBtn').onclick = saveLocation;
    
    // Initialize map events (includes SDK loading on demand)
    initMapEvents();
    
    // Close map modal helper
    function closeMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            const inner = modal.querySelector('.active-modal');
            if (inner) {
                inner.classList.remove('show');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        }
    }
    window.closeMapModal = closeMapModal;
});

