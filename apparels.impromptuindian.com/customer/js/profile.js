// Profile Page JavaScript
lucide.createIcons();

const ThreadlyApi = window.ThreadlyApi || (() => {
    const rawBase =
        window.THREADLY_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('THREADLY_API_BASE') ||
        '';

    let base = rawBase.trim().replace(/\/$/, '');
    if (!base) {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) {
            base = origin.replace(/\/$/, '');
        } else {
            base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
        }
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options)
    };
})();
window.ThreadlyApi = ThreadlyApi;

// Load user data from localStorage
function loadUserProfile() {
    const username = localStorage.getItem('username') || '';
    const email = localStorage.getItem('email') || '';
    const phone = localStorage.getItem('phone') || '';

    // Populate form fields
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');

    if (nameInput) nameInput.value = username;
    if (emailInput) emailInput.value = email;
    if (phoneInput) phoneInput.value = phone;

    // Update avatar initial
    const avatarInitial = document.getElementById('avatarInitial');
    if (avatarInitial && username) {
        avatarInitial.textContent = username.charAt(0).toUpperCase();
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
        const response = await ThreadlyApi.fetch(`/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                role: role,
                username: username,
                email: email,
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
        const response = await ThreadlyApi.fetch(`/change-password`, {
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
                const response = await ThreadlyApi.fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
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
        const response = await ThreadlyApi.fetch(`/addresses/${userId}`);

        if (response.ok) {
            const list = await response.json();
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

        let response;
        if (existingAddress && existingAddress.id) {
            // Update existing address
            response = await ThreadlyApi.fetch(`/addresses/${existingAddress.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });
        } else {
            // Create new address
            response = await ThreadlyApi.fetch('/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        const response = await ThreadlyApi.fetch(`/addresses/${userId}`);

        if (response.ok) {
            const addresses = await response.json();

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

// Reveal animation
const revealEls = document.querySelectorAll('.reveal');
function revealOnScroll() {
    const trigger = window.innerHeight * 0.9;
    revealEls.forEach(el => {
        if (el.getBoundingClientRect().top < trigger) el.classList.add('show');
    });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Load profile data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initAddressEvents();
    loadAllAddresses();
    revealOnScroll();
});
