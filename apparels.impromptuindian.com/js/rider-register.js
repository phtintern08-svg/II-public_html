// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// OTP State Management
const otpState = {
    riderEmail: { sent: false, verified: false, timer: null, timeLeft: 0 },
    riderPhone: { sent: false, verified: false, timer: null, timeLeft: 0 }
};

// Handle Get OTP / Verification Link
async function handleGetOtp(field) {
    const inputElement = document.getElementById(field);
    const value = inputElement.value.trim();
    const otpBtn = document.getElementById(`${field}OtpBtn`);

    if (!value) {
        showAlert('Error', `Please enter your ${field.includes('Email') ? 'email' : 'phone number'}`, 'error');
        return;
    }

    // For email: Send verification link immediately (before registration)
    if (field.includes('Email')) {
        if (!isValidEmail(value)) {
            showAlert('Error', 'Please enter a valid email address', 'error');
            return;
        }

        const email = value.trim().toLowerCase();
        const role = 'rider'; // Rider registration page

        // Disable button temporarily
        otpBtn.disabled = true;
        otpBtn.innerText = "Sending...";

        try {
            const response = await fetch(`${getApiBase()}/api/send-email-verification-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });

            // Handle response - check for HTML error pages
            let data;
            try {
                const text = await response.text();
                
                // Check if response is HTML (error page)
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<?xml')) {
                    console.error('Server returned HTML instead of JSON.');
                    showAlert('Server Error', 'Unable to reach the verification service. Please check if the server is running.', 'error');
                    otpBtn.disabled = false;
                    otpBtn.innerText = "Send Verification Link";
                    return;
                }
                
                // Try to parse as JSON
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                otpBtn.disabled = false;
                otpBtn.innerText = "Send Verification Link";
                return;
            }

            if (response.ok && data.success) {
                // Email verification link sent successfully
                otpState[field].verified = true;
                inputElement.readOnly = true;
                inputElement.classList.add('border-green-400');
                otpBtn.disabled = true;
                otpBtn.innerText = "Link Sent";
                otpBtn.classList.add('opacity-50', 'cursor-not-allowed');
                
                // Show verified icon
                const verifiedIcon = document.getElementById(`verified-${field}-icon`);
                if (verifiedIcon) {
                    verifiedIcon.classList.remove('hidden');
                }

                showAlert('Verification Email Sent', 'Please check your inbox and click the verification link to verify your email.', 'success');
            } else {
                showAlert('Error', data.error || 'Failed to send verification email', 'error');
                otpBtn.disabled = false;
                otpBtn.innerText = "Send Verification Link";
            }
        } catch (error) {
            console.error('Error sending verification link:', error);
            showAlert('Connection Error', 'Failed to connect to server. Please check your internet connection.', 'error');
            otpBtn.disabled = false;
            otpBtn.innerText = "Send Verification Link";
        }
        return;
    }

    // For phone: Use OTP (existing flow)
    if (field.includes('Phone')) {
        if (!isValidPhone(value)) {
            showAlert('Error', 'Please enter a valid phone number', 'error');
            return;
        }

        try {
            const response = await fetch(`${getApiBase()}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: value,
                    type: 'phone'
                })
            });

            // Handle response - check for HTML error pages
            let data;
            try {
                const text = await response.text();
                
                // Check if response is HTML (error page)
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<?xml')) {
                    console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                    showAlert('Server Error', 'Unable to reach the OTP service. Please check if the server is running.', 'error');
                    return;
                }
                
                // Try to parse as JSON
                data = JSON.parse(text);
            } catch (parseError) {
                // If JSON parsing fails, show a more helpful error
                console.error('Failed to parse response as JSON:', parseError);
                showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                return;
            }

            if (response.ok) {
                otpState[field].sent = true;
                showOtpInput(field);
                startTimer(field, 120); // 2 minutes
                showAlert('Success', `OTP sent to your phone`, 'success');
            } else {
                showAlert('Error', data.error || data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            showAlert('Connection Error', 'Failed to connect to server. Please check your internet connection.', 'error');
        }
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

// Verify OTP
async function verifyOtp(field) {
    // Email verification is done via link, not OTP
    if (field.includes('Email')) {
        showAlert('Email Verification', 'Email verification is done via verification link sent after registration.', 'info');
        return;
    }
    
    // Phone OTP verification
    const otpInputs = document.querySelectorAll(`#otp-inputs-${field} input`);
    const otp = Array.from(otpInputs).map(input => input.value).join('');

    if (otp.length !== 6) {
        showAlert('Error', 'Please enter the complete 6-digit OTP', 'error');
        return;
    }

    const inputElement = document.getElementById(field);
    const value = inputElement.value.trim();

    try {
        const response = await fetch(`${getApiBase()}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: value,
                otp: otp
            })
        });

        // Handle response - check for HTML error pages
        let data;
        try {
            const text = await response.text();
            
            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<?xml')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the OTP verification service. Please check if the server is running.', 'error');
                return;
            }
            
            // Try to parse as JSON
            data = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok && data.verified) {
            otpState[field].verified = true;
            if (otpState[field].timer) {
                clearInterval(otpState[field].timer);
            }

            // Show verified icon
            const verifiedIcon = document.getElementById(`verified-${field}-icon`);
            const otpContainer = document.getElementById(`otp-${field}`);
            const timerElement = document.getElementById(`timer-${field}`);
            
            if (verifiedIcon) verifiedIcon.classList.remove('hidden');
            if (otpContainer) otpContainer.classList.add('hidden');
            if (timerElement) timerElement.classList.add('hidden');

            // Make input field read-only and add green border
            inputElement.readOnly = true;
            inputElement.classList.add('border-green-400');

            showAlert('Success', 'Verification successful!', 'success');
        } else {
            showAlert('Error', data.error || data.message || 'Invalid OTP', 'error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showAlert('Error', 'Network error. Please try again.', 'error');
    }
}

// Start Timer
function startTimer(field, seconds) {
    otpState[field].timeLeft = seconds;
    const timerElement = document.getElementById(`timer-${field}`);
    timerElement.classList.remove('hidden');

    otpState[field].timer = setInterval(() => {
        otpState[field].timeLeft--;

        const minutes = Math.floor(otpState[field].timeLeft / 60);
        const secs = otpState[field].timeLeft % 60;
        timerElement.textContent = `Resend OTP in ${minutes}:${secs.toString().padStart(2, '0')}`;

        if (otpState[field].timeLeft <= 0) {
            clearInterval(otpState[field].timer);
            timerElement.classList.add('hidden');
            const otpBtn = document.getElementById(`${field}OtpBtn`);
            otpBtn.disabled = false;
            otpBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            otpState[field].sent = false;
        }
    }, 1000);
}

// Form Submission
document.getElementById('riderForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('riderName').value.trim();
    const email = document.getElementById('riderEmail').value.trim();
    const phone = document.getElementById('riderPhone').value.trim();
    const password = document.getElementById('riderPass').value;
    const confirmPassword = document.getElementById('riderConfirmPass').value;
    const termsAccepted = document.getElementById('riderTerms').checked;

    // Validations
    if (!isValidEmail(email)) {
        showAlert('Error', 'Please enter a valid email address', 'error');
        return;
    }

    // Check if email was verified
    if (!otpState.riderEmail.verified) {
        showAlert('Email Not Verified', 'Please verify your email first by clicking "Send Verification Link" and clicking the link in your email.', 'error');
        return;
    }

    if (!isValidPhone(phone)) {
        showAlert('Error', 'Please enter a valid phone number', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Error', 'Password must be at least 6 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Error', 'Passwords do not match', 'error');
        return;
    }

    if (!termsAccepted) {
        showAlert('Error', 'Please accept the Terms & Conditions', 'error');
        return;
    }

    // Submit registration
    try {
        const response = await fetch(`${getApiBase()}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: name,
                email,
                phone,
                password,
                role: 'rider'
            })
        });

        let data;
        try {
            const text = await response.text();
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                showAlert('Server Error', 'Unable to reach the registration service. Please check if the server is running.', 'error');
                return;
            }
            data = JSON.parse(text);
        } catch (parseError) {
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok && data.success) {
            showAlert('Check Your Email', 'Verification email sent. Please verify your email before logging in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            // Show the exact error from the server
            console.error('Registration error:', data);
            showAlert('Error', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        showAlert('Error', 'Network error. Please try again.', 'error');
    }
});

// Helper Functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\d\s\-\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function getApiBase() {
    // Use relative paths - no absolute URLs
    return window.IMPROMPTU_INDIAN_API_BASE || '';
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
