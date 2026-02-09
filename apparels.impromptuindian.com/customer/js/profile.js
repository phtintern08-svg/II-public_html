// Profile Page JavaScript
// DO NOT redeclare ImpromptuIndianApi - sidebar.js already creates it
// Use window.ImpromptuIndianApi directly throughout this file

// Safety check: Ensure ImpromptuIndianApi exists (should be created by sidebar.js)
if (typeof window.ImpromptuIndianApi === 'undefined') {
    console.error('ImpromptuIndianApi is not defined. Make sure sidebar.js is loaded before profile.js');
}

// Initialize icons when DOM is ready
function initProfilePage() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Load user data from API (database)
async function loadUserProfile() {
    try {
        // Fetch profile data from API
        const response = await window.ImpromptuIndianApi.fetch('/api/customer/profile', {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json().catch(() => null);
            if (!data) {
                console.warn('Failed to parse profile response');
                return;
            }
            
            // Populate form fields with data from database
            const nameInput = document.getElementById('profileName');
            const emailInput = document.getElementById('profileEmail');
            const phoneInput = document.getElementById('profilePhone');

            if (nameInput) {
                nameInput.value = data.username || '';
                nameInput.setAttribute('readonly', 'readonly');
                nameInput.setAttribute('disabled', 'disabled');
            }
            if (emailInput) {
                emailInput.value = data.email || '';
                emailInput.setAttribute('readonly', 'readonly');
                emailInput.setAttribute('disabled', 'disabled');
            }
            if (phoneInput) {
                phoneInput.value = data.phone || '';
                phoneInput.setAttribute('readonly', 'readonly');
                phoneInput.setAttribute('disabled', 'disabled');
            }

            // Store complete customer profile data from database
            localStorage.setItem('customer_profile', JSON.stringify(data));
            
            // Update localStorage with fresh data from database
            if (data.username) localStorage.setItem('username', data.username);
            if (data.email) localStorage.setItem('email', data.email);
            if (data.phone) localStorage.setItem('phone', data.phone);
            if (data.bio) localStorage.setItem('bio', data.bio);
            if (data.avatar_url) localStorage.setItem('avatar_url', data.avatar_url);

            // Update avatar initial
            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial && data.username) {
                avatarInitial.textContent = data.username.charAt(0).toUpperCase();
            }
            
            // Show account verified badge if email is verified
            if (data.is_email_verified) {
                const badge = document.getElementById('accountVerifiedBadge');
                if (badge) badge.classList.remove('hidden');
            }

            // Update display name and email in header
            const displayName = document.getElementById('displayName');
            const displayEmail = document.getElementById('displayEmail');
            if (displayName) displayName.textContent = data.username || 'User';
            if (displayEmail) displayEmail.textContent = data.email || '';

            // Update account creation date
            const accountDate = document.getElementById('accountDate');
            if (accountDate && data.created_at) {
                const date = new Date(data.created_at);
                accountDate.textContent = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                });
            } else if (accountDate) {
                accountDate.textContent = 'Recently';
            }
        } else {
            // Fallback to localStorage if API fails
            const username = localStorage.getItem('username') || '';
            const email = localStorage.getItem('email') || '';
            const phone = localStorage.getItem('phone') || '';

            const nameInput = document.getElementById('profileName');
            const emailInput = document.getElementById('profileEmail');
            const phoneInput = document.getElementById('profilePhone');

            if (nameInput) {
                nameInput.value = username;
                nameInput.setAttribute('readonly', 'readonly');
                nameInput.setAttribute('disabled', 'disabled');
            }
            if (emailInput) {
                emailInput.value = email;
                emailInput.setAttribute('readonly', 'readonly');
                emailInput.setAttribute('disabled', 'disabled');
            }
            if (phoneInput) {
                phoneInput.value = phone;
                phoneInput.setAttribute('readonly', 'readonly');
                phoneInput.setAttribute('disabled', 'disabled');
            }

            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial && username) {
                avatarInitial.textContent = username.charAt(0).toUpperCase();
            }

            // Update display name and email in header (fallback)
            const displayName = document.getElementById('displayName');
            const displayEmail = document.getElementById('displayEmail');
            if (displayName) displayName.textContent = username || 'User';
            if (displayEmail) displayEmail.textContent = email || '';

            console.warn('Failed to load profile from API, using localStorage fallback');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        
        // Fallback to localStorage on error
        const username = localStorage.getItem('username') || '';
        const email = localStorage.getItem('email') || '';
        const phone = localStorage.getItem('phone') || '';

        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');

        if (nameInput) {
            nameInput.value = username;
            nameInput.setAttribute('readonly', 'readonly');
            nameInput.setAttribute('disabled', 'disabled');
        }
        if (emailInput) {
            emailInput.value = email;
            emailInput.setAttribute('readonly', 'readonly');
            emailInput.setAttribute('disabled', 'disabled');
        }
        if (phoneInput) {
            phoneInput.value = phone;
            phoneInput.setAttribute('readonly', 'readonly');
            phoneInput.setAttribute('disabled', 'disabled');
        }

        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarInitial && username) {
            avatarInitial.textContent = username.charAt(0).toUpperCase();
        }

        // Update display name and email in header (error fallback)
        const displayName = document.getElementById('displayName');
        const displayEmail = document.getElementById('displayEmail');
        if (displayName) displayName.textContent = username || 'User';
        if (displayEmail) displayEmail.textContent = email || '';
    }
}

