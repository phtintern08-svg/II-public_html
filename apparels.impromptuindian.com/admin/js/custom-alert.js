/**
 * Custom Alert System - Matching Login Page Style
 * Common for all admin dashboard pages
 * 
 * Usage:
 *   showAlert('Success', 'Login successful!', 'success');
 *   showAlert('Error', 'Login failed', 'error');
 *   showAlert('Info', 'Information message', 'info');
 */
function showAlert(title, message, type = 'info', onConfirm = null) {
    const alertModal = document.getElementById("customAlert");
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");

    // Fallback if modal is missing
    if (!alertModal || !alertTitle || !alertMessage || !alertIcon) {
        if (type === 'confirm' && onConfirm) {
            if (confirm(message)) {
                onConfirm();
            }
        } else {
            alert(message);
        }
        return;
    }

    // Set title and message
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertIcon.innerHTML = ""; // Clear previous icon

    // Find the button (could be single button or OK button)
    const singleBtn = alertModal.querySelector("button[onclick='closeAlert()']");
    const alertOkBtn = document.getElementById("alertOkBtn");
    const alertCancelBtn = document.getElementById("alertCancelBtn");
    const button = alertOkBtn || singleBtn;

    // Reset button state
    if (button) {
        button.onclick = closeAlert;
        if (alertCancelBtn) {
            alertCancelBtn.classList.add("hidden");
        }
    }

    // Set Icon and Styles based on type (matching login.js exactly)
    if (type === 'success') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center"><i data-lucide="check-circle" class="w-8 h-8 text-green-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-green-500";
    } else if (type === 'error') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center"><i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-red-500";
    } else if (type === 'confirm') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center"><i data-lucide="help-circle" class="w-8 h-8 text-yellow-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-yellow-500";

        // Show Cancel button for confirm type
        if (alertOkBtn && alertCancelBtn) {
            alertCancelBtn.classList.remove("hidden");
            alertOkBtn.style.width = "50%";
            alertCancelBtn.style.width = "50%";

            alertOkBtn.onclick = () => {
                closeAlert();
                if (onConfirm) onConfirm();
            };
            alertCancelBtn.onclick = closeAlert;
        }
    } else {
        // Default: info
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center"><i data-lucide="info" class="w-8 h-8 text-blue-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-blue-500";
    }

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Show alert
    alertModal.classList.remove("hidden");
}

function closeAlert() {
    const alertModal = document.getElementById("customAlert");
    if (alertModal) {
        alertModal.classList.add("hidden");
    }
}
