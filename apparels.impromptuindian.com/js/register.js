// --- API base hardening for multi-domain setups ---
// ✅ SINGLE SOURCE OF TRUTH: API base is defined here only (not in register.html)
// If register page is served from a different host (e.g. impromptuindian.com/www),
// we must still call the API on the Passenger app host.
(function ensureApiBase() {
    const host = (window.location.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    
    if (isLocal) {
        // Local development: use localhost API
        window.IMPROMPTU_INDIAN_API_BASE = 'http://localhost:5000';
    } else if (host.endsWith('impromptuindian.com')) {
        // Production: always use apparels subdomain for API
        window.IMPROMPTU_INDIAN_API_BASE = 'https://apparels.impromptuindian.com';
    }
    // If neither condition matches, ImpromptuIndianApi will use origin as fallback
})();

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
            // PRODUCTION ONLY - Use production domain
            // Use relative paths - no absolute URLs
            base = '';
        }
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => {
            // Include credentials to send cookies (REQUIRED for session-based verification)
            return fetch(buildUrl(path), {
                ...options,
                credentials: 'include'
            });
        }
    };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

const tabCustomer = document.getElementById("tabCustomer");
const tabVendor = document.getElementById("tabVendor");

const customerForm = document.getElementById("customerForm");
const vendorForm = document.getElementById("vendorForm");

// ✅ REDESIGNED: Phone OTP verification status (UI-only, not enforced)
// Note: Phone OTP is currently disabled on backend
// This is kept for future use when phone OTP is re-enabled
// Phone verification is optional - not required for registration
const verificationStatus = {
    custPhone: false,
    vendPhone: false
};

// Track timers - namespaced to prevent collisions between OTP and email verification
const timers = {
    otp: {},      // OTP timers: timers.otp[fieldId]
    email: {}    // Email verification timers: timers.email[fieldId] (if needed in future)
};

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

// --- Indian Phone Number Validation ---
function validateIndianPhone(phone) {
    // Remove spaces, dashes, and +91 prefix
    const cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '').replace(/^91/, '');
    // Indian mobile: 10 digits, starts with 6, 7, 8, or 9
    const regex = /^[6-9]\d{9}$/;
    return regex.test(cleaned);
}

function checkPhoneValidation(prefix) {
    const phoneInput = document.getElementById(`${prefix}Phone`);
    const phoneValue = phoneInput.value;

    if (phoneValue === '') {
        phoneInput.classList.remove('border-green-500', 'border-red-500');
        return;
    }

    if (validateIndianPhone(phoneValue)) {
        phoneInput.classList.remove('border-red-500');
        phoneInput.classList.add('border-green-500');
    } else {
        phoneInput.classList.remove('border-green-500');
        phoneInput.classList.add('border-red-500');
    }
}

// --- Password Strength Validation ---
function checkPasswordStrength(prefix) {
    const password = document.getElementById(`${prefix}Pass`).value;
    const strengthIndicator = document.getElementById(`${prefix}PasswordStrength`);

    if (!strengthIndicator) return;

    if (password === '') {
        strengthIndicator.classList.add('hidden');
        return;
    }

    strengthIndicator.classList.remove('hidden');

    const conditions = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const lengthEl = document.getElementById(`${prefix}CondLength`);
    const uppercaseEl = document.getElementById(`${prefix}CondUppercase`);
    const lowercaseEl = document.getElementById(`${prefix}CondLowercase`);
    const numberEl = document.getElementById(`${prefix}CondNumber`);
    const specialEl = document.getElementById(`${prefix}CondSpecial`);

    // Update each condition indicator
    updateCondition(lengthEl, conditions.length);
    updateCondition(uppercaseEl, conditions.uppercase);
    updateCondition(lowercaseEl, conditions.lowercase);
    updateCondition(numberEl, conditions.number);
    updateCondition(specialEl, conditions.special);

    // Update password input border
    const passInput = document.getElementById(`${prefix}Pass`);
    const allValid = conditions.length && conditions.uppercase && conditions.lowercase && conditions.number && conditions.special;

    if (allValid) {
        passInput.classList.remove('border-red-500', 'border-yellow-500');
        passInput.classList.add('border-green-500');
    } else if (conditions.length) {
        passInput.classList.remove('border-red-500', 'border-green-500');
        passInput.classList.add('border-yellow-500');
    } else {
        passInput.classList.remove('border-green-500', 'border-yellow-500');
        passInput.classList.add('border-red-500');
    }
}

