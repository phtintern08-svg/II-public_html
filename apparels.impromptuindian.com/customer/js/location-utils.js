/**
 * Location Utils - Multi-layer location strategy (Swiggy/Amazon style)
 * LEVEL 1: High accuracy GPS (maximumAge: 0) | LEVEL 2: Reject >50m | LEVEL 3: Map pin fallback
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
