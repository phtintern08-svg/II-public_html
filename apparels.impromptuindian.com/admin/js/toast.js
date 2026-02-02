/**
 * Toast Notification System - Uses Custom Alert Modal
 * Common utility for all admin dashboard pages
 * 
 * This now uses the same alert modal as login page for consistency
 * 
 * Usage:
 *   showToast('Success message', 'success');
 *   showToast('Error message', 'error');
 *   showToast('Warning message', 'warning');
 *   showToast('Info message', 'info');
 */

/**
 * Show a toast notification (uses custom alert modal)
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info' (default: 'info')
 * @param {number} duration - Duration in milliseconds (0 = manual close only, default: 0)
 */
function showToast(message, type = 'info', duration = 0) {
    // Use showAlert from custom-alert.js (matching login page style)
    if (typeof showAlert === 'function') {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        
        showAlert(titles[type] || 'Info', message, type);
        
        // Auto-close after duration if specified
        if (duration > 0) {
            setTimeout(() => {
                closeAlert();
            }, duration);
        }
    } else {
        // Fallback to browser alert if showAlert is not available
        alert(message);
    }
    // Check if toast element already exists (backward compatibility)
    let toast = document.getElementById('toast');
    
    // If existing toast is visible, hide it first
    if (toast && !toast.classList.contains('hidden')) {
        hideToast(toast);
        // Wait for animation to complete
        setTimeout(() => {
            showToast(message, type, duration);
        }, 300);
        return;
    }

    // Create new toast element if it doesn't exist
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    // Update toast classes and content
    toast.className = `toast toast-${type}`;

    // Get icon based on type
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    // Create toast content
    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5"></i>
        <span id="toast-msg">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="hideToast(this.closest('.toast'))" aria-label="Close">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Show toast with animation
    requestAnimationFrame(() => {
        toast.classList.remove('hidden');
    });

    // Auto-hide after duration
    if (duration > 0) {
        setTimeout(() => {
            hideToast(toast);
        }, duration);
    }

    return toast;
}

/**
 * Hide a toast notification
 * @param {HTMLElement} toast - The toast element to hide
 */
function hideToast(toast) {
    if (!toast) {
        toast = document.getElementById('toast');
    }
    
    if (!toast) return;

    // Add exit animation
    toast.classList.add('toast-exit');
    
    // Remove after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showSuccessToast(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showErrorToast(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds (default: 3500)
 */
function showWarningToast(message, duration = 3500) {
    return showToast(message, 'warning', duration);
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showInfoToast(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Legacy compatibility - update existing showToast function if it exists
if (typeof window.showToast === 'function') {
    // Keep the old function but enhance it
    const oldShowToast = window.showToast;
    window.showToast = function(message, type = 'info', duration = 3000) {
        // If called with old signature (just message), use info type
        if (arguments.length === 1) {
            return showToast(message, 'info', 3000);
        }
        return showToast(message, type, duration);
    };
}