function updateCondition(element, isValid) {
    if (!element) return;
    if (isValid) {
        element.classList.remove('text-gray-500');
        element.classList.add('text-green-400');
        element.querySelector('.cond-icon').textContent = '✓';
    } else {
        element.classList.remove('text-green-400');
        element.classList.add('text-gray-500');
        element.querySelector('.cond-icon').textContent = '○';
    }
}

function isPasswordValid(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);
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

// Initialize OTP inputs for phone fields only (email uses verification link)
generateOtpInputs('otp-inputs-custPhone');
generateOtpInputs('otp-inputs-vendPhone');


function activateTab(isCustomer) {
    if (isCustomer) {
        tabCustomer.classList.add("bg-[#0f131a]", "text-white");
        tabVendor.classList.remove("bg-[#0f131a]", "text-white");
        tabVendor.classList.add("text-gray-400");

        customerForm.classList.remove("hidden");
        vendorForm.classList.add("hidden");

    } else {
        tabVendor.classList.add("bg-[#0f131a]", "text-white");
        tabCustomer.classList.remove("bg-[#0f131a]", "text-white");
        tabCustomer.classList.add("text-gray-400");

        vendorForm.classList.remove("hidden");
        customerForm.classList.add("hidden");
    }
}

if (tabCustomer && tabVendor) {
    tabCustomer.addEventListener("click", () => activateTab(true));
    tabVendor.addEventListener("click", () => activateTab(false));

    // Check URL parameter for role and auto-select tab
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role === 'vendor') {
        activateTab(false); // false = vendor tab
    } else {
        activateTab(true); // default to customer tab
    }
}

// Initialize Lucide Icons
lucide.createIcons();

// ✅ REDESIGNED: Auto-fill email from URL params (from magic link redirect)
// No polling, no state tracking - just auto-fill and let backend enforce verification
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const role = params.get('role');
    
    // ✅ FIX #1: Treat redirect as verification confirmation
    // If email/role come from URL params, it means user was redirected after verification
    // This IS the signal that email is verified - no need to poll or check backend
    if (email && role) {
        // Auto-fill email field based on role
        // ✅ Email is verified (redirect is proof) - disable field and button
        if (role === 'vendor') {
            const vendEmail = document.getElementById('vendEmail');
            if (vendEmail) {
                vendEmail.value = email;
                vendEmail.disabled = true; // Disable - already verified (redirect confirms this)
                vendEmail.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
                vendEmail.classList.remove('border-yellow-400');
                activateTab(false); // false = vendor tab
                
                // Disable send button - email already verified
                const sendBtn = document.getElementById('vendEmailOtpBtn');
                if (sendBtn) {
                    sendBtn.disabled = true;
                    sendBtn.innerText = "Email Verified";
                    sendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
                    sendBtn.classList.remove('bg-[#FFCC00]');
                }
                
                // Hide resend button - not needed
                const resendBtn = document.getElementById('resend-vendEmail');
                if (resendBtn) {
                    resendBtn.classList.add('hidden');
                }
            }
        } else if (role === 'customer') {
            const custEmail = document.getElementById('custEmail');
            if (custEmail) {
                custEmail.value = email;
                custEmail.disabled = true; // Disable - already verified (redirect confirms this)
                custEmail.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
                custEmail.classList.remove('border-yellow-400');
                activateTab(true); // true = customer tab
                
                // Disable send button - email already verified
                const sendBtn = document.getElementById('custEmailOtpBtn');
                if (sendBtn) {
                    sendBtn.disabled = true;
                    sendBtn.innerText = "Email Verified";
                    sendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
                    sendBtn.classList.remove('bg-[#FFCC00]');
                }
                
                // Hide resend button - not needed
                const resendBtn = document.getElementById('resend-custEmail');
                if (resendBtn) {
                    resendBtn.classList.add('hidden');
                }
            }
        }
    }
    // ✅ REMOVED: Don't show resend button for filled emails without redirect
    // Resend should only appear when backend explicitly says "link_sent"
});