// Save profile changes - DISABLED: Name, email, and phone are read-only from database
// These fields are fetched from impromptuindian_customer/customers table and cannot be edited
async function saveProfileChanges() {
    showAlert('Info', 'Name, email, and phone number cannot be edited. These are managed by your account settings.', 'info');
    return;
    
    // Note: If you need to allow editing other profile fields (like bio), uncomment and modify below
    /*
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        showAlert('Error', 'User not authenticated', 'error');
        return;
    }

    try {
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Only include editable fields here (e.g., bio)
                // username, email, phone are read-only
            })
        });

        const result = await response.json().catch(() => null);
        if (!result) {
            console.warn('Failed to parse response');
            return;
        }

        if (response.ok) {
            showAlert('Success', 'Profile updated successfully!', 'success');
        } else {
            showAlert('Error', result.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server', 'error');
    }
    */
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Error', 'Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Error', 'New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('Error', 'Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const result = await response.json().catch(() => null);
        if (!result) {
            console.warn('Failed to parse response');
            return;
        }

        if (response.ok) {
            showAlert('Success', 'Password changed successfully!', 'success');
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showAlert('Error', result.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server', 'error');
    }
}

// --- ADDRESS MANAGEMENT ---

// Namespace address state to prevent global variable collisions
window.AddressState = window.AddressState || {
    currentType: 'home',
    data: {}
};

/* ---------------------------
   Normalize address API response (handles all formats)
---------------------------*/
function normalizeAddressResponse(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.addresses)) return data.addresses;
    return [];
}

