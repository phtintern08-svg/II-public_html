// --- API base hardening for multi-domain setups ---
// ✅ SINGLE SOURCE OF TRUTH: API base is defined here only (not in rider-register.html)
// If rider register page is served from a different host (e.g. impromptuindian.com/www),
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

// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Track timers - namespaced to prevent collisions between OTP and email verification
const timers = {
    otp: {},      // OTP timers: timers.otp[fieldId]
    email: {}    // Email verification timers: timers.email[fieldId] (if needed in future)
};

// OTP State Management
const otpState = {
    riderEmail: { sent: false, verified: false, timer: null, timeLeft: 0 },
    riderPhone: { sent: false, verified: false, timer: null, timeLeft: 0 }
};

// ✅ REDESIGNED: Auto-fill email from URL params (from magic link redirect)
// No polling, no state tracking - just auto-fill and let backend enforce verification
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const role = params.get('role');
    
    // ✅ FIX #1: Treat redirect as verification confirmation
    // If email/role come from URL params, it means user was redirected after verification
    // This IS the signal that email is verified - no need to poll or check backend
    if (email && role === 'rider') {
    const riderEmail = document.getElementById('riderEmail');
        if (riderEmail) {
            riderEmail.value = email;
            riderEmail.disabled = true; // Disable - already verified (redirect confirms this)
            riderEmail.classList.add('opacity-50', 'cursor-not-allowed', 'border-green-400');
            riderEmail.classList.remove('border-yellow-400');
            
            // Disable send button - email already verified
            const sendBtn = document.getElementById('riderEmailOtpBtn');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerText = "Email Verified";
                sendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'text-white');
                sendBtn.classList.remove('bg-[#FFCC00]');
            }
            
            // Hide resend button - not needed
            const resendBtn = document.getElementById('resend-riderEmail');
            if (resendBtn) {
                resendBtn.classList.add('hidden');
            }
            
            // Mark as verified in state
            otpState.riderEmail.verified = true;
        }
    }
    // ✅ REMOVED: Don't show resend button for filled emails without redirect
    // Resend should only appear when backend explicitly says "link_sent"
});

// ✅ STEP 2: Apply email verification to UI (reusable function)
function applyEmailVerified(email, role) {
    if (!email || !role || role !== 'rider') return;

    const field = document.getElementById('riderEmail');
    const btn = document.getElementById('riderEmailOtpBtn');
    const resendBtn = document.getElementById('resend-riderEmail');

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
    
    // Mark as verified in state
    otpState.riderEmail.verified = true;

    // Show success alert
    showAlert('Email Verified', 'Your email has been verified. You can now complete registration.', 'success');
    
    console.log('✅ Rider register page updated from verification event');
}

// ✅ STEP 2: Cross-tab email verification sync
// Listen for verification events from other tabs (when user clicks magic link in new tab)
window.addEventListener('storage', (event) => {
    if (event.key !== 'email_verified' || !event.newValue) return;

    try {
        const data = JSON.parse(event.newValue);
        if (data.role === 'rider') {
            applyEmailVerified(data.email, data.role);
        }
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
            if (data.role === 'rider') {
                applyEmailVerified(data.email, data.role);
            }
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
    
    // Mark as verified in state
    otpState[fieldId].verified = true;
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
        const role = 'rider';

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

// Show OTP Input
function showOtpInput(field) {
    const otpContainer = document.getElementById(`otp-${field}`);
    const otpInputsContainer = document.getElementById(`otp-inputs-${field}`);
    const otpBtn = document.getElementById(`${field}OtpBtn`);

    // Create 6 OTP input boxes
    otpInputsContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'w-10 h-10 text-center rounded bg-[#131820] border border-gray-700 text-white text-lg font-semibold';
        input.dataset.index = i;

        // Auto-focus next input
        input.addEventListener('input', (e) => {
            if (e.target.value && i < 5) {
                otpInputsContainer.children[i + 1].focus();
            }
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) {
                otpInputsContainer.children[i - 1].focus();
            }
        });

        otpInputsContainer.appendChild(input);
    }

    otpContainer.classList.remove('hidden');
    otpBtn.disabled = true;
    otpBtn.classList.add('opacity-50', 'cursor-not-allowed');
    otpInputsContainer.children[0].focus();
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
    const otpInputs = document.querySelectorAll(`#otp-inputs-${fieldId} input`);
    const otpValue = Array.from(otpInputs).map(input => input.value).join('');

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
            otpState[fieldId].verified = true;

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

// --- API Integration ---

async function registerUser(data) {
    try {
        const response = await ImpromptuIndianApi.fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

// Form Submission
const riderForm = document.getElementById('riderForm');
if (riderForm) {
    riderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('riderEmail').value;
        const phone = document.getElementById('riderPhone').value;

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

        const username = document.getElementById('riderName').value;
        const password = document.getElementById('riderPass').value;
        const confirmPassword = document.getElementById('riderConfirmPass').value;
        const termsAccepted = document.getElementById('riderTerms').checked;

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

        if (!termsAccepted) {
            showAlert('Terms Required', 'Please accept the Terms & Conditions.', 'error');
            return;
        }

        registerUser({
            username,
            email,
            password,
            phone,
            role: 'rider'
        });
    });
}

// --- Indian Phone Number Validation ---
function validateIndianPhone(phone) {
    // Remove spaces, dashes, and +91 prefix
    const cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '').replace(/^91/, '');
    // Indian mobile: 10 digits, starts with 6, 7, 8, or 9
    const regex = /^[6-9]\d{9}$/;
    return regex.test(cleaned);
}

// Restrict phone input to only numbers and enforce first digit rule
function restrictRiderPhoneInput(event) {
    const char = String.fromCharCode(event.which);
    const input = event.target;
    const currentValue = input.value;
    
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true)) {
        return true;
    }
    
    // Only allow numbers
    if (!/[0-9]/.test(char)) {
        event.preventDefault();
        return false;
    }
    
    // If first character, must be 6, 7, 8, or 9
    if (currentValue.length === 0 && !/[6789]/.test(char)) {
        event.preventDefault();
        showAlert('Invalid Phone Number', 'Phone number must start with 6, 7, 8, or 9.', 'error');
        return false;
    }
    
    // Limit to 10 digits
    if (currentValue.length >= 10) {
        event.preventDefault();
        return false;
    }
    
    return true;
}

// Check phone validation for rider
function checkRiderPhoneValidation() {
    const phoneInput = document.getElementById('riderPhone');
    let phoneValue = phoneInput.value;
    
    // Remove any non-numeric characters (in case of paste)
    phoneValue = phoneValue.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (phoneValue.length > 10) {
        phoneValue = phoneValue.substring(0, 10);
    }
    
    // If first digit is not 6, 7, 8, or 9, clear it
    if (phoneValue.length > 0 && !/[6789]/.test(phoneValue[0])) {
        phoneValue = '';
    }
    
    // Update the input value
    phoneInput.value = phoneValue;

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

// Alert Functions
function showAlert(title, message, type) {
    const modal = document.getElementById('customAlert');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const iconEl = document.getElementById('alertIcon');

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set icon based on type
    const icons = {
        success: '<svg class="w-12 h-12 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
        error: '<svg class="w-12 h-12 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
        info: '<svg class="w-12 h-12 text-blue-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };

    iconEl.innerHTML = icons[type] || icons.info;
    modal.classList.remove('hidden');
}

function closeAlert() {
    document.getElementById('customAlert').classList.add('hidden');
}