// ✅ STEP 2: Apply email verification to UI (reusable function)
function applyEmailVerified(email, role) {
    if (!email || !role) return;

    // Update UI based on role
    if (role === 'customer') {
        const field = document.getElementById('custEmail');
        const btn = document.getElementById('custEmailOtpBtn');
        const resendBtn = document.getElementById('resend-custEmail');

        if (field) {
            field.value = email;
            field.disabled = true;
            field.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
            field.classList.remove('border-yellow-400');
        }

        if (btn) {
            btn.textContent = 'Email Verified';
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
            btn.classList.remove('bg-[#FFCC00]');
        }

        if (resendBtn) {
            resendBtn.classList.add('hidden');
        }

        // Switch to customer tab if needed
        activateTab(true);
    }

    if (role === 'vendor') {
        const field = document.getElementById('vendEmail');
        const btn = document.getElementById('vendEmailOtpBtn');
        const resendBtn = document.getElementById('resend-vendEmail');

        if (field) {
            field.value = email;
            field.disabled = true;
            field.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
            field.classList.remove('border-yellow-400');
        }

        if (btn) {
            btn.textContent = 'Email Verified';
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
            btn.classList.remove('bg-[#FFCC00]');
        }

        if (resendBtn) {
            resendBtn.classList.add('hidden');
        }

        // Switch to vendor tab if needed
        activateTab(false);
    }

    // Show success alert
    showAlert('Email Verified', 'Your email has been verified. You can now complete registration.', 'success');
    
    console.log('✅ Register page updated from verification event');
}

// ✅ STEP 2: Cross-tab email verification sync
// Listen for verification events from other tabs (when user clicks magic link in new tab)
window.addEventListener('storage', (event) => {
    if (event.key !== 'email_verified' || !event.newValue) return;

    try {
        const data = JSON.parse(event.newValue);
        applyEmailVerified(data.email, data.role);
    } catch (e) {
        console.error('Storage sync error:', e);
    }
});

// ✅ STEP 2: Apply immediately on load (in case navigation happened)
(function applyStoredVerification() {
    const stored = localStorage.getItem('email_verified');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            applyEmailVerified(data.email, data.role);
        } catch (e) {
            console.error('Error applying stored verification:', e);
        }
    }
})();

// ✅ Helper function to mark email as verified in UI
function markEmailVerifiedUI(fieldId) {
    const input = document.getElementById(fieldId);
    const btn = document.getElementById(`${fieldId}OtpBtn`);
    const resendBtn = document.getElementById(`resend-${fieldId}`);

    if (input) {
        input.disabled = true;
        input.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
        input.classList.remove('border-yellow-400');
    }

    if (btn) {
        btn.textContent = 'Email Verified';
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
        btn.classList.remove('bg-[#FFCC00]');
    }

    if (resendBtn) {
        resendBtn.classList.add('hidden');
    }
}

