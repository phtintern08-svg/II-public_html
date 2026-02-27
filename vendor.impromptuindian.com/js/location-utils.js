/**
 * Location Utils - Multi-layer location strategy (Swiggy/Amazon style)
 * Vendor: Set ONCE using map. GPS used for initial pin.
 */
(function () {
    'use strict';
    const ACCURACY_THRESHOLD_M = 50;
    const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    function isValidLocation(position) {
        if (!position || !position.coords) return false;
        const acc = position.coords.accuracy;
        return typeof acc === 'number' && acc <= ACCURACY_THRESHOLD_M;
    }
    window.LocationUtils = { ACCURACY_THRESHOLD_M, GEO_OPTIONS, isValidLocation };
})();
