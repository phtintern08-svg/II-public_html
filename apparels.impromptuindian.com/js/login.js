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

        // ✅ FIX: Detect role from URL parameter or subdomain
        // Check URL parameter first (e.g., ?role=vendor)
        const urlParams = new URLSearchParams(window.location.search);
        let role = urlParams.get('role');
        
        // If no URL parameter, try to detect from subdomain or referrer
        if (!role) {
            const hostname = window.location.hostname;
            if (hostname.includes('vendor.')) {
                role = 'vendor';
            } else if (hostname.includes('rider.')) {
                role = 'rider';
            } else if (hostname.includes('admin.')) {
                role = 'admin';
            } else {
                // Default to customer if on main domain
                role = 'customer';
            }
        }

        try {
            const response = await ImpromptuIndianApi.fetch('/api/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, password, role })
            });

            // Check for 404 specifically (endpoint not found)
            if (response.status === 404) {
                console.error('Login endpoint not found (404). Check if the server route is properly configured.');
                showAlert('Server Error', 'Login service is not available. Please contact support or try again later.', 'error');
                return;
            }

            // Check for 500 explicitly - degrade to auth-style message so users don't see scary server errors
            if (response.status === 500) {
                showAlert('Login Failed', 'Email or password incorrect', 'error');
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
                    // Handle empty 401 response
                    if (response.status === 401) {
                        showAlert('Login Failed', 'Email or password incorrect', 'error');
                        return;
                    }
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
                    // For 401, show appropriate message even if JSON parsing fails
                    if (response.status === 401) {
                        showAlert('Login Failed', 'Email or password incorrect', 'error');
                        return;
                    }
                    showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                    return;
                }
            } catch (parseError) {
                // If reading response fails, show a helpful error
                console.error('Failed to read response:', parseError, 'Status:', response.status);
                // For 401, show appropriate message
                if (response.status === 401) {
                    showAlert('Login Failed', 'Email or password incorrect', 'error');
                    return;
                }
                showAlert('Server Error', 'Unable to read server response. Please check your connection and try again.', 'error');
                return;
            }

            // Handle 401 (Unauthorized) - authentication errors
            if (response.status === 401) {
                const errorMessage = result.message || result.error || 'Email or password incorrect';
                showAlert('Login Failed', errorMessage, 'error');
                return;
            }

            if (response.ok) {
                // 🔥 CRITICAL: Token is REQUIRED for all roles - fail fast if missing
                // Token is stored in HttpOnly cookie automatically (for subdomain SSO)
                // Also store in localStorage for frontend API calls
                // 🔥 CRITICAL: Validate token before storing (prevents "null" or "undefined" strings)
                if (result.token && 
                    typeof result.token === 'string' && 
                    result.token.trim() !== '' && 
                    result.token !== 'null' && 
                    result.token !== 'undefined' && 
                    result.token.length >= 20) {
                    localStorage.setItem('token', result.token);
                    console.log('✅ Token stored successfully', {
                        tokenLength: result.token.length,
                        role: result.role
                    });
                } else {
                    // 🔥 CRITICAL: Token is missing - this is a backend bug, show error and prevent login
                    console.error('❌ CRITICAL: Invalid or missing token received from server', {
                        tokenExists: !!result.token,
                        tokenType: typeof result.token,
                        tokenLength: result.token ? result.token.length : 0,
                        role: result.role,
                        responseKeys: Object.keys(result || {}),
                        fullResponse: result
                    });
                    showAlert(
                        'Login Error', 
                        'Server did not return a valid authentication token. Please contact support or try again.',
                        'error'
                    );
                    return; // 🔥 CRITICAL: Don't proceed without a valid token
                }
                
                // Store basic user info in localStorage for UI display
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

                // For customer role, fetch full profile details from database
                if (result.role === 'customer' && result.token) {
                    try {
                        const profileResponse = await ImpromptuIndianApi.fetch('/api/customer/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${result.token}`,
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include'  // Send cookies
                        });

                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            
                            // Store complete customer profile data from database
                            localStorage.setItem('customer_profile', JSON.stringify(profileData));
                            
                            // Update localStorage with fresh data from database
                            if (profileData.username) localStorage.setItem('username', profileData.username);
                            if (profileData.email) localStorage.setItem('email', profileData.email);
                            if (profileData.phone) localStorage.setItem('phone', profileData.phone);
                            if (profileData.bio) localStorage.setItem('bio', profileData.bio);
                            if (profileData.avatar_url) localStorage.setItem('avatar_url', profileData.avatar_url);
                            
                            console.log('Customer profile loaded from database:', profileData);
                        } else {
                            console.warn('Failed to fetch customer profile, using login response data');
                        }
                    } catch (profileError) {
                        console.error('Error fetching customer profile:', profileError);
                        // Continue with login even if profile fetch fails
                    }
                }

                // For vendor role, fetch full profile details from database
                if (result.role === 'vendor' && result.token) {
                    try {
                        const profileResponse = await ImpromptuIndianApi.fetch('/api/vendor/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${result.token}`,
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include'  // Send cookies
                        });

                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            
                            // Store complete vendor profile data from database
                            localStorage.setItem('vendor_profile', JSON.stringify(profileData));
                            
                            // Update localStorage with fresh data from database
                            if (profileData.username) localStorage.setItem('username', profileData.username);
                            if (profileData.email) localStorage.setItem('email', profileData.email);
                            if (profileData.phone) localStorage.setItem('phone', profileData.phone);
                            if (profileData.business_name) localStorage.setItem('business_name', profileData.business_name);
                            if (profileData.business_type) localStorage.setItem('business_type', profileData.business_type);
                            if (profileData.bio) localStorage.setItem('bio', profileData.bio);
                            if (profileData.avatar_url) localStorage.setItem('avatar_url', profileData.avatar_url);
                            if (profileData.address) localStorage.setItem('address', profileData.address);
                            if (profileData.city) localStorage.setItem('city', profileData.city);
                            if (profileData.state) localStorage.setItem('state', profileData.state);
                            if (profileData.pincode) localStorage.setItem('pincode', profileData.pincode);
                            
                            console.log('Vendor profile loaded from database:', profileData);
                        } else {
                            console.warn('Failed to fetch vendor profile, using login response data');
                        }
                    } catch (profileError) {
                        console.error('Error fetching vendor profile:', profileError);
                        // Continue with login even if profile fetch fails
                    }
                }

                // 🔥 CRITICAL: Verify token was actually saved before redirecting
                // This prevents race conditions where redirect happens before localStorage write completes
                const savedToken = localStorage.getItem('token');
                if (!savedToken || savedToken.length < 20) {
                    console.error('❌ CRITICAL: Token was not saved correctly before redirect!', {
                        savedToken: savedToken,
                        savedTokenLength: savedToken ? savedToken.length : 0,
                        originalToken: result.token ? result.token.substring(0, 20) + '...' : 'missing'
                    });
                    showAlert(
                        'Login Error', 
                        'Failed to save authentication token. Please try logging in again.',
                        'error'
                    );
                    return; // Don't redirect if token wasn't saved
                }
                
                console.log('✅ Token verified in localStorage before redirect', {
                    tokenLength: savedToken.length,
                    role: result.role
                });
                
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
                    
                    // 🔥 CRITICAL: Final verification before redirect
                    const finalTokenCheck = localStorage.getItem('token');
                    if (!finalTokenCheck || finalTokenCheck.length < 20) {
                        console.error('❌ CRITICAL: Token missing right before redirect!', {
                            token: finalTokenCheck,
                            tokenLength: finalTokenCheck ? finalTokenCheck.length : 0
                        });
                        showAlert(
                            'Login Error', 
                            'Authentication token was lost. Please try logging in again.',
                            'error'
                        );
                        return; // Don't redirect if token is missing
                    }
                    
                    // 🔥 FIX: Pass token via URL parameter for cross-subdomain localStorage transfer
                    // localStorage is isolated per subdomain, so we need to pass token in URL
                    let finalRedirectUrl = redirectUrl;
                    
                    // Handle both absolute and relative URLs
                    if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
                        const url = new URL(redirectUrl);
                        url.searchParams.set('token', finalTokenCheck);
                        url.searchParams.set('user_id', result.user_id || '');
                        url.searchParams.set('role', result.role || '');
                        finalRedirectUrl = url.toString();
                    } else {
                        // Relative URL - append query params
                        const separator = redirectUrl.includes('?') ? '&' : '?';
                        finalRedirectUrl = `${redirectUrl}${separator}token=${encodeURIComponent(finalTokenCheck)}&user_id=${result.user_id || ''}&role=${result.role || ''}`;
                    }
                    
                    console.log('✅ Redirecting to:', finalRedirectUrl);
                    window.location.href = finalRedirectUrl;
                }, 1000);
            } else {
                // Handle non-401 errors (shouldn't reach here for 401, but just in case)
                const errorMessage = result.message || result.error || 'Email or password incorrect';
                showAlert('Login Failed', errorMessage, 'error');
            }
        } catch (error) {
            console.error('Network Error:', error);
            showAlert('Connection Error', 'Failed to connect to the server. Please check your internet connection.', 'error');
        }
    });
}