// --- OTP/Verification Link Handling ---
async function handleGetOtp(fieldId) {
    const inputField = document.getElementById(fieldId);
    const otpContainer = document.getElementById(`otp-${fieldId}`);
    const getOtpBtn = document.getElementById(`${fieldId}OtpBtn`);
    const timerDiv = document.getElementById(`timer-${fieldId}`);

    if (!inputField.value) {
        showAlert('Missing Info', 'Please enter a value first.', 'error');
        return;
    }

    // Determine type
    const type = fieldId.toLowerCase().includes('email') ? 'email' : 'phone';

    // For email: Send verification link (NO polling, NO state tracking)
    if (type === 'email') {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(inputField.value)) {
            showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
            getOtpBtn.disabled = false;
            getOtpBtn.innerText = "Send Verification Link";
            return;
        }

        const email = inputField.value.trim().toLowerCase();
        // Determine role from field ID
        const role = fieldId.startsWith('cust') ? 'customer' :
                     fieldId.startsWith('vend') ? 'vendor' : 'rider';

        // Disable button temporarily
        getOtpBtn.disabled = true;
        getOtpBtn.innerText = "Sending...";

        try {
            const response = await ImpromptuIndianApi.fetch('/api/send-email-verification-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });

            // Handle response - check for HTML error pages
            let result;
            try {
                const text = await response.text();

                // Check if response is HTML (error page)
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    console.error('Server returned HTML instead of JSON.');
                    showAlert('Server Error', 'Unable to reach the verification service. Please check if the server is running.', 'error');
                    getOtpBtn.disabled = false;
                    getOtpBtn.innerText = "Send Verification Link";
                    return;
                }

                // Try to parse as JSON
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                getOtpBtn.disabled = false;
                getOtpBtn.innerText = "Send Verification Link";
                return;
            }

            // ✅ FIX #3: Handle explicit backend states with proper early returns
            const status = result.status;
            const resendBtn = document.getElementById(`resend-${fieldId}`);
            
            if (status === 'already_registered') {
                // ✅ FIX #3: Early return - don't show resend button
                showAlert('Already Registered', result.message || 'This email is already registered. Please log in.', 'info');
                inputField.disabled = true;
                inputField.classList.add('opacity-50', 'cursor-not-allowed');
                getOtpBtn.disabled = true;
                getOtpBtn.innerText = 'Already Registered';
                getOtpBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-500', 'text-white');
                getOtpBtn.classList.remove('bg-[#FFCC00]');
                if (resendBtn) resendBtn.classList.add('hidden');
                return;
            }

            if (status === 'already_verified') {
                // ✅ FIX #3: Early return - use helper function
                showAlert('Email Verified', result.message || 'You can proceed to create your account.', 'success');
                markEmailVerifiedUI(fieldId);
                return;
            }

            // ✅ FIX: Handle explicit backend states
            if (response.ok && result.success) {
                
                if (status === 'link_sent') {
                    // Normal flow - link was sent
                    inputField.classList.remove('border-green-400');
                    inputField.classList.add('border-yellow-400'); // Yellow = link sent
                    getOtpBtn.disabled = true;
                    getOtpBtn.innerText = "Link Sent";
                    getOtpBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    
                    // ✅ FIX: Only show resend button when link_sent
                    setTimeout(() => {
                        if (resendBtn) {
                            resendBtn.classList.remove('hidden');
                        }
                        // Re-enable send button as fallback
                        getOtpBtn.disabled = false;
                        getOtpBtn.innerText = "Send Verification Link";
                        getOtpBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }, 5 * 60 * 1000); // 5 minutes

                    showAlert(
                        'Verification Email Sent',
                        'Check your inbox and click the link. Then return here to complete registration.',
                        'success'
                    );
                } else {
                    // Unknown status - treat as error
                    showAlert('Error', result.message || 'Failed to send verification email', 'error');
                    getOtpBtn.disabled = false;
                    getOtpBtn.innerText = "Send Verification Link";
                    if (resendBtn) resendBtn.classList.add('hidden');
                }
            } else {
                // Error response
                const resendBtn = document.getElementById(`resend-${fieldId}`);
                if (resendBtn) {
                    resendBtn.classList.add('hidden'); // Hide resend on error
                }
                showAlert('Error', result.error || 'Failed to send verification email', 'error');
                getOtpBtn.disabled = false;
                getOtpBtn.innerText = "Send Verification Link";
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Connection Error', 'Failed to connect to server.', 'error');
            getOtpBtn.disabled = false;
            getOtpBtn.innerText = "Send Verification Link";
            // Hide resend button on connection error
            const resendBtn = document.getElementById(`resend-${fieldId}`);
            if (resendBtn) {
                resendBtn.classList.add('hidden');
            }
        }
        return;
    }

    // For phone: Use OTP (existing flow)
    if (type === 'phone') {
        // ✅ FIX: Phone OTP is disabled on backend - show clear message
        showAlert(
            'Phone OTP Disabled',
            'Phone OTP verification is currently disabled. Please use email verification instead.',
            'error'
        );
        return;
    }
}

