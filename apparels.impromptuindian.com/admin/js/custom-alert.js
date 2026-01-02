function showAlert(title, message, type, onConfirm = null) {
    const alertModal = document.getElementById("customAlert");
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");
    const alertOkBtn = document.getElementById("alertOkBtn");
    const alertCancelBtn = document.getElementById("alertCancelBtn");

    if (!alertModal) {
        // Fallback if modal is missing
        if (type === 'confirm') {
            if (confirm(message)) {
                if (onConfirm) onConfirm();
            }
        } else {
            alert(message);
        }
        return;
    }

    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertIcon.innerHTML = ""; // Clear previous icon

    // Reset buttons
    // If buttons don't exist (old modal HTML), try to find the single button
    const singleBtn = alertModal.querySelector("button[onclick='closeAlert()']");

    // If we have the new structure with specific IDs
    if (alertOkBtn && alertCancelBtn) {
        alertOkBtn.onclick = closeAlert;
        alertCancelBtn.classList.add("hidden");
        alertOkBtn.classList.remove("w-1/2");
        alertOkBtn.classList.add("w-full");
    }

    // Set Icon and Styles based on type
    if (type === 'success') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center mx-auto"><i data-lucide="check-circle" class="w-8 h-8 text-green-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-green-500";
    } else if (type === 'error') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mx-auto"><i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-red-500";
    } else if (type === 'confirm') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center mx-auto"><i data-lucide="help-circle" class="w-8 h-8 text-yellow-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-yellow-500";

        if (alertOkBtn && alertCancelBtn) {
            // Show Cancel button
            alertCancelBtn.classList.remove("hidden");
            alertOkBtn.classList.remove("w-full");
            alertOkBtn.classList.add("w-1/2");
            alertCancelBtn.classList.add("w-1/2");

            alertOkBtn.onclick = () => {
                closeAlert();
                if (onConfirm) onConfirm();
            };
        }
    } else {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center mx-auto"><i data-lucide="info" class="w-8 h-8 text-blue-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-blue-500";
    }

    if (window.lucide) {
        lucide.createIcons();
    }

    alertModal.classList.remove("hidden");
}

function closeAlert() {
    const alertModal = document.getElementById("customAlert");
    if (alertModal) {
        alertModal.classList.add("hidden");
    }
}