// Initialize Address Events
function initAddressEvents() {
    const btnHome = document.getElementById('btnHome');
    const btnWork = document.getElementById('btnWork');
    const btnOther = document.getElementById('btnOther');
    const saveAddressBtn = document.getElementById('saveAddressBtn');
    const editAddressBtn = document.getElementById('editAddressBtn');

    if (btnHome) btnHome.addEventListener('click', () => switchAddressType('home'));
    if (btnWork) btnWork.addEventListener('click', () => switchAddressType('work'));
    if (btnOther) btnOther.addEventListener('click', () => switchAddressType('other'));
    if (saveAddressBtn) saveAddressBtn.addEventListener('click', saveAddress);
    
    // Add phone number validation on input
    const phoneInput = document.getElementById('fldPhone');
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            const value = e.target.value;
            // Allow only digits and common formatting characters
            const cleaned = value.replace(/[^\d\s\-\(\)]/g, '');
            if (cleaned !== value) {
                e.target.value = cleaned;
            }
        });
        
        phoneInput.addEventListener("blur", (e) => {
            const phone = e.target.value.trim();
            if (phone) {
                const validation = validatePhoneNumber(phone);
                if (!validation.valid) {
                    showAlert("Invalid Phone Number", validation.error, "error");
                    e.target.focus();
                    return;
                }
                
                const duplicateCheck = checkDuplicatePhone(phone);
                if (duplicateCheck.isDuplicate) {
                    showAlert("Duplicate Phone Number", duplicateCheck.message, "warning");
                }
            }
        });
    }
    if (editAddressBtn) editAddressBtn.addEventListener('click', () => toggleEditMode(true));

    // Initialize location autocomplete (existing logic)
    if (typeof initLocationAutocomplete === 'function') initLocationAutocomplete();

    // --- MAPMYINDIA INTEGRATION ---
    // Load Mappls SDK dynamically (same pattern as new-order.js)
    let mapplsLoadingPromise = null;

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

          console.log("✅ Mappls SDK loaded successfully");
        } catch (err) {
          console.error('Mappls SDK load error:', err);
          mapplsLoadingPromise = null; // Reset on error so it can be retried
          throw err;
        }
      })();

      return mapplsLoadingPromise;
    }

    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');

    if (useCurrentLocationBtn) {
        let map = null;
        let marker = null;
        const btnHTML = '<i data-lucide="navigation" class="w-4 h-4"></i> Use Current Location';

        useCurrentLocationBtn.addEventListener('click', () => {
            useCurrentLocationBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Getting Location...';
            useCurrentLocationBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            if (!navigator.geolocation) {
                showAlert("Error", "Geolocation is not supported by your browser", "error");
                useCurrentLocationBtn.innerHTML = btnHTML;
                useCurrentLocationBtn.disabled = false;
                return;
            }

            // aggressive GPS
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
                    mapModal.classList.remove("map-hidden");
                    mapModal.classList.add("map-visible");

                    // Smart Zoom based on Accuracy
                    const zoomLevel = (pos.coords && pos.coords.accuracy > 500) ? 13 : 18;

                    // Use requestAnimationFrame to ensure modal is visible before map init
                    requestAnimationFrame(async () => {
                        try {
                            await loadMapplsSDK();
                            if (typeof mappls === 'undefined' || !mappls.Map) {
                                throw new Error("Mappls SDK not loaded");
                            }

                            const container = document.getElementById("mapContainer");
                            if (container) {
                                container.style.height = "100%";
                                container.style.minHeight = "420px";
                            }

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

                                // Accuracy Circle
                                if (pos.coords && pos.coords.accuracy) {
                                    new mappls.Circle({
                                        map: map,
                                        center: [lat, lng],
                                        radius: pos.coords.accuracy,
                                        fillColor: "#3b82f6",
                                        fillOpacity: 0.15,
                                        strokeOpacity: 0.3,
                                    });
                                }

                                // Force resize to handle modal animation timing
                                setTimeout(() => {
                                    if (map && map.resize) map.resize();
                                }, 300);

                                setTimeout(() => {
                                    if (map && map.resize) map.resize();
                                }, 800);
                            } else {
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
                            showAlert("Configuration Error", "Map service not loaded. " + err.message, "error");
                            const mapModal = document.getElementById("mapModal");
                            if (mapModal) {
                                mapModal.classList.remove("map-visible");
                                mapModal.classList.add("map-hidden");
                            }
                        }
                    });

                    useCurrentLocationBtn.innerHTML = btnHTML;
                    useCurrentLocationBtn.disabled = false;
                    if (window.lucide) lucide.createIcons();
                },
                async (err) => {
                    console.error("GPS Error", err);
                    // Fallback to Bangalore if GPS fails
                    const lat = 12.9716, lng = 77.5946;

                    const mapModal = document.getElementById("mapModal");
                    mapModal.classList.remove("map-hidden");
                    mapModal.classList.add("map-visible");

                    // Use requestAnimationFrame to ensure modal is visible before map init
                    requestAnimationFrame(async () => {
                        try {
                            await loadMapplsSDK();
                            if (typeof mappls === 'undefined' || !mappls.Map) {
                                throw new Error("Mappls SDK not loaded");
                            }

                            const container = document.getElementById("mapContainer");
                            if (container) {
                                container.style.height = "100%";
                                container.style.minHeight = "420px";
                            }

                            if (!map) {
                                map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                                marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                                
                                // Force resize to handle modal animation timing
                                setTimeout(() => {
                                    if (map && map.resize) map.resize();
                                }, 300);

                                setTimeout(() => {
                                    if (map && map.resize) map.resize();
                                }, 800);
                            } else {
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
                            showAlert("Configuration Error", "Map service not loaded. " + err.message, "error");
                            const mapModal = document.getElementById("mapModal");
                            if (mapModal) {
                                mapModal.classList.remove("map-visible");
                                mapModal.classList.add("map-hidden");
                            }
                        }
                    });

                    useCurrentLocationBtn.innerHTML = btnHTML;
                    useCurrentLocationBtn.disabled = false;
                    if (window.lucide) lucide.createIcons();
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });

        // Search Functionality
        const mapSearchBtn = document.getElementById("mapSearchBtn");
        const mapSearchInput = document.getElementById("mapSearchInput");

        const performMapSearch = () => {
            const query = mapSearchInput.value.trim();
            if (!query) return;

            // Safety check: Ensure map and marker exist
            if (!map || !marker) {
                showAlert("Error", "Map not initialized. Please try again.", "error");
                return;
            }

            // Safety check: Ensure search functions are available
            if (typeof mappls === 'undefined' || (!mappls.search && !mappls.autoSuggest)) {
                showAlert("Error", "Search functionality not available. Please refresh the page.", "error");
                return;
            }

            const oldText = mapSearchBtn.innerText;
            mapSearchBtn.innerText = "...";
            mapSearchBtn.disabled = true;

            try {
                // Client-side SDK search (if available)
                if (mappls.search) {
                    mappls.search({ query: query }, (data) => {
                        mapSearchBtn.innerText = oldText;
                        mapSearchBtn.disabled = false;

                        if (data && data.length > 0) {
                            const result = data[0];
                            const lat = parseFloat(result.latitude || result.lat);
                            const lng = parseFloat(result.longitude || result.lng);
                            if (!isNaN(lat) && !isNaN(lng)) {
                                map.setCenter([lat, lng]);
                                marker.setPosition({ lat: lat, lng: lng });
                                map.setZoom(17);
                            }
                        } else if (mappls.autoSuggest) {
                            // Fallback to autosuggest
                            mappls.autoSuggest({ query: query }, (autoData) => {
                                if (autoData && autoData.length > 0) {
                                    const res = autoData[0];
                                    const lat = parseFloat(res.latitude || res.lat);
                                    const lng = parseFloat(res.longitude || res.lng);
                                    if (!isNaN(lat)) {
                                        map.setCenter([lat, lng]);
                                        marker.setPosition({ lat: lat, lng: lng });
                                        map.setZoom(17);
                                    }
                                } else {
                                    showAlert("Not Found", "Location not found.", "info");
                                }
                            });
                        } else {
                            showAlert("Not Found", "Location not found.", "info");
                        }
                    });
                } else if (mappls.autoSuggest) {
                    // Fallback to autosuggest only
                    mappls.autoSuggest({ query: query }, (autoData) => {
                        mapSearchBtn.innerText = oldText;
                        mapSearchBtn.disabled = false;

                        if (autoData && autoData.length > 0) {
                            const res = autoData[0];
                            const lat = parseFloat(res.latitude || res.lat);
                            const lng = parseFloat(res.longitude || res.lng);
                            if (!isNaN(lat)) {
                                map.setCenter([lat, lng]);
                                marker.setPosition({ lat: lat, lng: lng });
                                map.setZoom(17);
                            }
                        } else {
                            showAlert("Not Found", "Location not found.", "info");
                        }
                    });
                } else {
                    mapSearchBtn.innerText = oldText;
                    mapSearchBtn.disabled = false;
                    showAlert("Error", "Search functionality not available.", "error");
                }
            } catch (e) {
                console.error(e);
                mapSearchBtn.innerText = oldText;
                mapSearchBtn.disabled = false;
                showAlert("Error", "Search failed. Please try again.", "error");
            }
        };

        // Use onclick to prevent listener stacking
        if (mapSearchBtn) mapSearchBtn.onclick = performMapSearch;

        // Enter key support for search input
        if (mapSearchInput) {
            mapSearchInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performMapSearch();
                }
            };
        }

        // Confirm Location (Reverse Geocode)
        const confirmBtn = document.getElementById("confirmLocationBtn");
        if (confirmBtn && !confirmBtn.dataset.bound) {
          confirmBtn.dataset.bound = "1";
          confirmBtn.addEventListener("click", async () => {
            if (!marker) return;

            const btn = confirmBtn;
            const oldHTML = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
            btn.disabled = true;

            const pos = marker.getPosition(); // returns {lat, lng} or [lat, lng] depending on version
            // normalize
            let lat, lng;
            if (pos.lat && pos.lng) { lat = pos.lat; lng = pos.lng; }
            else if (Array.isArray(pos)) { lat = pos[0]; lng = pos[1]; }
            else { lat = pos.lat; lng = pos.lng; } // fallback

            try {
                // Using backend proxy if possible, or try client side reverse if key allows.
                // We established backend proxy '/api/reverse-geocode' is safer/better
                const response = await window.ImpromptuIndianApi.fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
                const data = await response.json().catch(() => null);
                if (!data) {
                    console.warn('Failed to parse geocode response');
                    return;
                }

                if (data && !data.error) {
                    // Fill fields
                    // Mappls returns formatted_address usually, or structured
                    const addr = data.results && data.results[0] ? data.results[0] : data;

                    // Helper to extract components safely
                    const getComp = (k) => addr[k] || '';

                    // Determine target address type with user selection
                    let targetType = await selectAddressType(addr);
                    
                    // If user cancelled selection, don't proceed
                    if (!targetType) {
                        showAlert("Info", "Address type selection cancelled. Please select an address type manually.", "info");
                        btn.innerHTML = oldHTML;
                        btn.disabled = false;
                        lucide.createIcons();
                        return;
                    }
                    
                    // Update current address type
                    AddressState.currentType = targetType;

                    // Fill the profile form
                    document.getElementById("fldHouse").value = getComp('houseNumber') || getComp('house_number') || '';
                    document.getElementById("fldArea").value = getComp('subLocality') || getComp('locality') || getComp('street') || '';
                    document.getElementById("fldLandmark").value = getComp('landmark') || getComp('poi') || '';
                    document.getElementById("fldCity").value = getComp('city') || getComp('district') || '';
                    document.getElementById("fldState").value = getComp('state') || '';
                    document.getElementById("fldCountry").value = getComp('area') || 'India'; // fallback
                    document.getElementById("fldPincode").value = getComp('pincode') || '';

                    const mapModal = document.getElementById("mapModal");
                    if (mapModal) {
                        mapModal.classList.remove("map-visible");
                        mapModal.classList.add("map-hidden");
                    }

                    // Check for missing mandatory fields after fetch
                    const idsToCheck = ["fldHouse", "fldArea", "fldLandmark"];
                    let hasEmpty = false;
                    idsToCheck.forEach(id => {
                        const el = document.getElementById(id);
                        if (el && !el.value.trim()) hasEmpty = true;
                    });

                    if (hasEmpty) {
                        // Don't auto-save. Enable edit mode so user can fill them.
                        toggleEditMode(true);
                        showAlert("Location Fetched", "Please fill in the missing address details and save.", "info");
                    } else {
                        // Auto-save per user request
                        try {
                            await saveAddress();
                            showAlert("Success", "Address saved successfully!", "success");
                        } catch (saveErr) {
                            console.error("Auto-save error:", saveErr);
                            showAlert("Location Fetched", "Address details loaded. Please verify and save manually.", "info");
                        }
                    }

                } else {
                    showAlert("Error", "Could not fetch address details.", "error");
                }
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to reverse geocode.", "error");
            } finally {
                btn.innerHTML = oldHTML;
                btn.disabled = false;
                lucide.createIcons();
            }
          });
        }
    }
}

