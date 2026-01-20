lucide.createIcons(); // activate icons

const ImpromptuIndianApi = window.ImpromptuIndianApi || (() => {
    const rawBase =
        window.IMPROMPTU_INDIAN_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
        '';

    let base = rawBase.trim().replace(/\/$/, '');
    if (!base) {
        // Use relative paths - no absolute URLs
        base = '';
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => {
            // Ensure Content-Type is set if not already set and body is provided
            if (options.body && !options.headers?.['Content-Type'] && !options.headers?.['content-type']) {
                if (!options.headers) {
                    options.headers = {};
                }
                options.headers['Content-Type'] = 'application/json';
            }
            // Include credentials to send cookies (REQUIRED for subdomain SSO)
            return fetch(buildUrl(path), {
                ...options,
                credentials: 'include'
            });
        }
    };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

const loginForm = document.getElementById('loginForm');

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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;

        // Validate input before making API call
        if (!identifier || identifier.length === 0) {
            showAlert('Validation Error', 'Please enter your email or phone number.', 'error');
            return;
        }

        if (!password || password.length === 0) {
            showAlert('Validation Error', 'Please enter your password.', 'error');
            return;
        }

        try {
            const response = await ImpromptuIndianApi.fetch('/api/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, password })
            });

            // Check for 404 specifically (endpoint not found)
            if (response.status === 404) {
                console.error('Login endpoint not found (404). Check if the server route is properly configured.');
                showAlert('Server Error', 'Login service is not available. Please contact support or try again later.', 'error');
                return;
            }

            // Check for other HTTP errors before parsing
            if (!response.ok && response.status >= 500) {
                showAlert('Server Error', 'The server encountered an error. Please try again later.', 'error');
                return;
            }

            // Try to parse response as JSON, handle HTML error pages gracefully
            let result;
            try {
                // Check content type before reading response
                const contentType = response.headers.get('content-type') || '';
                
                // If content type is HTML, it means the endpoint returned HTML instead of JSON
                if (contentType.includes('text/html')) {
                    console.error('Server returned HTML instead of JSON. This usually means the endpoint is not found or misconfigured.');
                    showAlert('Server Error', 'Unable to reach the login service. The endpoint may not be available.', 'error');
                    return;
                }
                
                const text = await response.text();
                
                // Check if response is empty
                if (!text || text.trim().length === 0) {
                    showAlert('Server Error', 'Server returned an empty response. Please try again.', 'error');
                    return;
                }
                
                // Check if response is HTML (error page) - check before parsing
                const trimmedText = text.trim();
                if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<?xml')) {
                    console.error('Server returned HTML page instead of JSON response. Status:', response.status);
                    showAlert('Server Error', 'Unable to reach the login service. Please check if the server is running.', 'error');
                    return;
                }
                
                // Try to parse as JSON
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    // If JSON parsing fails, check if it's HTML and handle silently
                    if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html')) {
                        console.error('Failed to parse HTML response as JSON. Status:', response.status);
                        showAlert('Server Error', 'Unable to reach the login service. Please check if the server is running.', 'error');
                        return;
                    }
                    // Only log non-HTML parsing errors
                    console.error('Failed to parse response as JSON. Status:', response.status, 'Response:', text.substring(0, 200));
                    showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                    return;
                }
            } catch (parseError) {
                // If reading response fails, show a helpful error
                console.error('Failed to read response:', parseError, 'Status:', response.status);
                showAlert('Server Error', 'Unable to read server response. Please check your connection and try again.', 'error');
                return;
            }

            if (response.ok) {
                // Token is now stored in HttpOnly cookie automatically
                // No need to store in localStorage - cookie works across subdomains
                
                // Store user info in localStorage for UI display (optional)
                if (result.user_id) {
                    localStorage.setItem('user_id', result.user_id);
                }
                if (result.role) {
                    localStorage.setItem('role', result.role);
                }
                if (result.username) {
                    localStorage.setItem('username', result.username);
                }
                if (result.email) {
                    localStorage.setItem('email', result.email);
                }
                if (result.phone) {
                    localStorage.setItem('phone', result.phone);
                }

                showAlert('Success', 'Login successful!', 'success');
                setTimeout(() => {
                    // Use redirect_url directly from backend - never construct URLs in frontend
                    const redirectUrl = result.redirect_url;
                    
                    // Validate that redirect_url is a proper URL (safety check)
                    if (!redirectUrl || typeof redirectUrl !== 'string') {
                        console.error('Invalid redirect_url from server:', redirectUrl);
                        showAlert('Error', 'Invalid redirect URL received from server', 'error');
                        return;
                    }
                    
                    // Ensure it's a valid URL format
                    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://') && !redirectUrl.startsWith('/')) {
                        console.error('Invalid redirect_url format:', redirectUrl);
                        showAlert('Error', 'Invalid redirect URL format', 'error');
                        return;
                    }
                    
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                showAlert('Login Failed', result.error || 'Invalid credentials', 'error');
            }
        } catch (error) {
            console.error('Network Error:', error);
            showAlert('Connection Error', 'Failed to connect to the server. Please check your internet connection.', 'error');
        }
    });
}
