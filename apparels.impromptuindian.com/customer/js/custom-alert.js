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

    // Support HTML in message
    if (message.includes('<')) {
        alertMessage.innerHTML = message;
    } else {
        alertMessage.textContent = message;
    }

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
    let bgColorClass = "bg-blue-900/30";

    if (type === "success") {
        iconName = "check-circle";
        colorClass = "text-green-500";
        bgColorClass = "bg-green-900/30";
    } else if (type === "error") {
        iconName = "alert-circle";
        colorClass = "text-red-500";
        bgColorClass = "bg-red-900/30";
    } else if (type === "confirm") {
        iconName = "help-circle";
        colorClass = "text-yellow-500";
        bgColorClass = "bg-yellow-900/30";

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
    } else {
        // For success, error, info - execute callback when OK is clicked
        if (alertOkBtn && onConfirm) {
            alertOkBtn.onclick = () => {
                closeAlert();
                onConfirm();
            };
        }
    }

    // Update title color based on type (matching login page style)
    if (type === "success") {
        alertTitle.className = "text-lg font-bold mb-2 text-green-500";
    } else if (type === "error") {
        alertTitle.className = "text-lg font-bold mb-2 text-red-500";
    } else if (type === "confirm") {
        alertTitle.className = "text-lg font-bold mb-2 text-yellow-500";
    } else {
        alertTitle.className = "text-lg font-bold mb-2 text-blue-500";
    }

    // Create icon element with background circle (matching login page style)
    const iconWrapper = document.createElement("div");
    iconWrapper.className = `w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center`;
    
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", iconName);
    icon.className = `w-8 h-8 ${colorClass}`;
    
    iconWrapper.appendChild(icon);
    alertIcon.appendChild(iconWrapper);

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