// Initialize location autocomplete for address fields
function initLocationAutocomplete() {
    const locationService = new LocationService();

    // Country autocomplete
    const countryInput = document.getElementById('fldCountry');
    if (countryInput) {
        new AutocompleteDropdown(countryInput, {
            onFocus: async () => {
                return await locationService.loadCountries();
            },
            onInput: async (query) => {
                const countries = await locationService.loadCountries();
                return locationService.filterItems(countries, query);
            },
            onSelect: (country) => {
                // Clear dependent fields when country changes
                document.getElementById('fldState').value = '';
                document.getElementById('fldCity').value = '';
            }
        });
    }

    // State autocomplete
    const stateInput = document.getElementById('fldState');
    if (stateInput) {
        new AutocompleteDropdown(stateInput, {
            onFocus: () => {
                const country = document.getElementById('fldCountry').value;
                return locationService.getStates(country);
            },
            onInput: (query) => {
                const country = document.getElementById('fldCountry').value;
                const states = locationService.getStates(country);
                return locationService.filterItems(states, query);
            },
            onSelect: (state) => {
                // Clear city when state changes
                document.getElementById('fldCity').value = '';
            }
        });
    }

    // City autocomplete
    const cityInput = document.getElementById('fldCity');
    if (cityInput) {
        new AutocompleteDropdown(cityInput, {
            onFocus: async () => {
                const state = document.getElementById('fldState').value;
                if (!state) return [];
                return await locationService.getCitiesByState(state);
            },
            onInput: async (query) => {
                const state = document.getElementById('fldState').value;
                if (!state) return [];
                const cities = await locationService.getCitiesByState(state);
                return locationService.filterItems(cities, query);
            }
        });
    }

    // Pincode autocomplete with auto-fill
    const pincodeInput = document.getElementById('fldPincode');
    if (pincodeInput) {
        pincodeInput.addEventListener('input', async (e) => {
            const pincode = e.target.value.trim();
            if (pincode.length === 6) {
                const locationInfo = await locationService.getLocationByPincode(pincode);
                if (locationInfo) {
                    // Auto-fill city, state, and country
                    if (locationInfo.city) document.getElementById('fldCity').value = locationInfo.city;
                    if (locationInfo.state) document.getElementById('fldState').value = locationInfo.state;
                    if (locationInfo.country) document.getElementById('fldCountry').value = locationInfo.country;
                }
            }
        });
    }
}



