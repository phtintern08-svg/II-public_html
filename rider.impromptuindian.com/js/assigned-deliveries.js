// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Check authentication (TEMPORARILY DISABLED FOR TESTING)
// const riderId = localStorage.getItem('rider_id');
// if (!riderId) {
//     window.location.href = '../login.html';
// }

// Global state
let currentFilter = 'all';
let currentDeliveryId = null;
let isOnline = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkOnlineStatus(); // Wait for status first
    loadDeliveries(); // Then load deliveries with correct online status
});

// Check online status
async function checkOnlineStatus() {
    try {
        const riderId = localStorage.getItem('user_id');
        if (!riderId) {
            console.warn('No rider ID found in localStorage');
            return;
        }

        const response = await ThreadlyApi.fetch(`/rider/profile?rider_id=${riderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            isOnline = data.is_online || false;
            console.log('Rider online status:', isOnline);
        } else {
            console.error('Failed to fetch rider profile:', response.status);
        }
    } catch (error) {
        console.error('Error checking online status:', error);
        // Assume online if check fails to not block rider
        isOnline = true;
    }
}

// Filter deliveries
function filterDeliveries(status) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    loadDeliveries();
}

// Load deliveries
async function loadDeliveries() {
    try {
        const riderId = localStorage.getItem('user_id');
        if (!riderId) {
            console.error('No rider ID found');
            showToast('Please log in again', 'error');
            return;
        }

        const response = await ThreadlyApi.fetch(`/rider/deliveries/assigned?rider_id=${riderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Sort by ID descending (newest first)
            const sortedDeliveries = (data.deliveries || []).sort((a, b) => b.id - a.id);
            displayDeliveries(sortedDeliveries);
        } else {
            const error = await response.json();
            console.error('Error loading deliveries:', error);
            showToast(error.error || 'Failed to load deliveries', 'error');
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
        showToast('Failed to load deliveries', 'error');
    }
}

// Display deliveries
function displayDeliveries(deliveries) {
    const container = document.getElementById('deliveries-container');

    // Filter deliveries based on current filter
    let filtered = deliveries;
    if (currentFilter !== 'all') {
        filtered = deliveries.filter(d => {
            switch (currentFilter) {
                case 'assigned':
                    // Pending Pickup includes both 'assigned' and 'reached_vendor'
                    return d.status === 'assigned' || d.status === 'reached_vendor';
                case 'picked_up':
                    return d.status === 'picked_up';
                case 'out_for_delivery':
                    return d.status === 'out_for_delivery';
                case 'delivered':
                    return d.status === 'delivered';
                default:
                    return true;
            }
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="info-card text-center py-12">
                <i data-lucide="inbox" class="w-16 h-16 mx-auto mb-4 text-muted"></i>
                <p class="text-lg text-muted">No deliveries found</p>
                <p class="text-sm text-muted mt-2">
                    ${currentFilter === 'all' ? 'You don\'t have any assigned deliveries yet.' :
                currentFilter === 'assigned' ? 'No pending pickups at the moment.' :
                    currentFilter === 'picked_up' ? 'No picked up orders waiting for delivery.' :
                        currentFilter === 'out_for_delivery' ? 'No orders currently out for delivery.' :
                            'No deliveries in this category.'}
                </p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map(delivery => `
        <div class="delivery-card ${delivery.is_urgent ? 'urgent' : ''}">
            <!-- Card Header -->
            <div class="delivery-header">
                <div>
                    <p class="delivery-id">Delivery #${delivery.id} | Order #${delivery.order_id}</p>
                    <h3 class="delivery-title">
                        ${delivery.product_details?.type || 'Product'}
                        <span class="delivery-quantity">${delivery.product_details?.quantity || 0} pieces</span>
                    </h3>
                </div>
                <span class="delivery-status ${delivery.status.replace(/_/g, '-')}">
                    <span class="status-dot"></span>
                    ${formatStatus(delivery.status)}
                </span>
            </div>
            
            ${delivery.is_urgent ? '<div class="urgent-badge">⚡ URGENT DELIVERY - Priority Handling Required</div>' : ''}
            
            <!-- Location Grid -->
            <div class="location-grid">
                <div class="location-card">
                    <p class="location-label">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                        Pickup Location
                    </p>
                    <p class="location-address">${delivery.pickup?.address || 'Address not available'}</p>
                    <p class="location-contact">
                        <i data-lucide="phone" class="w-3 h-3"></i>
                        ${delivery.pickup?.contact || 'N/A'}
                    </p>
                </div>
                <div class="location-card">
                    <p class="location-label">
                        <i data-lucide="home" class="w-4 h-4"></i>
                        Delivery Destination
                    </p>
                    <p class="location-address">${delivery.delivery?.address || 'Address not available'}</p>
                    <p class="location-contact">
                        <i data-lucide="phone" class="w-3 h-3"></i>
                        ${delivery.delivery?.contact || 'N/A'}
                    </p>
                </div>
            </div>
            
            <!-- Timeline -->
            <div class="delivery-timeline">
                <div class="timeline-step ${delivery.status !== 'assigned' ? 'completed' : 'active'}">
                    <div class="timeline-dot ${delivery.status !== 'assigned' ? 'completed' : 'active'}"></div>
                    <span class="timeline-label">Assigned</span>
                </div>
                <div class="timeline-step ${['reached_vendor', 'picked_up', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}">
                    <div class="timeline-dot ${['reached_vendor', 'picked_up', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}"></div>
                    <span class="timeline-label">Reached</span>
                </div>
                <div class="timeline-step ${['picked_up', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}">
                    <div class="timeline-dot ${['picked_up', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}"></div>
                    <span class="timeline-label">Picked Up</span>
                </div>
                <div class="timeline-step ${['out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}">
                    <div class="timeline-dot ${['out_for_delivery', 'delivered'].includes(delivery.status) ? 'completed' : ''}"></div>
                    <span class="timeline-label">En Route</span>
                </div>
                <div class="timeline-step ${delivery.status === 'delivered' ? 'completed' : ''}">
                    <div class="timeline-dot ${delivery.status === 'delivered' ? 'completed' : ''}"></div>
                    <span class="timeline-label">Delivered</span>
                </div>
            </div>
            
            <!-- Deadline Info -->
            <div class="deadline-info">
                <div class="deadline-icon">
                    <i data-lucide="clock" class="w-5 h-5"></i>
                </div>
                <div class="deadline-text">
                    <span>Delivery Deadline:</span>
                    <span class="deadline-time">${formatDateTime(delivery.deadline)}</span>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
                ${getActionButtons(delivery)}
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

// Get action buttons based on status
function getActionButtons(delivery) {
    console.log('Generating buttons for delivery', delivery.id, 'Online status:', isOnline, 'Delivery status:', delivery.status);

    let buttons = `
        <button onclick="viewDeliveryDetails(${delivery.id})" class="action-btn action-btn-primary">
            <i data-lucide="eye" class="w-4 h-4"></i>
            View Details
        </button>
    `;

    // If offline and not delivered, show warning but still show other buttons
    if (!isOnline && delivery.status !== 'delivered') {
        buttons = `
            <div class="col-span-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                <p class="text-sm text-red-400 flex items-center gap-2">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                    You are currently offline. Please go online on the dashboard to update delivery status.
                </p>
            </div>
        ` + buttons;
    }

    switch (delivery.status) {
        case 'assigned':
            buttons += `
                <button onclick="initiateCall('${delivery.pickup?.contact}')" class="action-btn action-btn-secondary">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                    Call Vendor
                </button>
                <button onclick="navigateToPickup(${delivery.id})" class="action-btn action-btn-warning">
                    <i data-lucide="navigation" class="w-4 h-4"></i>
                    Navigate to Pickup
                </button>
                <button onclick="markReachedVendor(${delivery.id})" class="action-btn action-btn-success">
                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                    Mark Reached Vendor
                </button>
            `;
            break;
        case 'reached_vendor':
            buttons += `
                 <button onclick="initiateCall('${delivery.pickup?.contact}')" class="action-btn action-btn-secondary">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                    Call Vendor
                </button>
                <button onclick="openPickupProofModal(${delivery.id})" class="action-btn action-btn-success">
                    <i data-lucide="upload" class="w-4 h-4"></i>
                    Upload Pickup Proof
                </button>
            `;
            break;
        case 'picked_up':
            buttons += `
                <button onclick="initiateCall('${delivery.delivery?.contact}')" class="action-btn action-btn-secondary">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                    Call Customer
                </button>
                <button onclick="startDelivery(${delivery.id})" class="action-btn action-btn-success">
                    <i data-lucide="truck" class="w-4 h-4"></i>
                    Start Delivery
                </button>
                <button onclick="navigateToCustomer(${delivery.id})" class="action-btn action-btn-warning">
                    <i data-lucide="navigation" class="w-4 h-4"></i>
                    Navigate to Customer
                </button>
            `;
            break;
        case 'out_for_delivery':
            buttons += `
                <button onclick="initiateCall('${delivery.delivery?.contact}')" class="action-btn action-btn-secondary">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                    Call Customer
                </button>
                <button onclick="openDeliveryProofModal(${delivery.id})" class="action-btn action-btn-success">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    Complete Delivery
                </button>
                <button onclick="navigateToCustomer(${delivery.id})" class="action-btn action-btn-warning">
                    <i data-lucide="navigation" class="w-4 h-4"></i>
                    Navigate
                </button>
            `;
            break;
    }

    return buttons;
}

// Mark reached vendor (Simple version, likely overridden later)
async function markReachedVendor(deliveryId) {
    if (!isOnline) {
        showToast('You are currently offline', 'error');
        return;
    }

    if (!await getLiveLocation()) {
        if (!confirm('Could not get GPS location. Proceed anyway?')) return;
    }

    /* 
       Ideally, we'd send lat/long here too.
       For now, just update status.
    */
    try {
        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'reached_vendor',
                latitude: currentLat, // global vars from getLiveLocation()
                longitude: currentLon
            })
        });

        if (response.ok) {
            showToast('Marked as Reached Vendor', 'success');
            loadDeliveries();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Initiate Phone Call
function initiateCall(phoneNumber) {
    if (!phoneNumber || phoneNumber === 'undefined' || phoneNumber === 'null') {
        showToast('Contact number not available', 'error');
        return;
    }

    // Remove masking if present (simple check if it contains 'X')
    if (phoneNumber.includes('X') || phoneNumber.includes('x')) {
        // Here we might want to fetch the unmasked number if we don't have it.
        // But assuming the variable passed is the raw one. 
        // If the variable itself is masked, we can't call.
        // For now, let's assume valid number.
        console.warn("Phone number appears masked:", phoneNumber);
    }

    window.location.href = `tel:${phoneNumber}`;
}

// Open pickup proof modal
function openPickupProofModal(deliveryId) {
    currentDeliveryId = deliveryId;
    document.getElementById('pickupProofModal').classList.remove('hidden');
    document.getElementById('pickupProofForm').reset();
    resetCameraUI('pickup');
}

function closePickupProofModal() {
    stopCamera('pickup');
    document.getElementById('pickupProofModal').classList.add('hidden');
    currentDeliveryId = null;
}

// Upload pickup proof
async function uploadPickupProof(event) {
    event.preventDefault();

    if (!isOnline) {
        showToast('You are currently offline. Please go online to continue.', 'error');
        return;
    }

    // Optional Check: Just warn if no photo, but allow
    if (!capturedBlobs['pickup']) {
        // showToast('No photo captured, proceeding without proof...', 'info');
    }

    const formData = new FormData();
    if (capturedBlobs['pickup']) {
        formData.append('proof_image', capturedBlobs['pickup'], 'pickup_proof.jpg');
    }
    formData.append('notes', document.getElementById('pickupNotes').value);

    try {
        const response = await ThreadlyApi.fetch(`/rider/delivery/${currentDeliveryId}/pickup-proof`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            },
            body: formData
        });

        if (response.ok) {
            showToast('Pickup marked successfully', 'success');
            closePickupProofModal();
            loadDeliveries();
        } else {
            showToast('Failed to upload proof', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Open delivery proof modal
function openDeliveryProofModal(deliveryId) {
    currentDeliveryId = deliveryId;
    document.getElementById('deliveryProofModal').classList.remove('hidden');
    document.getElementById('deliveryProofForm').reset();
    resetCameraUI('delivery');
}

function closeDeliveryProofModal() {
    stopCamera('delivery');
    document.getElementById('deliveryProofModal').classList.add('hidden');
    currentDeliveryId = null;
}

// Upload delivery proof
async function uploadDeliveryProof(event) {
    event.preventDefault();

    if (!isOnline) {
        showToast('You are currently offline. Please go online to continue.', 'error');
        return;
    }

    // Optional Check
    if (!capturedBlobs['delivery']) {
        // showToast('No photo captured, proceeding without proof...', 'info');
    }

    const formData = new FormData();
    if (capturedBlobs['delivery']) {
        formData.append('proof_image', capturedBlobs['delivery'], 'delivery_proof.jpg');
    }
    formData.append('otp', document.getElementById('deliveryOtp').value);
    formData.append('notes', document.getElementById('deliveryNotes').value);

    try {
        const response = await ThreadlyApi.fetch(`/rider/delivery/${currentDeliveryId}/delivery-proof`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            showToast(`Delivery completed! Earned: ₹${data.earnings?.total || 0}`, 'success');
            closeDeliveryProofModal();

            // Stop location tracking
            const trackingInterval = localStorage.getItem(`tracking_${currentDeliveryId}`);
            if (trackingInterval) {
                clearInterval(parseInt(trackingInterval));
                localStorage.removeItem(`tracking_${currentDeliveryId}`);
            }

            loadDeliveries();
        } else {
            showToast('Failed to complete delivery', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Camera Handling
let activeStreams = {
    pickup: null,
    delivery: null
};

let capturedBlobs = {
    pickup: null,
    delivery: null
};

async function startCamera(type) {
    try {
        const video = document.getElementById(`${type}Video`);
        const placeholder = document.getElementById(`${type}CameraPlaceholder`);
        const cameraView = document.getElementById(`${type}Camera`);

        // Hide placeholder, show video
        if (placeholder) placeholder.classList.add('hidden');
        if (cameraView) cameraView.classList.remove('hidden');

        // Update buttons
        // Check elements existence before accessing classList
        const btnStart = document.getElementById(`btnStart${capitalize(type)}Cam`);
        const btnCapture = document.getElementById(`btnCapture${capitalize(type)}`);

        if (btnStart) btnStart.classList.add('hidden');
        if (btnCapture) btnCapture.classList.remove('hidden');

        let stream;
        try {
            // First try to get the environment (rear) camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
        } catch (e) {
            console.warn("Environment camera not found, trying default user camera", e);
            // Fallback to any available video source (good for PC/Laptops)
            stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
        }

        video.srcObject = stream;
        activeStreams[type] = stream;

    } catch (err) {
        console.error("Camera error:", err);
        showToast("Could not access camera. Please check permissions and device.", "error");

        // Reset UI if camera fails
        resetCameraUI(type);
    }
}

function capturePhoto(type) {
    const video = document.getElementById(`${type}Video`);
    const canvas = document.getElementById(`${type}Canvas`);
    const preview = document.getElementById(`${type}Preview`);
    const cameraView = document.getElementById(`${type}Camera`);
    const previewContainer = document.getElementById(`${type}PreviewContainer`);

    if (!video || !canvas) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop video stream
    stopCamera(type);

    // Convert to blob and show preview
    canvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to captured photo blob");
            showToast("Failed to capture image. Please try again.", "error");
            resetCameraUI(type);
            return;
        }

        capturedBlobs[type] = blob;
        try {
            preview.src = URL.createObjectURL(blob);
        } catch (e) {
            console.error("URL creation failed:", e);
        }

        // UI Updates
        if (cameraView) cameraView.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');

        const btnCapture = document.getElementById(`btnCapture${capitalize(type)}`);
        const btnRetake = document.getElementById(`btnRetake${capitalize(type)}`);

        if (btnCapture) btnCapture.classList.add('hidden');
        if (btnRetake) btnRetake.classList.remove('hidden');
    }, 'image/jpeg', 0.8);
}

function retakePhoto(type) {
    // UI Updates
    const previewContainer = document.getElementById(`${type}PreviewContainer`);
    const btnRetake = document.getElementById(`btnRetake${capitalize(type)}`);

    if (previewContainer) previewContainer.classList.add('hidden');
    if (btnRetake) btnRetake.classList.add('hidden');

    // Clear captured data
    capturedBlobs[type] = null;

    // Restart camera
    startCamera(type);
}

function stopCamera(type) {
    if (activeStreams[type]) {
        activeStreams[type].getTracks().forEach(track => track.stop());
        activeStreams[type] = null;
    }
}

function resetCameraUI(type) {
    // Stop any active stream
    stopCamera(type);

    // Clear data
    capturedBlobs[type] = null;

    // Reset UI elements
    const placeholder = document.getElementById(`${type}CameraPlaceholder`);
    const cameraView = document.getElementById(`${type}Camera`);
    const previewContainer = document.getElementById(`${type}PreviewContainer`);

    if (placeholder) placeholder.classList.remove('hidden');
    if (cameraView) cameraView.classList.add('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');

    // Reset Buttons
    const btnStart = document.getElementById(`btnStart${capitalize(type)}Cam`);
    const btnCapture = document.getElementById(`btnCapture${capitalize(type)}`);
    const btnRetake = document.getElementById(`btnRetake${capitalize(type)}`);

    if (btnStart) btnStart.classList.remove('hidden');
    if (btnCapture) btnCapture.classList.add('hidden');
    if (btnRetake) btnRetake.classList.add('hidden');
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Start delivery
async function startDelivery(deliveryId) {
    if (!isOnline) {
        showToast('You are currently offline. Please go online to continue.', 'error');
        return;
    }

    try {
        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            },
            body: JSON.stringify({ status: 'out_for_delivery' })
        });

        if (response.ok) {
            showToast('Delivery started. Live tracking active.', 'success');
            startLocationTracking(deliveryId);
            loadDeliveries();
        } else {
            showToast('Failed to start delivery', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Mark reached vendor (GPS version)
async function markReachedVendor(deliveryId) {
    if (!isOnline) {
        showToast('You are currently offline. Please go online to continue.', 'error');
        return;
    }

    try {
        let latitude = null;
        let longitude = null;

        // Try to get current location, but don't fail if unavailable
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        } catch (geoError) {
            console.warn('Could not get GPS location:', geoError);
            if (geoError.code === 1) {
                showToast('Location permission denied - proceeding without GPS', 'warning');
            } else if (geoError.code === 3) {
                showToast('GPS timeout - proceeding without location', 'warning');
            } else {
                showToast('GPS unavailable - proceeding without location', 'warning');
            }
        }

        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            },
            body: JSON.stringify({
                status: 'reached_vendor',
                latitude: latitude,
                longitude: longitude
            })
        });

        if (response.ok) {
            showToast('Marked as reached vendor', 'success');
            stopLocationTracking(deliveryId);
            loadDeliveries();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update delivery status', 'error');
    }
}

// Navigate functions
async function navigateToPickup(deliveryId) {
    try {
        showToast('Fetching delivery route...', 'info');

        // 1. Fetch delivery details from backend to get addresses
        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/details`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch delivery details');
        }

        const delivery = await response.json();

        // Validate addresses
        if (!delivery.pickup || !delivery.pickup.address) {
            throw new Error('Vendor pickup address not available');
        }

        const vendorAddress = delivery.pickup.address;

        // 2. Get rider's current location (for tracking only)
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            // Start location tracking
            startLocationTracking(deliveryId);
        } catch (geoError) {
            console.warn('GPS tracking unavailable:', geoError);
            showToast('GPS tracking disabled - navigation will still work', 'warning');
        }

        // 3. Try to open MapmyIndia app, fallback to Mappls Web
        const encodedAddress = encodeURIComponent(vendorAddress);

        // Create iframe to trigger app (doesn't load web page)
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `mappls://search?query=${encodedAddress}`;
        document.body.appendChild(iframe);

        // After 2 seconds, open Mappls Web as fallback
        setTimeout(() => {
            document.body.removeChild(iframe);
            window.open(`https://mappls.com/search/${encodedAddress}`, '_blank');
        }, 2000);

        showToast('Opening navigation app...', 'success');

    } catch (error) {
        console.error('Navigation error:', error);

        if (error.message) {
            showToast(error.message, 'error');
        } else {
            showToast('Failed to start navigation', 'error');
        }
    }
}

function navigateToCustomer(deliveryId) {
    const container = document.getElementById('deliveries-container');
    const cards = container.querySelectorAll('.delivery-card');

    let delivery = null;
    cards.forEach(card => {
        if (card.textContent.includes(`Delivery #${deliveryId}`)) {
            const deliveryAddress = card.querySelectorAll('.location-card .location-address')[1];
            if (deliveryAddress) {
                delivery = { address: deliveryAddress.textContent };
            }
        }
    });

    if (delivery && delivery.address) {
        const encodedAddress = encodeURIComponent(delivery.address);
        // Use search endpoint which is more robust than direction without origin
        const mapUrl = `https://mappls.com/search/${encodedAddress}`;
        window.open(mapUrl, '_blank');
        showToast('Opening MapmyIndia...', 'info');
    } else {
        showToast('Customer address not available', 'error');
    }
}

// View delivery details
async function viewDeliveryDetails(deliveryId) {
    try {
        const riderId = localStorage.getItem('user_id');
        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/details?rider_id=${riderId}`);

        if (response.ok) {
            const delivery = await response.json();
            showDeliveryModal(delivery);
        } else {
            showToast('Failed to load delivery details', 'error');
        }
    } catch (error) {
        console.error('Error loading delivery details:', error);
        showToast('Network error', 'error');
    }
}

function showDeliveryModal(delivery) {
    const modal = document.getElementById('deliveryModal');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
    <div class="space-y-6">
        <!-- Order Info -->
        <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
            <h3 class="text-lg font-bold text-blue-400 mb-2">Order Information</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div><span class="text-gray-400">Order ID:</span> <span class="font-semibold">#${delivery.order_id}</span></div>
                <div><span class="text-gray-400">Delivery ID:</span> <span class="font-semibold">#${delivery.id}</span></div>
                <div><span class="text-gray-400">Product:</span> <span class="font-semibold">${delivery.product_details?.type || 'N/A'}</span></div>
                <div><span class="text-gray-400">Quantity:</span> <span class="font-semibold">${delivery.product_details?.quantity || 0} pieces</span></div>
                <div><span class="text-gray-400">Status:</span> <span class="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">${formatStatus(delivery.status)}</span></div>
                <div><span class="text-gray-400">Priority:</span> ${delivery.is_urgent ? '<span class="text-red-500 font-bold">⚡ URGENT</span>' : '<span class="text-gray-400">Normal</span>'}</div>
            </div>
        </div>

        <!-- Pickup Details -->
        <div class="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
            <h3 class="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                <i data-lucide="package" class="w-5 h-5"></i>
                Pickup Details
            </h3>
            <div class="space-y-2 text-sm">
                <div><span class="text-gray-400">Address:</span> <p class="font-semibold mt-1">${delivery.pickup?.address || 'N/A'}</p></div>
                <div><span class="text-gray-400">Contact:</span> <span class="font-semibold font-mono">${delivery.pickup?.contact || 'N/A'}</span></div>
            </div>
        </div>

        <!-- Delivery Details -->
        <div class="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
            <h3 class="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                <i data-lucide="home" class="w-5 h-5"></i>
                Delivery Details
            </h3>
            <div class="space-y-2 text-sm">
                <div><span class="text-gray-400">Address:</span> <p class="font-semibold mt-1">${delivery.delivery?.address || 'N/A'}</p></div>
                <div><span class="text-gray-400">Contact:</span> <span class="font-semibold font-mono">${delivery.delivery?.contact || 'N/A'}</span></div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="bg-black/30 border border-white/10 rounded-xl p-4">
            <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
                <i data-lucide="clock" class="w-5 h-5"></i>
                Timeline
            </h3>
            <div class="space-y-2 text-sm">
                ${delivery.assigned_at ? `<div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-green-500"></i> Assigned: ${formatDateTime(delivery.assigned_at)}</div>` : ''}
                ${delivery.reached_vendor_at ? `<div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-green-500"></i> Reached Vendor: ${formatDateTime(delivery.reached_vendor_at)}</div>` : ''}
                ${delivery.picked_up_at ? `<div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-green-500"></i> Picked Up: ${formatDateTime(delivery.picked_up_at)}</div>` : ''}
                ${delivery.out_for_delivery_at ? `<div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-green-500"></i> Out for Delivery: ${formatDateTime(delivery.out_for_delivery_at)}</div>` : ''}
                ${delivery.delivered_at ? `<div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-green-500"></i> Delivered: ${formatDateTime(delivery.delivered_at)}</div>` : ''}
            </div>
        </div>

        <!-- Notes -->
        ${delivery.pickup_notes || delivery.delivery_notes ? `
        <div class="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <h3 class="text-lg font-bold text-purple-400 mb-2">Notes</h3>
            ${delivery.pickup_notes ? `<p class="text-sm mb-2"><span class="text-gray-400">Pickup:</span> ${delivery.pickup_notes}</p>` : ''}
            ${delivery.delivery_notes ? `<p class="text-sm"><span class="text-gray-400">Delivery:</span> ${delivery.delivery_notes}</p>` : ''}
        </div>
        ` : ''}
    </div>
`;

    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('deliveryModal').classList.add('hidden');
}

// Real-time Location Tracking System
let locationTrackingIntervals = {};

function startLocationTracking(deliveryId) {
    // Clear any existing tracking for this delivery
    stopLocationTracking(deliveryId);

    console.log(`Starting location tracking for delivery ${deliveryId}`);

    // Send location update immediately
    sendLocationUpdate(deliveryId);

    // Then send updates every 15 seconds
    locationTrackingIntervals[deliveryId] = setInterval(() => {
        sendLocationUpdate(deliveryId);
    }, 15000); // Every 15 seconds

    showToast('Live tracking activated', 'info');
}

function stopLocationTracking(deliveryId) {
    if (locationTrackingIntervals[deliveryId]) {
        clearInterval(locationTrackingIntervals[deliveryId]);
        delete locationTrackingIntervals[deliveryId];
        console.log(`Stopped location tracking for delivery ${deliveryId}`);
    }
}

async function sendLocationUpdate(deliveryId) {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const response = await ThreadlyApi.fetch(`/rider/delivery/${deliveryId}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('rider_token')}`
            },
            body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })
        });

        if (response.ok) {
            console.log(`Location updated for delivery ${deliveryId}:`, position.coords.latitude, position.coords.longitude);
        } else {
            console.warn(`Failed to update location for delivery ${deliveryId}`);
        }
    } catch (error) {
        console.error('Location update error:', error);
    }
}

// Auto-start tracking for assigned deliveries when page loads
function autoStartTracking() {
    const container = document.getElementById('deliveries-container');
    const cards = container.querySelectorAll('.delivery-card');

    cards.forEach(card => {
        const statusElement = card.querySelector('.delivery-status.assigned');
        if (statusElement) {
            // Extract delivery ID from the card
            const idText = card.querySelector('.delivery-id').textContent;
            const match = idText.match(/Delivery #(\d+)/);
            if (match) {
                const deliveryId = parseInt(match[1]);
                startLocationTracking(deliveryId);
            }
        }
    });
}

// Helper functions
function formatStatus(status) {
    return status.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function maskPhone(phone) {
    if (!phone) return 'N/A';
    return phone.substring(0, 2) + 'XXXX' + phone.substring(phone.length - 4);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
            type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
        } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