function startTimer(fieldId, button, timerDiv) {
    let timeLeft = 60;

    // Clear any existing timer (using namespaced timers)
    if (timers.otp[fieldId]) {
        clearInterval(timers.otp[fieldId]);
    }

    timerDiv.classList.remove('hidden');
    button.disabled = true;
    button.innerText = "Resend OTP";
    button.classList.remove('bg-[#ffd43b]', 'text-black', 'hover:bg-[#e6be35]');
    button.classList.add('bg-transparent', 'text-[#ffd43b]', 'border', 'border-[#ffd43b]', 'hover:bg-[#ffd43b]', 'hover:text-black', 'opacity-50', 'cursor-not-allowed');

    timers.otp[fieldId] = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `Resend OTP in ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timers.otp[fieldId]);
            delete timers.otp[fieldId];
            button.disabled = false;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
            timerDiv.classList.add('hidden');
        }
    }, 1000);
}

async function verifyOtp(fieldId) {
    const inputField = document.getElementById(fieldId);
    
    // Determine type
    const type = fieldId.toLowerCase().includes('email') ? 'email' : 'phone';
    
    // Email verification is done via link, not OTP
    if (type === 'email') {
        showAlert('Email Verification', 'Email verification is done via verification link sent after registration.', 'info');
        return;
    }
    
    // Phone OTP verification
    const otpContainer = document.getElementById(`otp-${fieldId}`);
    const getOtpBtn = document.getElementById(`${fieldId}OtpBtn`);
    const timerDiv = document.getElementById(`timer-${fieldId}`);
    const verifiedIcon = document.getElementById(`verified-${fieldId}-icon`);

    // Get OTP from the 6 boxes
    const otpValue = getOtpValue(`otp-inputs-${fieldId}`);

    if (otpValue.length !== 6) {
        showAlert('Invalid OTP', 'Please enter the full 6-digit OTP.', 'error');
        return;
    }

    try {
        const response = await ImpromptuIndianApi.fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: inputField.value,
                otp: otpValue
            })
        });

        // Handle response - check for HTML error pages
        let result;
        try {
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the OTP verification service. Please check if the server is running.', 'error');
                return;
            }

            // Try to parse as JSON
            result = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok && result.verified) {
            // ✅ Note: verificationStatus is set but not enforced (phone OTP is optional)
            // Phone verification is UI-only feedback, not required for registration
            verificationStatus[fieldId] = true;

            // Hide OTP input container, button, and timer
            if (otpContainer) otpContainer.classList.add('hidden');
            if (getOtpBtn) getOtpBtn.classList.add('hidden');
            if (timerDiv) timerDiv.classList.add('hidden');

            // Clear any running timer (using namespaced timers)
            if (timers.otp[fieldId]) {
                clearInterval(timers.otp[fieldId]);
                delete timers.otp[fieldId];
            }

            // Show green checkmark icon
            if (verifiedIcon) verifiedIcon.classList.remove('hidden');

            // Make input field read-only and add green border
            inputField.readOnly = true;
            inputField.classList.add('border-green-400');

            showAlert('Verified', 'OTP verified successfully!', 'success');
        } else {
            showAlert('Verification Failed', result.error || 'Invalid OTP', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error', 'Failed to verify OTP.', 'error');
    }
}

// --- API Integration ---

/**
 * Get the correct API base URL based on user role
 * This ensures vendor registrations go to vendor/apparels backend,
 * customer registrations go to customer backend, etc.
 */
function getApiBaseForRole(role) {
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000';
    }

    // Role-based routing: each role goes to its correct backend
    if (role === 'vendor') {
        return 'https://apparels.impromptuindian.com';
    } else if (role === 'customer') {
        return 'https://impromptuindian.com';
    } else if (role === 'rider') {
        return 'https://apparels.impromptuindian.com';
    }

    // Default fallback
    return 'https://apparels.impromptuindian.com';
}

async function registerUser(data) {
    try {
        // ✅ FIX: Use role-based API routing to ensure requests hit the correct backend
        const apiBase = getApiBaseForRole(data.role);
        
        // Build the full URL with the role-specific API base
        const url = `${apiBase}/api/register`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Include credentials for session-based auth
            body: JSON.stringify(data)
        });

        // Handle response - check for HTML error pages
        let result;
        try {
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the registration service. Please check if the server is running.', 'error');
                return;
            }

            // Try to parse as JSON
            result = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok && result.success) {
            // ✅ FIX: Email was already verified before registration, account is created
            showAlert('Account Created', 'Your account has been created successfully. You can now log in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            // ✅ REDESIGNED: Handle 403 (email not verified) from backend
            if (response.status === 403) {
                showAlert(
                    'Email Verification Required',
                    result.error || 'Please verify your email before creating an account. Click the verification link sent to your email.',
                    'error'
                );
            } else {
                showAlert('Registration Failed', result.error || 'Registration failed', 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error', 'Failed to connect to the server.', 'error');
    }
}

// --- Password Match Validation ---
function checkPasswordMatch(prefix) {
    const password = document.getElementById(`${prefix}Pass`).value;
    const confirmPassword = document.getElementById(`${prefix}ConfirmPass`).value;
    const matchMessage = document.getElementById(`${prefix}PasswordMatch`);
    const confirmInput = document.getElementById(`${prefix}ConfirmPass`);

    if (confirmPassword === '') {
        matchMessage.classList.add('hidden');
        confirmInput.classList.remove('border-green-500', 'border-red-500');
        return;
    }

    matchMessage.classList.remove('hidden');

    if (password === confirmPassword) {
        matchMessage.textContent = '✓ Passwords match';
        matchMessage.classList.remove('text-red-400');
        matchMessage.classList.add('text-green-400');
        confirmInput.classList.remove('border-red-500');
        confirmInput.classList.add('border-green-500');
    } else {
        matchMessage.textContent = '✗ Passwords do not match';
        matchMessage.classList.remove('text-green-400');
        matchMessage.classList.add('text-red-400');
        confirmInput.classList.remove('border-green-500');
        confirmInput.classList.add('border-red-500');
    }
}

if (customerForm) {
    customerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('custEmail').value;
        const phone = document.getElementById('custPhone').value;

        // Validate email format
        if (email) {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
                return;
            }
        }

        // ✅ REDESIGNED: No frontend verification check - backend enforces it
        // Backend will return 403 if email not verified, handled in registerUser()

        // Validate Indian phone number format (if provided)
        if (phone && !validateIndianPhone(phone)) {
            showAlert('Invalid Mobile Number', 'The mobile number you entered is not valid. Please provide a 10-digit Indian mobile number.', 'error');
            return;
        }

        const username = document.getElementById('custName').value;
        const password = document.getElementById('custPass').value;
        const confirmPassword = document.getElementById('custConfirmPass').value;

        // Check password strength
        if (!isPasswordValid(password)) {
            showAlert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.', 'error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            showAlert('Password Mismatch', 'Passwords do not match. Please re-enter.', 'error');
            return;
        }

        registerUser({
            username,
            email,
            password,
            phone,
            role: 'customer'
        });
    });
}

if (vendorForm) {
    vendorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('vendEmail').value;
        const phone = document.getElementById('vendPhone').value;

        // Validate email format
        if (email) {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
                return;
            }
        }

        // ✅ REDESIGNED: No frontend verification check - backend enforces it
        // Backend will return 403 if email not verified, handled in registerUser()

        // Validate Indian phone number format (if provided)
        if (phone && !validateIndianPhone(phone)) {
            showAlert('Invalid Mobile Number', 'The mobile number you entered is not valid. Please provide a 10-digit Indian mobile number.', 'error');
            return;
        }

        const username = document.getElementById('vendName').value;
        const password = document.getElementById('vendPass').value;
        const confirmPassword = document.getElementById('vendConfirmPass').value;
        const business_name = document.getElementById('vendBusiness').value;

        // Check password strength
        if (!isPasswordValid(password)) {
            showAlert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.', 'error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            showAlert('Password Mismatch', 'Passwords do not match. Please re-enter.', 'error');
            return;
        }

        registerUser({
            username,
            email,
            password,
            phone,
            business_name,
            role: 'vendor'
        });
    });
}
