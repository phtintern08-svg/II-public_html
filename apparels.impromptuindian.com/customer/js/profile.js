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
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        console.warn('No user ID found');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found');
            return;
        }

        // Fetch profile data from API
        const response = await window.ImpromptuIndianApi.fetch('/api/customer/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
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

            // Update localStorage with fresh data
            if (data.username) localStorage.setItem('username', data.username);
            if (data.email) localStorage.setItem('email', data.email);
            if (data.phone) localStorage.setItem('phone', data.phone);

            // Update avatar initial
            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial && data.username) {
                avatarInitial.textContent = data.username.charAt(0).toUpperCase();
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
        const token = localStorage.getItem('token');
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                // Only include editable fields here (e.g., bio)
                // username, email, phone are read-only
            })
        });

        const result = await response.json();

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
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');
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
        const response = await window.ImpromptuIndianApi.fetch(`/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                role: role,
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const result = await response.json();

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

let currentAddressType = 'home';
let addressesData = {};

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
    if (editAddressBtn) editAddressBtn.addEventListener('click', () => toggleEditMode(true));

    // Initialize location autocomplete (existing logic)
    if (typeof initLocationAutocomplete === 'function') initLocationAutocomplete();

    // --- MAPMYINDIA INTEGRATION ---
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');

    if (useCurrentLocationBtn) {
        let map = null;
        let marker = null;
        const btnHTML = '<i data-lucide="navigation" class="w-4 h-4"></i> Use Current Location';

        useCurrentLocationBtn.addEventListener('click', async () => {
            useCurrentLocationBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Getting Location...';
            useCurrentLocationBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            if (!navigator.geolocation) {
                showAlert("Error", "Geolocation is not supported by your browser", "error");
                useCurrentLocationBtn.innerHTML = btnHTML;
                useCurrentLocationBtn.disabled = false;
                return;
            }

            // Ensure Mappls SDK is loaded before proceeding
            try {
                await loadMapplsConfig();
                await waitForMapplsSDK();
            } catch (sdkError) {
                console.error("SDK load error:", sdkError);
                showAlert("Configuration Error", "Map service is not available. Please refresh the page and try again.", "error");
                useCurrentLocationBtn.innerHTML = btnHTML;
                useCurrentLocationBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
                return;
            }

            // aggressive GPS
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    const mapModal = document.getElementById("mapModal");
                    mapModal.classList.remove("hidden");

                    // Smart Zoom based on Accuracy
                    const zoomLevel = (pos.coords.accuracy > 500) ? 13 : 18;

                    setTimeout(async () => {
                        try {
                            // Ensure SDK is loaded
                            await waitForMapplsSDK();
                        } catch (sdkError) {
                            console.error("Mappls SDK not loaded:", sdkError);
                            showAlert("Configuration Error", "Map service is not loaded correctly. Please refresh the page and try again.", "error");
                            useCurrentLocationBtn.innerHTML = btnHTML;
                            useCurrentLocationBtn.disabled = false;
                            if (window.lucide) lucide.createIcons();
                            return;
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
                            new mappls.Circle({
                                map: map,
                                center: [lat, lng],
                                radius: pos.coords.accuracy,
                                fillColor: "#3b82f6",
                                fillOpacity: 0.15,
                                strokeOpacity: 0.3,
                            });

                            // Force redraw after modal is fully visible
                            setTimeout(() => {
                                if (map && map.invalidateSize) {
                                    map.invalidateSize();
                                    setTimeout(() => {
                                        if (map && map.invalidateSize) map.invalidateSize();
                                    }, 100);
                                }
                            }, 300);
                        } else {
                            map.setCenter([lat, lng]);
                            marker.setPosition({ lat: lat, lng: lng });
                            map.setZoom(zoomLevel);
                            // Force redraw after modal is fully visible
                            setTimeout(() => {
                                if (map && map.invalidateSize) {
                                    map.invalidateSize();
                                    setTimeout(() => {
                                        if (map && map.invalidateSize) map.invalidateSize();
                                    }, 100);
                                }
                            }, 300);
                        }
                    }, 300);

                    useCurrentLocationBtn.innerHTML = btnHTML;
                    useCurrentLocationBtn.disabled = false;
                    lucide.createIcons();
                },
                (err) => {
                    console.error("GPS Error", err);
                    // Fallback to Bangalore if GPS fails
                    const lat = 12.9716, lng = 77.5946;

                    const mapModal = document.getElementById("mapModal");
                    mapModal.classList.remove("hidden");

                    setTimeout(async () => {
                        try {
                            // Ensure SDK is loaded
                            await waitForMapplsSDK();
                        } catch (sdkError) {
                            console.error("Mappls SDK not loaded:", sdkError);
                            showAlert("Configuration Error", "Map service is not available. Please refresh the page and try again.", "error");
                            useCurrentLocationBtn.innerHTML = btnHTML;
                            useCurrentLocationBtn.disabled = false;
                            if (window.lucide) lucide.createIcons();
                            return;
                        }
                        if (!map) {
                            map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                            marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                            // Force redraw after modal is fully visible
                            setTimeout(() => {
                                if (map && map.invalidateSize) {
                                    map.invalidateSize();
                                    setTimeout(() => {
                                        if (map && map.invalidateSize) map.invalidateSize();
                                    }, 100);
                                }
                            }, 300);
                        } else {
                            map.setCenter([lat, lng]);
                            marker.setPosition({ lat: lat, lng: lng });
                            map.setZoom(12);
                            // Force redraw after modal is fully visible
                            setTimeout(() => {
                                if (map && map.invalidateSize) {
                                    map.invalidateSize();
                                    setTimeout(() => {
                                        if (map && map.invalidateSize) map.invalidateSize();
                                    }, 100);
                                }
                            }, 300);
                        }
                    }, 300);

                    useCurrentLocationBtn.innerHTML = btnHTML;
                    useCurrentLocationBtn.disabled = false;
                    lucide.createIcons();
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });

        // Search Functionality
        const mapSearchBtn = document.getElementById("mapSearchBtn");
        const mapSearchInput = document.getElementById("mapSearchInput");

        const performMapSearch = async () => {
            const query = mapSearchInput.value.trim();
            if (!query) return;

            // Ensure SDK and map are ready
            if (!map || typeof mappls === 'undefined' || !mappls.search) {
                try {
                    await waitForMapplsSDK();
                } catch (e) {
                    showAlert("Error", "Map service is not ready. Please wait a moment and try again.", "error");
                    return;
                }
            }

            const oldText = mapSearchBtn.innerText;
            mapSearchBtn.innerText = "...";
            mapSearchBtn.disabled = true;

            try {
                // Client-side SDK search
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
                    } else {
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
                    }
                });
            } catch (e) {
                console.error(e);
                mapSearchBtn.innerText = oldText;
                mapSearchBtn.disabled = false;
            }
        };

        if (mapSearchBtn) mapSearchBtn.onclick = performMapSearch;

        // Confirm Location (Reverse Geocode)
        document.getElementById("confirmLocationBtn").onclick = async () => {
            if (!marker) return;

            const btn = document.getElementById("confirmLocationBtn");
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
                const data = await response.json();

                if (data && !data.error) {
                    // Fill fields
                    // Mappls returns formatted_address usually, or structured
                    const addr = data.results && data.results[0] ? data.results[0] : data;

                    // Helper to extract components safely
                    const getComp = (k) => addr[k] || '';

                    // Fill the profile form
                    document.getElementById("fldHouse").value = getComp('houseNumber') || getComp('house_number') || '';
                    document.getElementById("fldArea").value = getComp('subLocality') || getComp('locality') || getComp('street') || '';
                    document.getElementById("fldLandmark").value = getComp('landmark') || getComp('poi') || '';
                    document.getElementById("fldCity").value = getComp('city') || getComp('district') || '';
                    document.getElementById("fldState").value = getComp('state') || '';
                    document.getElementById("fldCountry").value = getComp('area') || 'India'; // fallback
                    document.getElementById("fldPincode").value = getComp('pincode') || '';

                    document.getElementById("mapModal").classList.add("hidden");

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
                        // Optional: Alert user
                        // showAlert('Info', 'Please fill in missing address details.', 'info');
                    } else {
                        // Auto-save per user request
                        setTimeout(() => saveAddress(), 200);
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
        };
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
    currentAddressType = type;

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
            saveBtn.textContent = `Save ${currentAddressType.charAt(0).toUpperCase() + currentAddressType.slice(1)} Address`;
        }
        if (editBtn) editBtn.classList.add('hidden');
    } else {
        if (saveBtn) saveBtn.classList.add('hidden');
        if (editBtn) editBtn.classList.remove('hidden');
    }
}

// Load address for specific type
async function loadAddressForType(type) {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    // Check if we already have this address in memory
    if (addressesData[type]) {
        fillAddressForm(addressesData[type]);
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
        const token = localStorage.getItem('token');
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const list = data.addresses || data; // Handle both formats
            
            // Handle empty array gracefully
            if (!Array.isArray(list) || list.length === 0) {
                // No addresses saved yet - show empty form for user to add (no error)
                clearAddressForm();
                toggleEditMode(true); // Edit mode
                const saveBtn = document.getElementById('saveAddressBtn');
                const editBtn = document.getElementById('editAddressBtn');
                if (saveBtn) saveBtn.classList.remove('hidden');
                if (editBtn) editBtn.classList.add('hidden');
                return;
            }

            const address = list.find(a => a && a.address_type === type);

            if (address && Object.keys(address).length > 0) {
                addressesData[type] = address;
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
    // address_line1 may contain house and area combined; we split loosely
    const line1 = address.address_line1 || '';
    const parts = line1.split(' ');
    const house = parts.shift() || '';
    const area = parts.join(' ');

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

// Save address
async function saveAddress() {
    const userId = localStorage.getItem('user_id');
    const house = document.getElementById('fldHouse').value.trim();
    const area = document.getElementById('fldArea').value.trim();
    const landmark = document.getElementById('fldLandmark').value.trim();
    const city = document.getElementById('fldCity').value.trim();
    const state = document.getElementById('fldState').value.trim();
    const country = document.getElementById('fldCountry').value.trim();
    const pincode = document.getElementById('fldPincode').value.trim();
    const phone = document.getElementById('fldPhone').value.trim();

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
        customer_id: parseInt(userId),
        address_type: currentAddressType,
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
        const existingAddress = addressesData[currentAddressType];

        const token = localStorage.getItem('token');
        let response;
        if (existingAddress && existingAddress.id) {
            // Update existing address
            response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses/${existingAddress.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });
        } else {
            // Create new address
            response = await window.ImpromptuIndianApi.fetch('/api/customer/addresses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            addressesData[currentAddressType] = result;
            showAlert('Success', `${currentAddressType.charAt(0).toUpperCase() + currentAddressType.slice(1)} address saved successfully!`, 'success');
            toggleEditMode(false); // Switch back to view mode
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
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
        const token = localStorage.getItem('token');
        const response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const addresses = data.addresses || data; // Handle both formats

            // Handle empty array or null response gracefully
            if (Array.isArray(addresses) && addresses.length > 0) {
                // Store addresses by type
                addresses.forEach(address => {
                    if (address && address.address_type) {
                        addressesData[address.address_type] = address;
                    }
                });
            }
            // If addresses array is empty, addressesData remains empty - this is fine
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

// Wait for Mappls SDK to be loaded
function waitForMapplsSDK(maxAttempts = 50, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkSDK = () => {
            if (typeof mappls !== 'undefined' && mappls.Map) {
                resolve(mappls);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSDK, interval);
            } else {
                reject(new Error('Mappls SDK failed to load within timeout'));
            }
        };
        checkSDK();
    });
}

// Load Mappls API key from backend and inject into SDK URLs
async function loadMapplsConfig() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found. Map features may not work.');
            return Promise.resolve(false);
        }
        
        const response = await fetch('/api/config', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const config = await response.json();
            const apiKey = config.mapplsApiKey || '';
            
            if (apiKey) {
                // Check if SDK is already loaded
                if (typeof mappls !== 'undefined' && mappls.Map) {
                    console.log('Mappls SDK already loaded');
                    return Promise.resolve(true);
                }

                // Update CSS link
                const cssLink = document.getElementById('mappls-css');
                if (cssLink && !cssLink.href) {
                    cssLink.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk_plugins/v3.0/styles/mappls.css`;
                }
                
                // Load script
                const script = document.getElementById('mappls-script');
                if (script && !script.src) {
                    return new Promise((resolve, reject) => {
                        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?v=3.0&layer=vector&libraries=services`;
                        script.onload = () => {
                            console.log('Mappls SDK loaded');
                            // Wait a bit more for SDK to be fully initialized
                            setTimeout(() => {
                                waitForMapplsSDK().then(() => resolve(true)).catch(reject);
                            }, 100);
                        };
                        script.onerror = () => {
                            console.error('Mappls SDK failed to load');
                            reject(new Error('Failed to load Mappls SDK script'));
                        };
                    });
                } else if (script && script.src) {
                    // Script is already loading/loaded, wait for it
                    return waitForMapplsSDK().then(() => true).catch(() => false);
                }
            } else {
                console.warn('Mappls API key not configured');
                return Promise.resolve(false);
            }
        }
        return Promise.resolve(false);
    } catch (error) {
        console.error('Failed to load map configuration:', error);
        return Promise.resolve(false);
    }
}

// Load profile data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons first
    initProfilePage();
    
    // Load profile data from database
    loadUserProfile();
    
    // Initialize address management
    initAddressEvents();
    loadAllAddresses();
    
    // Show content immediately
    showAllReveals();
    revealOnScroll();
    
    // Load Mappls configuration
    loadMapplsConfig();
});
