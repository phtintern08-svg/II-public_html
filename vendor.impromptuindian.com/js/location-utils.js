/**
 * Location Utils - Role-based accuracy (Swiggy/Uber style)
 * Frontend collects, backend decides. Never block - log warning only.
 */
(function () {
    'use strict';

    const ACCURACY_RULES = {
        rider: 80,        // strict - mobile GPS
        vendor: 300,      // medium - shop location
        customer: 500     // relaxed - delivery address
    };

    const GEO_OPTIONS = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    };

    function isValidLocation(position, role = "customer") {
        if (!position || !position.coords) return false;
        const accuracy = position.coords.accuracy;
        const threshold = ACCURACY_RULES[role] || 300;
        return typeof accuracy === "number" && accuracy <= threshold;
    }

    window.LocationUtils = {
        GEO_OPTIONS,
        ACCURACY_RULES,
        isValidLocation
    };
})();