// Switch address type tabs
function switchAddressType(type) {
    AddressState.currentType = type;

    const btnHome = document.getElementById('btnHome');
    const btnWork = document.getElementById('btnWork');
    const btnOther = document.getElementById('btnOther');

    // Update tab styling
    [btnHome, btnWork, btnOther].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    const activeBtn = type === 'home' ? btnHome : type === 'work' ? btnWork : btnOther;
    if (activeBtn) activeBtn.classList.add('active');

    // Load address for this type
    loadAddressForType(type);
    if (window.lucide) lucide.createIcons();
}

// Toggle Edit Mode
function toggleEditMode(enable) {
    const fields = ['fldHouse', 'fldArea', 'fldLandmark', 'fldCity', 'fldState', 'fldCountry', 'fldPincode', 'fldPhone'];
    const saveBtn = document.getElementById('saveAddressBtn');
    const editBtn = document.getElementById('editAddressBtn');

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !enable;
    });

    if (enable) {
        if (saveBtn) {
            saveBtn.classList.remove('hidden');
            saveBtn.textContent = `Save ${AddressState.currentType.charAt(0).toUpperCase() + AddressState.currentType.slice(1)} Address`;
        }
        if (editBtn) editBtn.classList.add('hidden');
    } else {
        if (saveBtn) saveBtn.classList.add('hidden');
        if (editBtn) editBtn.classList.remove('hidden');
    }
}

