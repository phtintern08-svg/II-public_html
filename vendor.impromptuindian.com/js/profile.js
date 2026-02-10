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
    // ✅ FIX: Remove dependency on localStorage.user_id - rely only on JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found - cannot load vendor profile');
        return;
    }

    try {
        // Always fetch fresh data from backend - don't rely on localStorage
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
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
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Authentication required. Please log in again.', 'error');
        window.location.href = 'https://apparels.impromptuindian.com/login.html';
        return;
    }
    
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
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Authentication required. Please log in again.', 'error');
        window.location.href = 'https://apparels.impromptuindian.com/login.html';
        return;
    }
    
    const fullAddress = document.getElementById('fldFullAddress').value;
    const city = document.getElementById('fldCity').value;
    const state = document.getElementById('fldState').value;
    const pincode = document.getElementById('fldPincode').value;

    const coords = window.currentCoords || { lat: null, lon: null };

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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

// Map Logic
let map = null;
let marker = null;

function initMapEvents() {
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    const confirmLocationBtn = document.getElementById('confirmLocationBtn');
    const mapModal = document.getElementById('mapModal');

    useCurrentLocationBtn.onclick = () => {
        mapModal.classList.remove('hidden');
        if (!navigator.geolocation) {
            showToast('Geolocation not supported', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setupMap(lat, lng);
        }, err => {
            // Fallback to Bangalore
            setupMap(12.9716, 77.5946);
        }, { enableHighAccuracy: true });
    };

    confirmLocationBtn.onclick = async () => {
        if (!marker) return;
        const pos = marker.getPosition();
        const lat = pos.lat || pos[0];
        const lng = pos.lng || pos[1];

        confirmLocationBtn.innerHTML = '<i class="w-4 h-4 animate-spin mr-2"></i> Resolving...';
        confirmLocationBtn.disabled = true;

        try {
            const res = await ImpromptuIndianApi.fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
            const data = await res.json();

            if (data && !data.error) {
                const addr = data.results && data.results[0] ? data.results[0] : data;

                // Mappls structure helper
                const getComp = (k) => addr[k] || '';

                const area = getComp('subLocality') || getComp('locality') || getComp('street') || '';
                const house = getComp('houseNumber') || getComp('house_number') || '';

                document.getElementById('fldFullAddress').value = `${house ? house + ', ' : ''}${area}`;
                document.getElementById('fldCity').value = getComp('city') || getComp('district') || '';
                document.getElementById('fldState').value = getComp('state') || '';
                document.getElementById('fldPincode').value = getComp('pincode') || '';

                document.getElementById('coordDisplay').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                window.currentCoords = { lat, lon: lng };

                mapModal.classList.add('hidden');
                showToast('Location pinned!');
            }
        } catch (e) {
            showToast('Reverse geocode failed', 'error');
        } finally {
            confirmLocationBtn.innerHTML = 'Confirm Location';
            confirmLocationBtn.disabled = false;
        }
    };

    // Search logic
    const mapSearchBtn = document.getElementById('mapSearchBtn');
    const mapSearchInput = document.getElementById('mapSearchInput');

    mapSearchBtn.onclick = () => {
        const query = mapSearchInput.value.trim();
        if (!query || !mappls) return;

        mappls.search({ query }, (data) => {
            if (data && data.length > 0) {
                const res = data[0];
                const lat = parseFloat(res.latitude || res.lat);
                const lng = parseFloat(res.longitude || res.lng);
                map.setCenter([lat, lng]);
                marker.setPosition({ lat, lng });
            }
        });
    };
}

function setupMap(lat, lng) {
    if (typeof mappls === 'undefined') return;

    if (!map) {
        map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 15 });
        marker = new mappls.Marker({ map, position: { lat, lng }, draggable: true });
    } else {
        map.setCenter([lat, lng]);
        marker.setPosition({ lat, lng });
    }

    // Force resize to handle modal animation timing
    setTimeout(() => {
        if (map && map.resize) map.resize();
    }, 300);

    setTimeout(() => {
        if (map && map.resize) map.resize();
    }, 800);
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
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Authentication required. Please log in again.', 'error');
        window.location.href = 'https://apparels.impromptuindian.com/login.html';
        return;
    }
    
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
    initMapEvents();

    // Reveal On Scroll
    const reveal = () => {
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add('show');
        });
    };
    window.addEventListener('scroll', reveal);
    setTimeout(reveal, 100);

    document.getElementById('saveLocationBtn').onclick = saveAddress; // Map to saveLocation
    // Re-linking since I used both names
    window.saveAddress = saveLocation;
    
    // Load Mappls configuration
    loadMapplsConfig();
    
    // Modal animation helper
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', () => {
            const modal = document.getElementById('mapModal');
            if (modal) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    const activeModal = modal.querySelector('.active-modal');
                    if (activeModal) {
                        activeModal.classList.add('show');
                    }
                }, 10);
            }
        });
    }
    
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
            const apiKey = config?.mappls?.apiKey || '';
            
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
