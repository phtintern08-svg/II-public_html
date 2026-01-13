const ImpromptuIndianApi = window.ImpromptuIndianApi || (() => {
    const rawBase =
        window.IMPROMPTU_INDIAN_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
        '';

    let base = rawBase.trim().replace(/\/$/, '');
    if (!base) {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) {
            base = origin.replace(/\/$/, '');
        } else {
            base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
        }
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options)
    };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

// --- Custom Alert Logic ---
const customAlert = document.getElementById('customAlert');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');

function showAlert(title, message, type = 'info') {
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    // Set Icon based on type
    if (type === 'success') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center"><i data-lucide="check-circle" class="w-8 h-8 text-green-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-green-500";
    } else if (type === 'error') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center"><i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-red-500";
    } else {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center"><i data-lucide="info" class="w-8 h-8 text-blue-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-blue-500";
    }

    lucide.createIcons();
    customAlert.classList.remove('hidden');
}

function closeAlert() {
    customAlert.classList.add('hidden');
}

// --- OTP Input Logic ---
function generateOtpInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ''; // Clear existing

    for (let i = 0; i < 6; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'otp-input';
        input.dataset.index = i;

        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && !/^\d+$/.test(val)) {
                e.target.value = ''; // Only numbers
                return;
            }

            if (val) {
                // Move to next input
                const next = container.querySelector(`input[data-index="${i + 1}"]`);
                if (next) next.focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                // Move to prev input
                const prev = container.querySelector(`input[data-index="${i - 1}"]`);
                if (prev) prev.focus();
            }
        });

        container.appendChild(input);
    }
}

function getOtpValue(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input');
    let otp = '';
    inputs.forEach(input => otp += input.value);
    return otp;
}

// Initialize OTP inputs
generateOtpInputs('otp-inputs');

// -----------------------------
// SHOW EMAIL FROM LOCAL STORAGE
// -----------------------------
const savedEmail = localStorage.getItem("pending_email");
if (!savedEmail) {
    console.warn("No email found.");
} else {
    const emailDisplay = document.getElementById("emailDisplay");
    if (emailDisplay) emailDisplay.innerText = savedEmail;
}

// -----------------------------
// VERIFY OTP
// -----------------------------
async function verifyOtp() {
    const otp = getOtpValue('otp-inputs');

    if (otp.length !== 6) {
        showAlert('Invalid OTP', 'Please enter the full 6-digit OTP.', 'error');
        return;
    }

    try {
        const res = await ImpromptuIndianApi.fetch("/api/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: savedEmail, otp })
        });

        const json = await res.json();

        if (res.ok) {
            showAlert('Success', 'OTP Verified Successfully!', 'success');

            // clear stored values
            localStorage.removeItem("pending_email");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showAlert('Verification Failed', json.error || "OTP failed", 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server.', 'error');
    }
}

// -----------------------------
// RESEND OTP
// -----------------------------
async function resendOtp() {
    if (!savedEmail) {
        showAlert('Error', 'No email found to resend OTP.', 'error');
        return;
    }

    try {
        const res = await ImpromptuIndianApi.fetch("/api/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: savedEmail, type: 'email' })
        });

        const json = await res.json();

        if (res.ok) {
            showAlert('OTP Sent', json.message || "OTP resent!", 'success');
        } else {
            showAlert('Error', json.error || "Failed to resend OTP", 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server.', 'error');
    }
}

lucide.createIcons();