// Load address for specific type
async function loadAddressForType(type) {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check if we already have this address in memory
    if (AddressState.data[type]) {
        fillAddressForm(AddressState.data[type]);
        toggleEditMode(false); // View mode

        // Check for missing fields
        const idsToCheck = ["fldHouse", "fldArea", "fldLandmark"];
        let hasEmptyFields = false;
        idsToCheck.forEach((id) => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
                el.disabled = false;
                hasEmptyFields = true;
            }
        });

        if (hasEmptyFields) {
            const saveBtn = document.getElementById('saveAddressBtn');
            const editBtn = document.getElementById('editAddressBtn');
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (editBtn) editBtn.classList.add('hidden');
        }
        return;
    }

    try {
        // Fetch all addresses for the user
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const raw = await response.json().catch(() => null);
            if (!raw) {
                console.warn('Failed to parse addresses response');
                return;
            }
            const addresses = normalizeAddressResponse(raw);
            
            // Handle empty array gracefully - always show empty form for new users
            if (addresses.length === 0) {
                clearAddressForm();
                toggleEditMode(true); // Edit mode
                const saveBtn = document.getElementById('saveAddressBtn');
                const editBtn = document.getElementById('editAddressBtn');
                if (saveBtn) saveBtn.classList.remove('hidden');
                if (editBtn) editBtn.classList.add('hidden');
                return;
            }

            const address = addresses.find(a => a && a.address_type === type);

            if (address && Object.keys(address).length > 0) {
                AddressState.data[type] = address;
                fillAddressForm(address);
                toggleEditMode(false); // View mode

                // Check for missing fields
                const idsToCheck = ["fldHouse", "fldArea", "fldLandmark"];
                let hasEmptyFields = false;
                idsToCheck.forEach((id) => {
                    const el = document.getElementById(id);
                    if (el && !el.value.trim()) {
                        el.disabled = false;
                        hasEmptyFields = true;
                    }
                });

                if (hasEmptyFields) {
                    const saveBtn = document.getElementById('saveAddressBtn');
                    const editBtn = document.getElementById('editAddressBtn');
                    if (saveBtn) saveBtn.classList.remove('hidden');
                    if (editBtn) editBtn.classList.add('hidden');
                }
            } else {
                // No address found for this type - show empty form (no error)
                clearAddressForm();
                toggleEditMode(true); // Edit mode
                const saveBtn = document.getElementById('saveAddressBtn');
                const editBtn = document.getElementById('editAddressBtn');
                if (saveBtn) saveBtn.classList.remove('hidden');
                if (editBtn) editBtn.classList.add('hidden');
            }
        } else if (response.status === 404) {
            // 404 is fine - user just hasn't saved any addresses yet
            // Show empty form for user to add address (no error)
            clearAddressForm();
            toggleEditMode(true);
            const saveBtn = document.getElementById('saveAddressBtn');
            const editBtn = document.getElementById('editAddressBtn');
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (editBtn) editBtn.classList.add('hidden');
        } else {
            // Other API errors - still allow user to add address
            clearAddressForm();
            toggleEditMode(true);
            const saveBtn = document.getElementById('saveAddressBtn');
            const editBtn = document.getElementById('editAddressBtn');
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (editBtn) editBtn.classList.add('hidden');
        }
    } catch (error) {
        // Silently handle errors - don't show alerts for missing addresses
        // User can still add addresses on this page
        console.log('Address not loaded - user can add new one:', error.message);
        // Show empty form for user to add address (no error)
        clearAddressForm();
        toggleEditMode(true);
        const saveBtn = document.getElementById('saveAddressBtn');
        const editBtn = document.getElementById('editAddressBtn');
        if (saveBtn) saveBtn.classList.remove('hidden');
        if (editBtn) editBtn.classList.add('hidden');
    }
}

// Fill address form with data
function fillAddressForm(address) {
    // Note: address_line1 splitting is fragile for complex addresses like "Flat No 12 Block A Phase 2"
    // For MVP, we split on first space. Future: consider storing house/area separately in DB
    const line1 = address.address_line1 || '';
    const parts = line1.split(' ');
    const house = address.house || (parts.length > 0 ? parts[0] : '');
    const area = address.area || (parts.length > 1 ? parts.slice(1).join(' ') : '');

    if (document.getElementById('fldHouse')) document.getElementById('fldHouse').value = house;
    if (document.getElementById('fldArea')) document.getElementById('fldArea').value = area;
    if (document.getElementById('fldLandmark')) document.getElementById('fldLandmark').value = address.landmark || '';
    if (document.getElementById('fldCity')) document.getElementById('fldCity').value = address.city || '';
    if (document.getElementById('fldState')) document.getElementById('fldState').value = address.state || '';
    if (document.getElementById('fldCountry')) document.getElementById('fldCountry').value = address.country || '';
    if (document.getElementById('fldPincode')) document.getElementById('fldPincode').value = address.pincode || '';
    // Note: Backend might not have phone in address model yet, but we handle it in UI
    if (document.getElementById('fldPhone')) document.getElementById('fldPhone').value = address.alternative_phone || '';
}

