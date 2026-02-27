/**
 * Rider Location Tracker - Dynamic GPS updates for riders table (latitude/longitude)
 * Uses watchPosition for real-time tracking when rider is online.
 * Updates ImpromptuIndian riders table via /api/rider/presence
 * Production-ready for cPanel deployment
 */
(function () {
    'use strict';

    const THROTTLE_MS = 15000;  // Max 1 API update per 15 seconds (balance: real-time vs server load)
    const ONLINE_CHECK_MS = 5000;  // Check localStorage every 5s to stop when rider goes offline

    let watchId = null;
    let lastUpdateTime = 0;
    let lastLat = null;
    let lastLon = null;
    let onlineCheckInterval = null;

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
                console.log('[RiderLocation] Updated:', lat.toFixed(6), lon.toFixed(6));
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
        const moved = lastLat != null && (Math.abs(lat - lastLat) > 0.0001 || Math.abs(lon - lastLon) > 0.0001);

        if (elapsed >= THROTTLE_MS || (lastLat == null && lastLon == null)) {
            lastUpdateTime = now;
            lastLat = lat;
            lastLon = lon;
            sendLocationToServer(lat, lon);
        } else if (moved && elapsed >= 5000) {
            lastUpdateTime = now;
            lastLat = lat;
            lastLon = lon;
            sendLocationToServer(lat, lon);
        }
    }

    function onPositionError(err) {
        console.warn('[RiderLocation] Geolocation error:', err.code, err.message);
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
                    lastUpdateTime = Date.now();
                    sendLocationToServer(lastLat, lastLon);
                }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
        );
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

    window.RiderLocation = {
        start,
        stop,
        isOnline
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isOnline()) start();
        });
    } else if (isOnline()) {
        start();
    }
})();
