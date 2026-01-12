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

    let iconName = "info";
    let colorClass = "text-blue-500";

    if (type === "success") {
        iconName = "check-circle";
        colorClass = "text-green-500";
    } else if (type === "error") {
        iconName = "alert-circle";
        colorClass = "text-red-500";
    } else if (type === "confirm") {
        iconName = "help-circle";
        colorClass = "text-yellow-500";

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
        } else {
            // Fallback for old modal structure
            if (confirm(message)) {
                if (onConfirm) onConfirm();
            }
            closeAlert();
            return;
        }
    }

    // Create icon element
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", iconName);
    icon.className = `w-12 h-12 ${colorClass} mx-auto`;
    alertIcon.appendChild(icon);

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