// Clear address form
function clearAddressForm() {
    ['fldHouse', 'fldArea', 'fldLandmark', 'fldCity', 'fldState', 'fldCountry', 'fldPincode', 'fldPhone'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

/* ---------------------------
   Phone Number Validation
---------------------------*/
function validatePhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check length (Indian phone numbers: 10 digits)
    if (cleaned.length !== 10) {
        return { valid: false, error: "Phone number must be exactly 10 digits" };
    }
    
    // Check format (should start with 6-9 for Indian mobile numbers)
    if (!/^[6-9]/.test(cleaned)) {
        return { valid: false, error: "Phone number must start with 6, 7, 8, or 9" };
    }
    
    return { valid: true, cleaned };
}

function checkDuplicatePhone(phone) {
    // Get registered phone from localStorage
    const customerProfile = localStorage.getItem('customer_profile');
    if (customerProfile) {
        try {
            const profile = JSON.parse(customerProfile);
            const registeredPhone = profile.phone || localStorage.getItem('phone');
            if (registeredPhone) {
                const registeredCleaned = registeredPhone.replace(/\D/g, '');
                const inputCleaned = phone.replace(/\D/g, '');
                if (registeredCleaned === inputCleaned) {
                    return { isDuplicate: true, message: "This phone number is already registered as your primary phone number" };
                }
            }
        } catch (e) {
            console.warn("Failed to parse customer profile", e);
        }
    }
    return { isDuplicate: false };
}

/* ---------------------------
   Address Type Selection Dialog
---------------------------*/
async function selectAddressType(addressData) {
    return new Promise((resolve) => {
        // Check which address types are already filled
        const hasHome = !!AddressState.data.home;
        const hasWork = !!AddressState.data.work;
        const hasOther = !!AddressState.data.other;
        
        // Count how many "other" addresses exist
        const otherAddresses = Object.keys(AddressState.data).filter(key => 
            key.startsWith('other') && AddressState.data[key]
        );
        const otherCount = otherAddresses.length;
        
        // If all three basic types are filled, offer other1, other2, etc.
        if (hasHome && hasWork && hasOther) {
            const nextOtherNum = otherCount + 1;
            
            // Show custom dialog
            const userChoice = confirm(
                `All primary address types (Home, Work, Other) are filled.\n\n` +
                `Would you like to save this as "Other ${nextOtherNum}"?\n\n` +
                `Click OK to save as "Other ${nextOtherNum}" or Cancel to choose a different type.`
            );
            
            if (userChoice) {
                resolve(`other${nextOtherNum}`);
            } else {
                // Let user manually select
                resolve(null);
            }
            return;
        }
        
        // If home exists, ask where to add
        if (hasHome && (!hasWork || !hasOther)) {
            const options = [];
            if (!hasWork) options.push('work');
            if (!hasOther) options.push('other');
            
            if (options.length === 1) {
                // Only one option, auto-select
                resolve(options[0]);
                return;
            }
            
            // Multiple options, show dialog
            const choice = confirm(
                `You already have a Home address.\n\n` +
                `Where would you like to add this address?\n\n` +
                `Click OK for Work, Cancel for Other`
            );
            
            resolve(choice ? 'work' : 'other');
            return;
        }
        
        // Default: auto-select first empty slot
        if (!hasHome) resolve('home');
        else if (!hasWork) resolve('work');
        else if (!hasOther) resolve('other');
        else resolve('other1');
    });
}

// Save address
async function saveAddress() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Error', 'Authentication required. Please log in again.', 'error');
        return;
    }

    const house = document.getElementById('fldHouse').value.trim();
    const area = document.getElementById('fldArea').value.trim();
    const landmark = document.getElementById('fldLandmark').value.trim();
    const city = document.getElementById('fldCity').value.trim();
    const state = document.getElementById('fldState').value.trim();
    const country = document.getElementById('fldCountry').value.trim();
    const pincode = document.getElementById('fldPincode').value.trim();
    const phone = document.getElementById('fldPhone').value.trim();
    
    // Validate phone number if provided
    if (phone) {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.valid) {
            showAlert("Invalid Phone Number", phoneValidation.error, "error");
            return;
        }
        
        // Check for duplicate with registered phone
        const duplicateCheck = checkDuplicatePhone(phone);
        if (duplicateCheck.isDuplicate) {
            const proceed = confirm(duplicateCheck.message + "\n\nDo you still want to use this number?");
            if (!proceed) {
                document.getElementById('fldPhone').focus();
                return;
            }
        }
    }

    // Validation
    if (!house || !area || !city || !state || !pincode) {
        showAlert('Missing Fields', 'Please fill in all required fields (House, Area, City, State, Pincode)', 'error');
        return;
    }

    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
        showAlert('Invalid Pincode', 'Pincode must be 6 digits', 'error');
        return;
    }

    const addressData = {
        address_type: AddressState.currentType,
        address_line1: house + ' ' + area,
        address_line2: landmark,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        landmark: landmark,
        alternative_phone: phone // Pass phone as alternative_phone
    };

    try {
        // Check if address already exists (either in memory or we can try update)
        const existingAddress = AddressState.data[AddressState.currentType];

        let response;
        if (existingAddress && existingAddress.id) {
            // Update existing address
            response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses/${existingAddress.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });
        } else {
            // Create new address
            response = await window.ImpromptuIndianApi.fetch('/api/customer/addresses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });
        }

        const result = await response.json().catch(() => null);
        if (!result) {
            console.warn('Failed to parse response');
            return;
        }

        if (response.ok) {
            // Update local cache immediately
            AddressState.data[AddressState.currentType] = result;
            
            // Immediately reflect in UI
            fillAddressForm(result);
            toggleEditMode(false); // Switch back to view mode
            
            // Trigger cross-page sync
            localStorage.setItem('address_updated_at', Date.now().toString());
            
            showAlert('Success', `${AddressState.currentType.charAt(0).toUpperCase() + AddressState.currentType.slice(1)} address saved successfully!`, 'success');
        } else {
            showAlert('Error', result.error || 'Failed to save address', 'error');
        }
    } catch (error) {
        console.error('Error saving address:', error);
        showAlert('Connection Error', 'Failed to connect to server', 'error');
    }
}

