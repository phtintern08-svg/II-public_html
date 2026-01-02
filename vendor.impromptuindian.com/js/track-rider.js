// Track Rider - Real-time Location Tracking for Vendors
let map;
let riderMarker;
let vendorMarker;
let pathPolyline;
let updateInterval;
let deliveryId;
let orderId;

document.addEventListener('DOMContentLoaded', async () => {
    // Get delivery ID from URL
    const params = new URLSearchParams(window.location.search);
    deliveryId = params.get('delivery_id');
    orderId = params.get('order_id');

    if (!deliveryId) {
        showToast('No delivery specified', 'error');
        window.history.back();
        return;
    }

    // Initialize
    lucide.createIcons();
    await loadDeliveryInfo();
    initMap();
    startTracking();
});

async function loadDeliveryInfo() {
    try {
        const response = await ThreadlyApi.fetch(`/vendor/track-delivery/${deliveryId}`);

        if (response.ok) {
            const data = await response.json();

            // Update UI
            document.getElementById('orderTitle').textContent = `Order #${data.order_id}`;
            document.getElementById('orderProduct').textContent = `${data.product?.type} - ${data.product?.quantity} pieces`;
            document.getElementById('riderName').textContent = data.rider?.name || 'Unknown';
            document.getElementById('riderVehicle').textContent = data.rider?.vehicle_type || 'N/A';

            // Update status
            updateStatus(data.status);

            // Store vendor location
            window.vendorLocation = {
                lat: data.vendor_location?.latitude,
                lon: data.vendor_location?.longitude
            };

            // Store rider location
            if (data.rider_location) {
                window.riderLocation = {
                    lat: data.rider_location.latitude,
                    lon: data.rider_location.longitude
                };
            }
        }
    } catch (error) {
        console.error('Error loading delivery info:', error);
        showToast('Failed to load delivery information', 'error');
    }
}

function updateStatus(status) {
    const badge = document.getElementById('statusBadge');

    if (status === 'assigned') {
        badge.className = 'inline-block px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm';
        badge.textContent = '🚴 Rider Assigned';
    } else if (status === 'reached_vendor') {
        badge.className = 'inline-block px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-bold text-sm';
        badge.textContent = '✅ Rider at Pickup Location';
        stopTracking(); // Stop tracking once reached
    } else if (status === 'picked_up') {
        badge.className = 'inline-block px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm';
        badge.textContent = '📦 Order Picked Up - En Route to Customer';
        stopTracking();
    }
}

function initMap() {
    // Initialize MapmyIndia Map
    if (typeof MapmyIndia === 'undefined') {
        console.error('MapmyIndia SDK not loaded');
        return;
    }

    const vendorLat = window.vendorLocation?.lat || 12.9716;
    const vendorLon = window.vendorLocation?.lon || 77.5946;

    map = new MapmyIndia.Map('map', {
        center: [vendorLat, vendorLon],
        zoom: 14,
        zoomControl: true,
        hybrid: false
    });

    // Add vendor marker (pickup location)
    vendorMarker = new MapmyIndia.marker({
        map: map,
        position: [vendorLat, vendorLon],
        icon: 'https://apis.mapmyindia.com/map_v3/1.png',
        title: 'Pickup Location (Your Shop)',
        fitbounds: true
    });

    // If rider location available, add marker
    if (window.riderLocation) {
        addRiderMarker(window.riderLocation.lat, window.riderLocation.lon);
    }
}

function addRiderMarker(lat, lon) {
    if (riderMarker) {
        riderMarker.remove();
    }

    riderMarker = new MapmyIndia.marker({
        map: map,
        position: [lat, lon],
        icon: 'https://apis.mapmyindia.com/map_v3/2.png',
        title: 'Rider Current Location',
        draggable: false
    });

    // Update path
    if (vendorMarker && window.vendorLocation) {
        if (pathPolyline) {
            pathPolyline.remove();
        }

        pathPolyline = new MapmyIndia.Polyline({
            map: map,
            paths: [
                [lat, lon],
                [window.vendorLocation.lat, window.vendorLocation.lon]
            ],
            strokeColor: '#FFCC00',
            strokeWeight: 4,
            strokeOpacity: 0.8
        });
    }

    // Calculate ETA
    calculateETA(lat, lon, window.vendorLocation.lat, window.vendorLocation.lon);
}

function calculateETA(lat1, lon1, lat2, lon2) {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Assume average speed of 20 km/h for bikes in city traffic
    const speed = 20;
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    document.getElementById('eta').textContent = `~${timeInMinutes} min (${distance.toFixed(1)} km)`;
}

function startTracking() {
    console.log('Starting real-time tracking...');

    // Update every 10 seconds
    updateInterval = setInterval(async () => {
        await updateRiderLocation();
    }, 10000);

    // Initial update
    updateRiderLocation();
}

function stopTracking() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        console.log('Stopped tracking');
    }
}

async function updateRiderLocation() {
    try {
        const response = await ThreadlyApi.fetch(`/vendor/track-delivery/${deliveryId}`);

        if (response.ok) {
            const data = await response.json();

            // Update last update time
            document.getElementById('lastUpdate').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

            // Update status
            updateStatus(data.status);

            // If rider location updated, update marker
            if (data.rider_location && data.rider_location.latitude) {
                addRiderMarker(data.rider_location.latitude, data.rider_location.longitude);

                // Center map on rider
                map.setCenter([data.rider_location.latitude, data.rider_location.longitude]);
            }
        }
    } catch (error) {
        console.error('Error updating rider location:', error);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
                type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
        } text-white font-semibold`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopTracking();
});
