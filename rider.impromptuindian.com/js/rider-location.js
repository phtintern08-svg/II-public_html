/**
 * Rider Location Tracker - Dynamic GPS updates for riders table (latitude/longitude)
 * Uses watchPosition for real-time tracking when rider is online.
 * Updates ImpromptuIndian riders table via /api/rider/presence
 * Production-ready for cPanel deployment
 */
(function () {
    'use strict';

    const THROTTLE_MS = 5000;  // Guaranteed DB sync every 5 sec (Swiggy-style live tracking)
    const FALLBACK_INTERVAL_MS = 5000;  // Heartbeat every 5s even if stationary
    const ONLINE_CHECK_MS = 5000;  // Check localStorage every 5s to stop when rider goes offline

    let watchId = null;
    let lastUpdateTime = 0;
    let lastLat = null;
    let lastLon = null;
    let onlineCheckInterval = null;
    let fallbackInterval = null;

    function isOnline() {
        return localStorage.getItem('rider_is_online') === 'true';
    }

    function sendLocationToServer(lat, lon) {
        if (!window.ImpromptuIndianApi || typeof window.ImpromptuIndianApi.fetch !== 'function') {
            return Promise.resolve();
        }
        return window.ImpromptuIndianApi.fetch('/api/rider/presence', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ latitude: lat, longitude: lon })
        }).then(res => {
            if (res.ok) {
                lastUpdateTime = Date.now();
                console.log('[RiderLocation] Updated DB:', lat.toFixed(6), lon.toFixed(6));
            }
            return res;
        }).catch(err => {
            console.warn('[RiderLocation] Update failed:', err);
        });
    }

    function onPositionUpdate(position) {
        if (!position || !position.coords) return;
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (!isOnline()) return;

        const now = Date.now();
        const elapsed = now - lastUpdateTime;
        const isFirstFix = lastLat == null && lastLon == null;
        const moved = lastLat != null && (Math.abs(lat - lastLat) > 0.00002 || Math.abs(lon - lastLon) > 0.00002);

        if (isFirstFix || elapsed >= 5000) {
            lastLat = lat;
            lastLon = lon;
            sendLocationToServer(lat, lon);
        }
    }

    function onPositionError(err) {
        console.warn('[RiderLocation] Geolocation error:', err.code, err.message);
    }

    function fallbackSend() {
        if (!isOnline()) return;
        if (lastLat != null && lastLon != null) {
            const elapsed = Date.now() - lastUpdateTime;
            if (elapsed >= FALLBACK_INTERVAL_MS) {
                sendLocationToServer(lastLat, lastLon);
            }
        }
    }

    function startWatching() {
        if (!navigator.geolocation) {
            console.warn('[RiderLocation] Geolocation not supported');
            return;
        }
        if (watchId != null) return;

        watchId = navigator.geolocation.watchPosition(
            onPositionUpdate,
            onPositionError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
        console.log('[RiderLocation] Started watching position');

        navigator.geolocation.getCurrentPosition(
            pos => {
                if (isOnline() && pos && pos.coords) {
                    lastLat = pos.coords.latitude;
                    lastLon = pos.coords.longitude;
                    lastUpdateTime = 0;
                    sendLocationToServer(lastLat, lastLon);
                }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
        );

        if (!fallbackInterval) {
            fallbackInterval = setInterval(fallbackSend, FALLBACK_INTERVAL_MS);
        }
    }

    function stopWatching() {
        if (watchId != null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            lastLat = null;
            lastLon = null;
            console.log('[RiderLocation] Stopped watching position');
        }
        if (onlineCheckInterval) {
            clearInterval(onlineCheckInterval);
            onlineCheckInterval = null;
        }
        if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
        }
    }

    function checkOnlineStatus() {
        if (!isOnline()) {
            stopWatching();
        }
    }

    function start() {
        if (!isOnline()) return;
        startWatching();
        if (!onlineCheckInterval) {
            onlineCheckInterval = setInterval(checkOnlineStatus, ONLINE_CHECK_MS);
        }
    }

    function stop() {
        stopWatching();
    }

    async function syncOnlineFromBackendAndStart() {
        const api = window.ImpromptuIndianApi;
        if (!api || typeof api.fetch !== 'function') return;
        try {
            const res = await api.fetch('/api/rider/presence', {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.is_online) {
                    localStorage.setItem('rider_is_online', 'true');
                    start();
                } else {
                    localStorage.setItem('rider_is_online', 'false');
                }
            }
        } catch (e) {
            if (isOnline()) start();
        }
    }

    function init() {
        if (isOnline()) {
            start();
            return;
        }
        syncOnlineFromBackendAndStart();
    }

    window.RiderLocation = {
        start,
        stop,
        isOnline
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