// Load all addresses when page loads
async function loadAllAddresses() {
    try {
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const raw = await response.json().catch(() => null);
            if (!raw) {
                console.warn('Failed to parse addresses response');
                return;
            }
            const addresses = normalizeAddressResponse(raw);

            // Handle empty array or null response gracefully
            if (addresses.length > 0) {
                // Store addresses by type
                addresses.forEach(address => {
                    if (address && address.address_type) {
                        AddressState.data[address.address_type] = address;
                    }
                });
            }
            // If addresses array is empty, AddressState.data remains empty - this is fine
            // User can add addresses on this page

            // Load the current address type (default home) - this will show empty form if no address
            switchAddressType('home');
        } else if (response.status === 404) {
            // 404 is fine - user just hasn't saved any addresses yet
            // Show empty form for user to add address
            switchAddressType('home');
        } else {
            // Other errors - still allow user to add address
            switchAddressType('home');
        }
    } catch (error) {
        // Silently handle errors - don't show alerts for missing addresses
        // User can still add addresses on this page
        console.log('Addresses not loaded - user can add new ones:', error.message);
        // Show empty form for user to add address
        switchAddressType('home');
    }
}

// Reveal animation - ensure content is visible
const revealEls = document.querySelectorAll('.reveal');
function revealOnScroll() {
    const trigger = window.innerHeight * 0.9;
    revealEls.forEach(el => {
        if (el.getBoundingClientRect().top < trigger) {
            el.classList.add('show');
        }
    });
}

// Show all reveal elements immediately on page load (don't wait for scroll)
function showAllReveals() {
    revealEls.forEach(el => {
        el.classList.add('show');
    });
}

// Show content immediately when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        showAllReveals();
        window.addEventListener('scroll', revealOnScroll);
    });
} else {
    // DOM already loaded
    showAllReveals();
    window.addEventListener('scroll', revealOnScroll);
}

// Load profile data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons first
    initProfilePage();
    
    // Load profile data from database
    loadUserProfile();
    
    // Initialize address management
    initAddressEvents();
    
    // Check for cross-page sync (address updated on another page)
    const lastSeenUpdate = localStorage.getItem('address_updated_at_seen');
    const currentUpdate = localStorage.getItem('address_updated_at');
    
    if (currentUpdate && currentUpdate !== lastSeenUpdate) {
        // Address was updated on another page - reload addresses
        loadAllAddresses().then(() => {
            localStorage.setItem('address_updated_at_seen', currentUpdate);
        });
    } else {
        loadAllAddresses();
    }
    
    // Show content immediately
    showAllReveals();
    revealOnScroll();
    
    // Note: Mappls SDK will be loaded on-demand when map modal opens (via loadMapplsSDK from new-order.js)
    // This prevents loading SDK on every page load and avoids double-loading conflicts
});
