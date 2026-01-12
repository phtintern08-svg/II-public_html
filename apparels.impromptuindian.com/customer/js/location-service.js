// Location Service - Provides autocomplete for countries, states, cities, and pincodes
// Uses REST Countries API, India Post API, and MapmyIndia (Mappls)

// API keys are now handled in the backend

class LocationService {
    constructor() {
        this.countries = [];
        this.indianStates = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
            "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
            "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Andaman and Nicobar Islands", "Chandigarh",
            "Dadra and Nagar Haveli and Daman and Diu",
            "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
        ];
        this.cache = {
            cities: {},
            pincodes: {}
        };
    }

    // Load all countries
    async loadCountries() {
        if (this.countries.length > 0) return this.countries;

        try {
            const response = await fetch('https://restcountries.com/v3.1/all');
            const data = await response.json();
            this.countries = data
                .map(country => country.name.common)
                .sort((a, b) => a.localeCompare(b));
            return this.countries;
        } catch (error) {
            console.error('Error loading countries:', error);
            return ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
        }
    }

    // Get states (currently supports India)
    getStates(country) {
        if (country === 'India') return this.indianStates;
        return [];
    }

    // Get cities by state (India predefined mapping)
    async getCitiesByState(state) {
        const cacheKey = state;
        if (this.cache.cities[cacheKey]) {
            return this.cache.cities[cacheKey];
        }

        const indianCities = {
            "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kolhapur"],
            "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davangere"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode"],
            "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Karol Bagh"],
            "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Noida"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
            "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
            "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
            "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
            "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
            "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
            "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
            "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
            "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
            "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
            "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
            "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
            "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
            "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"]
        };

        const cities = indianCities[state] || [];
        this.cache.cities[cacheKey] = cities;
        return cities;
    }

    // Validate and get location info by pincode
    async getLocationByPincode(pincode) {
        if (!pincode || pincode.length !== 6) return null;

        const cacheKey = pincode;
        if (this.cache.pincodes[cacheKey]) {
            return this.cache.pincodes[cacheKey];
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
                const postOffice = data[0].PostOffice[0];
                const locationInfo = {
                    city: postOffice.District,
                    state: postOffice.State,
                    country: 'India'
                };
                this.cache.pincodes[cacheKey] = locationInfo;
                return locationInfo;
            }
        } catch (error) {
            console.error('Error fetching pincode data:', error);
        }
        return null;
    }

    // Get current location (GPS + MapmyIndia)
    async getCurrentLocation() {
        console.log("Getting location using GPS + MapmyIndia...");

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error("Geolocation not supported"));
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;

                    try {
                        const location = await this.reverseGeocodeMappls(latitude, longitude);
                        resolve(location);
                    } catch (err) {
                        console.error("Mappls reverse geocode failed:", err);
                        reject(err);
                    }
                },
                (err) => {
                    console.error("GPS error:", err);
                    reject(new Error("Location permission denied"));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // MapmyIndia Reverse Geocoding (via Backend Proxy)
    async reverseGeocodeMappls(lat, lon) {
        const url = `/api/reverse-geocode?lat=${lat}&lng=${lon}`;

        let response;
        if (window.ThreadlyApi) {
            response = await window.ThreadlyApi.fetch(url);
        } else {
            response = await fetch(url);
        }
        const data = await response.json();

        if (!data || !data.results || !data.results[0]) {
            throw new Error("Invalid Mappls response");
        }

        const addr = data.results[0];

        return {
            city: addr.city || addr.district || '',
            state: addr.state || '',
            country: addr.country || 'India',
            pincode: addr.pincode || '',
            area: addr.locality || addr.subLocality || addr.street || ''
        };
    }


    // Filter helper
    filterItems(items, query) {
        if (!query) return items;
        return items.filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );
    }
}


// ------------------------
// AUTOCOMPLETE DROPDOWN
// ------------------------

class AutocompleteDropdown {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = options;
        this.items = [];
        this.filteredItems = [];
        this.selectedIndex = -1;
        this.dropdown = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            margin-top: 0.25rem;
            background: #071019;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            max-height: 200px;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(2, 6, 23, 0.6);
            z-index: 1400;
            display: none;
        `;

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        this.input.parentNode.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);
        wrapper.appendChild(this.dropdown);

        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('blur', () => setTimeout(() => this.close(), 200));
    }

    async handleInput() {
        const query = this.input.value.trim();

        if (this.options.onInput) {
            this.items = await this.options.onInput(query);
        }

        this.filteredItems = this.items;
        this.render();
        this.open();
    }

    async handleFocus() {
        if (this.options.onFocus) {
            this.items = await this.options.onFocus();
            this.filteredItems = this.items;
            this.render();
            this.open();
        }
    }

    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.filteredItems[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.close();
                break;
        }
    }

    render() {
        this.dropdown.innerHTML = '';
        this.selectedIndex = -1;

        if (this.filteredItems.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'autocomplete-item';
            noResults.textContent = 'No results found';
            noResults.style.cssText = `
                padding: 0.65rem 0.9rem;
                color: #94a3b8;
                cursor: default;
            `;
            this.dropdown.appendChild(noResults);
            return;
        }

        this.filteredItems.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'autocomplete-item';
            itemEl.textContent = item;
            itemEl.style.cssText = `
                padding: 0.65rem 0.9rem;
                color: #e6eef8;
                cursor: pointer;
                transition: background 0.12s ease;
            `;

            itemEl.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });

            itemEl.addEventListener('click', () => {
                this.selectItem(item);
            });

            this.dropdown.appendChild(itemEl);
        });
    }

    updateSelection() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.style.background = 'rgba(255, 204, 0, 0.18)';
                item.style.color = '#071019';
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.style.background = '';
                item.style.color = '#e6eef8';
            }
        });
    }

    selectItem(item) {
        this.input.value = item;
        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
        this.close();
    }

    open() {
        this.dropdown.style.display = 'block';
        this.isOpen = true;
    }

    close() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
    }

    setItems(items) {
        this.items = items;
        this.filteredItems = items;
        this.render();
    }
}

// Export for use in other files
window.LocationService = LocationService;
window.AutocompleteDropdown = AutocompleteDropdown;
