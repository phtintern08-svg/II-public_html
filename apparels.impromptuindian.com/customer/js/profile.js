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

            if (nameInput) nameInput.value = data.username || '';
            if (emailInput) emailInput.value = data.email || '';
            if (phoneInput) phoneInput.value = data.phone || '';

            // Update localStorage with fresh data
            if (data.username) localStorage.setItem('username', data.username);
            if (data.email) localStorage.setItem('email', data.email);
            if (data.phone) localStorage.setItem('phone', data.phone);

            // Update avatar initial
            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial && data.username) {
                avatarInitial.textContent = data.username.charAt(0).toUpperCase();
            }
        } else {
            // Fallback to localStorage if API fails
            const username = localStorage.getItem('username') || '';
            const email = localStorage.getItem('email') || '';
            const phone = localStorage.getItem('phone') || '';

            const nameInput = document.getElementById('profileName');
            const emailInput = document.getElementById('profileEmail');
            const phoneInput = document.getElementById('profilePhone');

            if (nameInput) nameInput.value = username;
            if (emailInput) emailInput.value = email;
            if (phoneInput) phoneInput.value = phone;

            const avatarInitial = document.getElementById('avatarInitial');
            if (avatarInitial && username) {
                avatarInitial.textContent = username.charAt(0).toUpperCase();
            }

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

        if (nameInput) nameInput.value = username;
        if (emailInput) emailInput.value = email;
        if (phoneInput) phoneInput.value = phone;

        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarInitial && username) {
            avatarInitial.textContent = username.charAt(0).toUpperCase();
        }
    }
}

// Save profile changes
async function saveProfileChanges() {
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');
    const username = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;

    if (!username || !email || !phone) {
        showAlert('Error', 'Please fill in all fields', 'error');
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
                username: username,
                phone: phone
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Update localStorage with new values
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            localStorage.setItem('phone', phone);

            showAlert('Success', 'Profile updated successfully!', 'success');

            // Refresh sidebar to show updated name
            if (typeof populateUserData === 'function') {
                populateUserData();
            }
        } else {
            showAlert('Error', result.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server', 'error');
    }
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
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    const mapModal = document.getElementById("mapModal");
                    mapModal.classList.remove("hidden");

                    // Smart Zoom based on Accuracy
                    const zoomLevel = (pos.coords.accuracy > 500) ? 13 : 18;

                    setTimeout(() => {
                        if (typeof mappls === 'undefined' || !mappls.Map) {
                            console.error("Mappls SDK not loaded.");
                            showAlert("Configuration Error", "Map service not loaded.", "error");
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

                            // Force redraw
                            setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
                        } else {
                            map.setCenter([lat, lng]);
                            marker.setPosition({ lat: lat, lng: lng });
                            map.setZoom(zoomLevel);
                            setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
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

                    setTimeout(() => {
                        if (typeof mappls === 'undefined' || !mappls.Map) return;
                        if (!map) {
                            map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                            marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                            setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
                        } else {
                            map.setCenter([lat, lng]);
                            marker.setPosition({ lat: lat, lng: lng });
                            map.setZoom(12);
                            setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
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

        const performMapSearch = () => {
            const query = mapSearchInput.value.trim();
            if (!query) return;

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
                btn.innerHTML = originalConfirmHTML || 'Confirm Location';
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
            const address = list.find(a => a.address_type === type);

            if (address) {
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
                // Address doesn't exist, clear form and enable edit
                clearAddressForm();
                toggleEditMode(true); // Edit/Create mode
            }
        } else {
            // Error fetching addresses
            clearAddressForm();
            toggleEditMode(true);
        }
    } catch (error) {
        console.error('Error loading address:', error);
        clearAddressForm();
        toggleEditMode(true);
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

            // Store addresses by type
            addresses.forEach(address => {
                addressesData[address.address_type] = address;
            });

            // Load the current address type (default home)
            switchAddressType('home');
        } else {
            // Even if load all fails, try to load default type
            switchAddressType('home');
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
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

// Load Mappls API key from backend and inject into SDK URLs
async function loadMapplsConfig() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found. Map features may not work.');
            return;
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
                // Update CSS link
                const cssLink = document.getElementById('mappls-css');
                if (cssLink) {
                    cssLink.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk_plugins/v3.0/styles/mappls.css`;
                }
                
                // Load script
                const script = document.getElementById('mappls-script');
                if (script) {
                    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?v=3.0&layer=vector&libraries=services`;
                    script.onload = () => console.log('Mappls SDK loaded');
                    script.onerror = () => console.error('Mappls SDK failed to load');
                }
            } else {
                console.warn('Mappls API key not configured');
            }
        }
    } catch (error) {
        console.error('Failed to load map configuration:', error);
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
