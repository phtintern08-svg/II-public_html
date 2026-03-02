// Vendor Verification Page JavaScript - Version 2
console.log('Vendor Verification JS v5 loaded');
lucide.createIcons();

/* ---------------------------
   VALIDATION RULES
---------------------------*/
const VALIDATION_RULES = {
    pan_number: {
        pattern: /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/,
        validate: (value) => {
            const cleaned = value.replace(/\s/g, '').toUpperCase();
            // Check length
            if (cleaned.length !== 10) return false;
            // Check format: AAAAA9999A (5 letters, 4 digits, 1 letter)
            // First 3: Alphabetic series, 4th: Entity type, 5th: First letter of surname, 6-9: Digits, 10th: Check digit
            const panPattern = /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/;
            return panPattern.test(cleaned);
        },
        format: (value) => {
            // Remove spaces and convert to uppercase
            return value.replace(/\s/g, '').toUpperCase().slice(0, 10);
        },
        message: 'PAN must be exactly 10 characters: 3 letters (series) + 1 entity type (P/C/H/F/A/T/B/L/J/G) + 1 letter (surname) + 4 digits + 1 letter (check digit)'
    },
    aadhar_number: {
        pattern: /^[2-9]\d{11}$/,
        validate: (value) => {
            const cleaned = value.replace(/\s/g, '').replace(/-/g, '');
            // Check length
            if (cleaned.length !== 12) return false;
            // Check all digits
            if (!/^\d{12}$/.test(cleaned)) return false;
            // Check first digit is between 2-9 (cannot start with 0 or 1)
            if (!/^[2-9]/.test(cleaned)) return false;
            return true;
        },
        format: (value) => {
            // Remove spaces, hyphens, and keep only digits
            const cleaned = value.replace(/[\s-]/g, '').replace(/\D/g, '').slice(0, 12);
            // Return clean value without spaces for storage
            return cleaned;
        },
        message: 'Aadhaar must be exactly 12 digits and cannot start with 0 or 1'
    },
    bank_account_number: {
        pattern: /^\d{8,18}$/,
        validate: (value) => {
            const cleaned = value.replace(/\s/g, '');
            // Check numeric only
            if (!/^\d+$/.test(cleaned)) return false;
            // Check length between 8-18 digits
            if (cleaned.length < 8 || cleaned.length > 18) return false;
            return true;
        },
        format: (value) => {
            // Remove spaces and keep only digits
            return value.replace(/\D/g, '');
        },
        message: 'Account number must be 8 to 18 digits (numeric only)'
    },
    bank_holder_name: {
        pattern: /^[A-Za-z\s]+$/,
        validate: (value) => {
            return /^[A-Za-z\s]+$/.test(value.trim()) && value.trim().length > 0;
        },
        format: (value) => {
            // Keep only alphabets and spaces
            return value.replace(/[^A-Za-z\s]/g, '');
        },
        message: 'Account holder name must contain only alphabets'
    },
    bank_branch: {
        pattern: /^[A-Za-z\s]+$/,
        validate: (value) => {
            return /^[A-Za-z\s]+$/.test(value.trim()) && value.trim().length > 0;
        },
        format: (value) => {
            // Keep only alphabets and spaces
            return value.replace(/[^A-Za-z\s]/g, '');
        },
        message: 'Branch name must contain only alphabets'
    },
    ifsc_code: {
        pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        validate: (value) => {
            const cleaned = value.replace(/\s/g, '').toUpperCase();
            // Check length
            if (cleaned.length !== 11) return false;
            // Check structure: 4 letters (bank), 0, 6 alphanumeric (branch)
            const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            return ifscPattern.test(cleaned);
        },
        format: (value) => {
            // Remove spaces and convert to uppercase, keep only alphanumeric
            return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11);
        },
        message: 'IFSC must be exactly 11 characters: 4 letters (bank), 0, 6 alphanumeric (branch)'
    },
    gst_number: {
        pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        validate: (value) => {
            const cleaned = value.replace(/\s/g, '').toUpperCase();
            // Check length
            if (cleaned.length !== 15) return false;
            // Check structure: 2 digits (state) + 5 letters (PAN) + 4 digits + 1 letter + 1 alphanumeric (not 0) + Z + 1 alphanumeric
            const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            return gstPattern.test(cleaned);
        },
        format: (value) => {
            // Remove spaces and convert to uppercase
            return value.replace(/\s/g, '').toUpperCase().slice(0, 15);
        },
        message: 'GST must be exactly 15 characters: 2 digits (state) + 5 letters (PAN) + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric'
    },
    business_registration_number: {
        pattern: /^[A-Z0-9]{6,21}$/,
        validate: (value) => {
            const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
            // Check alphanumeric
            if (!/^[A-Z0-9]+$/.test(cleaned)) return false;
            // Check length (typically 21 for CIN, but can vary)
            if (cleaned.length < 6 || cleaned.length > 21) return false;
            return true;
        },
        format: (value) => {
            // Remove spaces and hyphens, convert to uppercase
            return value.replace(/[\s-]/g, '').toUpperCase();
        },
        message: 'Business registration number must be 6-21 alphanumeric characters'
    }
};

// Validation function to apply to inputs
function validateField(fieldName, value) {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule) return { valid: true, message: '' };
    
    const isValid = rule.validate(value);
    return {
        valid: isValid,
        message: isValid ? '' : rule.message
    };
}

// Format field value as user types
function formatFieldValue(fieldName, value) {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule || !rule.format) return value;
    return rule.format(value);
}

// Expose validation functions to global scope for inline handlers
window.validateField = validateField;
window.formatFieldValue = formatFieldValue;

/* ---------------------------
   DOCUMENT TYPES
---------------------------*/
const REQUIRED_DOCUMENTS = [
    { id: 'pan', label: 'PAN Card', icon: 'credit-card', required: true, extraFields: [{ name: 'pan_number', placeholder: 'Enter PAN Number' }] },
    { id: 'aadhar', label: 'Aadhar Card', icon: 'id-card', required: true, extraFields: [{ name: 'aadhar_number', placeholder: 'Enter Aadhaar Number' }] },
    { id: 'gst', label: 'GST Certificate', icon: 'file-text', required: true, extraFields: [{ name: 'gst_number', placeholder: 'Enter GST Number' }] },
    { id: 'business', label: 'Business Registration', icon: 'building-2', required: true, extraFields: [{ name: 'business_registration_number', placeholder: 'Enter Business Registration Number' }] },
    {
        id: 'bank', label: 'Bank Proof', icon: 'landmark', required: true,
        extraFields: [
            { name: 'bank_account_number', placeholder: 'Account Number', type: 'text', width: 'full' },
            { name: 'bank_holder_name', placeholder: 'Account Holder Name', type: 'text', width: 'full' },
            { name: 'bank_branch', placeholder: 'Branch Name', type: 'text', width: 'half' },
            { name: 'ifsc_code', placeholder: 'IFSC Code', type: 'text', width: 'half' }
        ]
    },
    { id: 'workshop', label: 'Workshop Images', icon: 'image', required: true },
    { id: 'signature', label: 'Signature', icon: 'pen-tool', required: true }
];

/* ... skip ... */

/* ---------------------------
   DOCUMENTS GRID
---------------------------*/
function renderDocumentsGrid() {
    const grid = document.getElementById('documents-grid');
    if (!grid) return;

    grid.innerHTML = REQUIRED_DOCUMENTS.map(docType => {
        const doc = documents[docType.id] || { status: 'pending' };
        const status = doc.status || 'pending';
        let statusLabel = 'Pending';
        let statusIcon = 'circle';

        if (status === 'uploaded') { statusLabel = 'Uploaded'; statusIcon = 'check-circle'; }
        else if (status === 'approved') { statusLabel = 'Approved'; statusIcon = 'check-circle-2'; }
        else if (status === 'rejected') { statusLabel = 'Rejected'; statusIcon = 'x-circle'; }

        // Upload allowed: not-submitted → all docs; rejected → ONLY rejected docs
        let canUpload = false;
        if (verificationStatus === 'not-submitted') {
            canUpload = true;
        } else if (verificationStatus === 'rejected') {
            canUpload = status === 'rejected';
        }

        let extraInputsHtml = '';
        if (docType.extraFields) {
            extraInputsHtml = `<div class="grid grid-cols-2 gap-3 mt-3">`;

            extraInputsHtml += docType.extraFields.map(field => {
                const val = doc[field.name] || '';
                const colSpan = field.width === 'half' ? 'col-span-1' : 'col-span-2';

                const isUploaded = (status === 'uploaded' || status === 'approved');
                const isRejected = (status === 'rejected');
                const shouldHide = isUploaded && !isRejected;

                const displayStyle = shouldHide ? 'display: none !important;' : 'display: block !important;';
                const disabled = !canUpload ? 'disabled' : '';

                // Get validation rule for this field
                const validationRule = VALIDATION_RULES[field.name];
                const maxLength = field.name === 'pan_number' ? 10 : 
                                 field.name === 'aadhar_number' ? 12 : 
                                 field.name === 'gst_number' ? 15 :
                                 field.name === 'ifsc_code' ? 11 :
                                 field.name === 'business_registration_number' ? 21 :
                                 field.name === 'bank_account_number' ? 18 : '';
                
                // Determine input type
                const inputType = (field.name === 'aadhar_number' || field.name === 'bank_account_number') ? 'tel' : 'text';
                
                // For Aadhaar, add inputmode for mobile keyboards
                const inputMode = field.name === 'aadhar_number' ? 'numeric' : 
                                 field.name === 'bank_account_number' ? 'numeric' : '';
                
                const inputPattern = validationRule ? validationRule.pattern.source : '';
                
                // Special handling for Aadhaar - add helper text about masking
                const helperText = field.name === 'aadhar_number' ? 
                    '<p class="text-xs text-gray-500 mt-1">Format: NNNN NNNN NNNN (first digit must be 2-9)</p>' : '';
                
                return `
                    <div class="${colSpan}" style="${displayStyle}">
                        <label class="text-xs text-gray-400 block mb-1 uppercase tracking-wider">${field.placeholder}</label>
                        <input type="${inputType}" 
                               ${inputMode ? `inputmode="${inputMode}"` : ''}
                               id="input-${docType.id}-${field.name}" 
                               class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors validation-input"
                               style="${displayStyle}"
                               placeholder="${field.placeholder}"
                               value="${val}"
                               ${maxLength ? `maxlength="${maxLength}"` : ''}
                               ${inputPattern ? `pattern="${inputPattern}"` : ''}
                               oninput="window.handleFieldInput('${docType.id}', '${field.name}', this)"
                               onblur="window.validateFieldInput('${docType.id}', '${field.name}', this)"
                               ${disabled}
                        >
                        ${helperText}
                        <span id="error-${docType.id}-${field.name}" class="text-red-400 text-xs mt-1 hidden block"></span>
                    </div>
                `;
            }).join('');

            extraInputsHtml += `</div>`;
        }

        return `
            <div class="document-card ${status}">
                <div class="document-header">
                    <div class="document-icon">
                        <i data-lucide="${docType.icon}"></i>
                    </div>
                    <div class="flex-1">
                        <h4>${docType.label}</h4>
                        ${docType.required
                ? `<span class="required-badge">Required</span>`
                : `<span class="optional-badge">Optional</span>`}
                    </div>
                </div>

                <div class="document-body">
                    <div class="document-status ${status}">
                        <i data-lucide="${statusIcon}"></i>
                        <span>${statusLabel}</span>
                    </div>
                    
                     ${status === 'rejected' && (doc.remarks || doc.adminRemarks) ? `
                        <div class="rejection-box">
                            <div class="rejection-header">
                                <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                                <span>Action Required</span>
                            </div>
                            <p class="rejection-text">${doc.remarks || doc.adminRemarks}</p>
                        </div>
                    ` : ''}

                    ${doc.fileName ? `
                        <div class="document-file">
                            <i data-lucide="file"></i>
                            <span class="file-name">${doc.fileName}</span>
                            ${canUpload ? `
                                <button class="btn-icon-sm text-red-400 hover:text-red-300 ml-2" onclick="removeDocument('${docType.id}')" title="Delete">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- Extra Inputs Section -->
                    ${extraInputsHtml}

                </div>

                <div class="document-actions">
                    ${canUpload ? `
                        <button class="${status === 'rejected' ? 'btn-reupload' : 'btn-upload'}" onclick="openUploadModal('${docType.id}')">
                            <i data-lucide="${status === 'rejected' ? 'refresh-cw' : 'upload'}"></i> ${status === 'rejected' ? 'Re-upload Document' : 'Upload'}
                        </button>
                    ` : ''}

                    ${doc.fileUrl && status !== 'pending' ? `
                        <button class="btn-view" onclick="viewDocument('${docType.id}')">
                            <i data-lucide="eye"></i> View
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

/* ... skip ... */

/* ---------------------------
   SUBMIT VERIFICATION
---------------------------*/
async function submitVerification() {
    // Validate required documents
    const missing = REQUIRED_DOCUMENTS.filter(doc =>
        doc.required && (!documents[doc.id] || documents[doc.id].status === 'pending')
    );

    if (missing.length > 0) {
        showToast(`Upload all required documents (${missing.length} missing)`, 'error');
        return;
    }

    // Validate Extra Fields
    let missingExtras = [];
    let invalidFields = [];
    let extraData = {};

    REQUIRED_DOCUMENTS.forEach(doc => {
        if (doc.extraFields) {
            doc.extraFields.forEach(field => {
                const inputId = `input-${doc.id}-${field.name}`;
                const el = document.getElementById(inputId);
                let val = '';
                
                if (el) {
                    val = el.value.trim();
                } else if (documents[doc.id] && documents[doc.id][field.name]) {
                    // Fallback to state if input empty (e.g. if hidden but value present in state)
                    val = documents[doc.id][field.name];
                }
                
                if (val) {
                    // Validate the value
                    const validation = window.validateField(field.name, val);
                    if (!validation.valid) {
                        invalidFields.push(`${doc.label}: ${field.placeholder} - ${validation.message}`);
                    } else {
                        // Format the value before storing
                        extraData[field.name] = window.formatFieldValue(field.name, val);
                    }
                } else {
                    // Only mark missing if absolutely no data
                    missingExtras.push(`${doc.label}: ${field.placeholder}`);
                }
            });
        }
    });

    if (missingExtras.length > 0) {
        showToast(`Please fill in details for: ${missingExtras.join(', ')}`, 'error');
        return;
    }
    
    if (invalidFields.length > 0) {
        showToast(`Invalid format: ${invalidFields.join('; ')}`, 'error');
        return;
    }

    try {
        // ✅ FIX: Removed vendor_id from payload - backend uses request.user_id from JWT token
        // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
        const payload = {
            ...extraData
        };

        const response = await ImpromptuIndianApi.fetch('/api/vendor/verification/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to submit verification' }));
            showToast(errorData.error || 'Failed to submit verification', 'error');
            return;
        }

        showToast('Verification submitted successfully!', 'success');

        // 🔥 CRITICAL: Re-fetch status from backend - UI must sync with DB (pending)
        // fetchVerificationStatus() handles locking (pointer-events-none, submit disabled)
        await fetchVerificationStatus();

    } catch (e) {
        console.error(e);
        showToast('Error submitting verification', 'error');
    }
}

/* ---------------------------
   CONSTANTS FOR QUOTATION
---------------------------*/
const CATEGORY_MAP = {
    "T-Shirt": [
        { label: "Regular Fit" },
        { label: "Oversized Fit" },
        { label: "Polo T-Shirt" },
        { label: "Full Sleeve" },
    ],
    Hoodie: [
        { label: "Pullover Hoodie" },
        { label: "Zipper Hoodie" },
        { label: "Oversized Hoodie" },
    ],
    Jacket: [
        { label: "Zipper Jacket" },
        { label: "Bomber Jacket" },
        { label: "Windcheater" },
    ],
    Sweatshirt: [
        { label: "Crewneck Sweatshirt" },
        { label: "Oversized Sweatshirt" },
        { label: "Fleece Sweatshirt" },
    ],
    Cap: [
        { label: "Baseball Cap" },
        { label: "Dad Cap" },
        { label: "Trucker Cap" },
        { label: "Snapback Cap" },
    ],
    Shirt: [
        { label: "Formal Shirt" },
        { label: "Casual Shirt" },
        { label: "Oversized Shirt" },
        { label: "Checkered Shirt" },
    ],
};

const NECK_TYPE_MAP = {
    "Regular Fit": [{ label: "Crew Neck" }, { label: "V-Neck" }, { label: "Henley Neck" }, { label: "Round Neck" }],
    "Oversized Fit": [{ label: "Crew Neck" }, { label: "Round Neck" }, { label: "Henley Neck" }],
    "Full Sleeve": [{ label: "Crew Neck" }, { label: "V-Neck" }, { label: "Round Neck" }, { label: "Henley Neck" }, { label: "Polo Collar Neck" }],
    "Polo T-Shirt": [{ label: "Classic Polo Collar (Standard)" }, { label: "Zip Polo Collar" }, { label: "Mandarin Collar Polo" }],
    "Formal Shirt": [{ label: "Point Collar" }, { label: "Spread Collar" }, { label: "Cutaway Collar" }, { label: "Button-Down Collar" }],
    "Casual Shirt": [{ label: "Cuban Collar" }, { label: "Button-Down Collar" }, { label: "Point Collar" }],
    "Oversized Shirt": [{ label: "Point Collar" }, { label: "Cuban Collar" }],
    "Checkered Shirt": [{ label: "Button-Down Collar" }, { label: "Point Collar" }],
    "Pullover Hoodie": [{ label: "None" }],
    "Zipper Hoodie": [{ label: "None" }],
    "Oversized Hoodie": [{ label: "None" }],
    "Zipper Jacket": [{ label: "None" }],
    "Bomber Jacket": [{ label: "None" }],
    "Windcheater": [{ label: "None" }],
    "Crewneck Sweatshirt": [{ label: "None" }],
    "Oversized Sweatshirt": [{ label: "None" }],
    "Fleece Sweatshirt": [{ label: "None" }],
    "Baseball Cap": [{ label: "None" }],
    "Dad Cap": [{ label: "None" }],
    "Trucker Cap": [{ label: "None" }],
    "Snapback Cap": [{ label: "None" }]
};

const PRODUCT_DETAILS = {
    "T-Shirt": { fabric: "Cotton", notes: "Standard Tee" },
    "Hoodie": { fabric: "Fleece", notes: "Standard Hoodie" },
    "Jacket": { fabric: "Polyester", notes: "Standard Jacket" },
    "Sweatshirt": { fabric: "Fleece", notes: "Standard Sweatshirt" },
    "Cap": { fabric: "Cotton", notes: "Standard Cap" },
    "Shirt": { fabric: "Cotton", notes: "Standard Shirt" }
};

/* ---------------------------
   STATE
---------------------------*/
let verificationStatus = 'not-submitted';
let documents = {};
let currentDocumentId = null;
let selectedFile = null;
// ✅ FIX: Removed vendorId - backend uses request.user_id from JWT token

/* ---------------------------
   FETCH VERIFICATION STATUS
---------------------------*/
async function fetchVerificationStatus() {
    // ✅ FIX: Removed vendorId check - backend uses request.user_id from JWT token
    const submitSection = document.getElementById('submit-section');
    const submitBtn = document.getElementById('submit-btn');

    if (submitSection) {
        submitSection.style.display = 'flex';
        submitSection.classList.add('show'); // Force visibility
    }

    try {
        // ✅ FIX: Backend route doesn't accept vendorId in URL - uses request.user_id from JWT
        // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
        
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/verification/status`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (response.ok) {

            const data = await response.json();
            verificationStatus = data.status;
            documents = data.documents || {};

            // Ensure every required doc exists
            REQUIRED_DOCUMENTS.forEach(doc => {
                if (!documents[doc.id]) {
                    documents[doc.id] = { status: 'pending', fileName: null, fileUrl: null };
                }
            });

            renderStatusBanner();
            renderTimeline();
            renderDocumentsGrid();

            /** ---------------------------
                CONTROL SUBMIT BUTTON TEXT
            ----------------------------*/
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');

                if (verificationStatus === 'not-submitted' || verificationStatus === 'rejected') {
                    submitBtn.textContent = 'Submit for Verification';
                }
                else if (verificationStatus === 'pending') {
                    submitBtn.textContent = 'Documents Submitted – Awaiting Review';
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    const documentsGrid = document.getElementById('documents-grid');
                    if (documentsGrid) {
                        documentsGrid.classList.add('pointer-events-none', 'opacity-50');
                    }
                }
                else if (verificationStatus === 'approved') {
                    submitBtn.textContent = 'Verification Completed';
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    freezeVerificationUI();
                }
            }

            // Show Quotation section only when approved
            if (verificationStatus === 'approved') {
                document.getElementById('quotation-section').classList.remove('hidden');
                fetchQuotationStatus();
            }
        }

    } catch (e) {
        console.error('Error fetching status:', e);
    }
}

function freezeVerificationUI() {
    // Disable actions but DO NOT HIDE submit button section
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Documents Submitted – Awaiting Review';
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Disable document interactions
    const documentsGrid = document.getElementById('documents-grid');
    if (documentsGrid) {
        documentsGrid.classList.add('pointer-events-none', 'opacity-50');
    }

    // Remove upload/remove buttons
    const interactive = document.querySelectorAll('.btn-upload, .btn-remove-icon');
    interactive.forEach(btn => btn.remove());
}

/* ---------------------------
   QUOTATION STATUS
---------------------------*/
async function fetchQuotationStatus() {
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    
    try {
        // ✅ FIX: Backend route doesn't accept vendorId in URL - uses request.user_id from JWT
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/quotation/status`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        const data = await response.json();
        const section = document.getElementById('quotation-section');

        if (!data.submitted) return;

        const btn = section.querySelector('button[onclick="submitQuotation()"]');

        if (data.status === 'pending') {
            btn.textContent = 'Quotation Submitted - Pending Review';
            btn.disabled = true;
            disableQuotationInputs();
        }
        else if (data.status === 'approved') {
            section.innerHTML = `
                <div class="bg-gray-800 rounded-xl p-8 border border-green-500/30 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                        <i data-lucide="check-circle" class="w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Account Fully Activated!</h2>
                    <p class="text-gray-400 mb-6">Your quotation is approved. You can now receive orders.</p>
                    <a href="dashboard.html" class="btn-primary inline-flex items-center gap-2">
                        <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Go to Dashboard
                    </a>
                </div>
            `;
            lucide.createIcons();
        }
        else if (data.status === 'rejected') {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6';
            alertDiv.innerHTML = `<strong>Quotation Rejected:</strong> ${data.admin_remarks || 'Please re-submit.'}`;
            section.querySelector('.bg-gray-800').prepend(alertDiv);
        }

    } catch (e) {
        console.error('Error fetching quotation status:', e);
    }
}

function disableQuotationInputs() {
    document.getElementById('quotation-commission').disabled = true;
    document.getElementById('quotation-file').disabled = true;
    document.getElementById('quotation-dropzone').classList.add('opacity-50', 'pointer-events-none');
}

/* ---------------------------
   QUOTATION TEMPLATE GENERATOR — AUTOMATED
---------------------------*/
function downloadQuotationTemplate() {
    const sizes = ["S", "M", "L", "XL", "XXL"];

    let csvRows = ["Product Type,Category,Neck Type,Fabric,Size,Base Cost,Notes"];

    for (let product in CATEGORY_MAP) {
        CATEGORY_MAP[product].forEach(cat => {

            const neckTypes = NECK_TYPE_MAP[cat.label] || [{ label: "None" }];

            neckTypes.forEach(neck => {
                sizes.forEach(size => {

                    csvRows.push([
                        product,
                        cat.label,
                        neck.label,
                        PRODUCT_DETAILS[product]?.fabric || "",
                        size,
                        "",  // Let user fill price
                        PRODUCT_DETAILS[product]?.notes || ""
                    ].join(","));
                });
            });
        });
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));

    const a = document.createElement("a");
    a.href = csvContent;
    a.download = "quotation_template.csv";
    a.click();
}

const quotationDropzone = document.getElementById('quotation-dropzone');
const quotationInput = document.getElementById('quotation-file');
const quotationFilename = document.getElementById('quotation-filename');

if (quotationDropzone) {
    quotationDropzone.onclick = () => quotationInput.click();
    quotationInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate CSV file type
            const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
            const fileExtension = file.name.toLowerCase().split('.').pop();
            
            const isValidType = allowedTypes.includes(file.type) || fileExtension === 'csv';
            
            if (!isValidType) {
                showToast('Only CSV files are allowed for quotation submission', 'error');
                quotationInput.value = ''; // Clear the input
                quotationFilename.textContent = 'Click to upload or drag and drop';
                quotationFilename.classList.remove('text-blue-400');
                return;
            }
            
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                showToast('File size must be under 10MB', 'error');
                quotationInput.value = ''; // Clear the input
                quotationFilename.textContent = 'Click to upload or drag and drop';
                quotationFilename.classList.remove('text-blue-400');
                return;
            }
            
            quotationFilename.textContent = file.name;
            quotationFilename.classList.add('text-blue-400');
        }
    };
}

/* ---------------------------
   SUBMIT QUOTATION
---------------------------*/
async function submitQuotation() {
    const file = quotationInput.files[0];

    // Client-side validation
    if (!file) {
        showToast('Please upload quotation file', 'error');
        return;
    }
    
    // Validate CSV file type
    const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = allowedTypes.includes(file.type) || fileExtension === 'csv';
    
    if (!isValidType) {
        showToast('Only CSV files are allowed for quotation submission', 'error');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be under 10MB', 'error');
        return;
    }

    // ✅ FIX: Removed vendor_id from formData - backend uses request.user_id from JWT token
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const btn = document.querySelector('button[onclick="submitQuotation()"]');
        btn.textContent = "Submitting...";
        btn.disabled = true;

        const response = await ImpromptuIndianApi.fetch('/api/vendor/quotation/submit', {
            method: 'POST',
            headers: {
                // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
            },
            credentials: 'include',  // Ensure cookies are sent
            body: formData
        });

        if (response.ok) {
            showToast('Quotation submitted!', 'success');
            setTimeout(() => location.reload(), 1200);
        }
        else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to submit quotation' }));
            showToast(errorData.error || 'Failed to submit', 'error');
            btn.disabled = false;
            btn.textContent = "Submit Quotation";
        }

    } catch (e) {
        console.error('Quotation submit error:', e);
        showToast('Error submitting quotation', 'error');
        const btn = document.querySelector('button[onclick="submitQuotation()"]');
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Submit Quotation";
        }
    }
}

/* ---------------------------
   STATUS BANNER
---------------------------*/
function renderStatusBanner() {
    const banner = document.getElementById('status-banner');
    if (!banner) return;

    const banners = {
        'not-submitted': `
            <div class="status-banner status-warning">
                <i data-lucide="alert-circle"></i>
                <div class="flex-1">
                    <h4 class="status-title">Verification Not Submitted</h4>
                    <p class="status-description">Upload all required documents to proceed.</p>
                </div>
            </div>
        `,
        'pending': `
            <div class="status-banner status-info">
                <i data-lucide="clock"></i>
                <div class="flex-1">
                    <h4 class="status-title">Verification Pending</h4>
                    <p class="status-description">Waiting for admin review.</p>
                </div>
            </div>
        `,
        'approved': `
            <div class="status-banner status-success">
                <i data-lucide="check-circle-2"></i>
                <div class="flex-1">
                    <h4 class="status-title">Verification Approved!</h4>
                    <p class="status-description">You can now receive orders.</p>
                </div>
            </div>
        `,
        'rejected': `
            <div class="status-banner status-error">
                <i data-lucide="x-circle"></i>
                <div class="flex-1">
                    <h4 class="status-title">Verification Rejected</h4>
                    <p class="status-description">Some documents were rejected.</p>
                </div>
            </div>
        `
    };

    // Fallback for unexpected status – treat as pending
    const html = banners[verificationStatus] || banners['pending'];
    banner.innerHTML = html;
    lucide.createIcons();
}

/* ---------------------------
   TIMELINE RENDER
---------------------------*/
function renderTimeline() {
    const timeline = document.getElementById('verification-timeline');
    if (!timeline) return;

    // Determine final step label and id based on status
    let finalStepLabel = 'Approved';
    let finalStepId = 'approved';
    if (verificationStatus === 'rejected') {
        finalStepLabel = 'Rejected';
        finalStepId = 'rejected';
    }

    const steps = [
        { id: 'submit', label: 'Documents Submitted', status: getStepStatus('submit') },
        { id: 'review', label: 'Under Review', status: getStepStatus('review') },
        { id: finalStepId, label: finalStepLabel, status: getStepStatus(finalStepId) }
    ];

    timeline.innerHTML = steps.map((step, index) => `
        <div class="timeline-item ${step.status}">
            <div class="timeline-marker">
                ${step.status === 'completed' ? '<i data-lucide="check"></i>' :
            step.status === 'current' ? '<div class="timeline-pulse"></div>' :
                step.status === 'rejected' ? '<i data-lucide="x"></i>' :
                    '<div class="timeline-dot"></div>'}
            </div>
            <div class="timeline-content">
                <p class="timeline-label">${step.label}</p>
            </div>
            ${index < steps.length - 1 ? '<div class="timeline-line"></div>' : ''}
        </div>
    `).join('');

    lucide.createIcons();
}

function getStepStatus(stepId) {
    if (verificationStatus === 'approved') return 'completed';

    if (stepId === 'submit') {
        return ['pending', 'approved', 'rejected'].includes(verificationStatus) ? 'completed' : 'pending';
    }
    if (stepId === 'review') {
        if (verificationStatus === 'pending') return 'current';
        if (['approved', 'rejected'].includes(verificationStatus)) return 'completed';
        return 'pending';
    }
    if (stepId === 'approved') {
        return verificationStatus === 'approved' ? 'completed' : 'pending';
    }
    if (stepId === 'rejected') {
        // Use 'rejected' status class if styling exists, otherwise 'current' or 'error'
        return verificationStatus === 'rejected' ? 'rejected' : 'pending';
    }

    return 'pending';
}

/* ---------------------------
   DOCUMENTS GRID
---------------------------*/


function getStatusIcon(status) {
    return {
        pending: "circle",
        uploaded: "upload-cloud",
        approved: "check-circle",
        rejected: "x-circle"
    }[status] || "circle";
}

function getStatusLabel(status) {
    return {
        pending: "Pending Upload",
        uploaded: "Uploaded",
        approved: "Approved",
        rejected: "Rejected - Reupload"
    }[status] || "Pending";
}

/* ---------------------------
   UPLOAD MODAL
---------------------------*/
function openUploadModal(docId) {
    const doc = documents[docId];
    const status = doc?.status || 'pending';

    // Block if not allowed (prevents console/DOM bypass)
    if (
        verificationStatus === 'pending' ||
        verificationStatus === 'approved' ||
        (verificationStatus === 'rejected' && status !== 'rejected')
    ) {
        showToast('This document cannot be modified.', 'error');
        return;
    }

    const docDef = REQUIRED_DOCUMENTS.find(d => d.id === docId);

    // Validate manual fields if any
    let missingFields = [];
    let invalidFields = [];
    if (docDef && docDef.extraFields) {
        docDef.extraFields.forEach(field => {
            const inputId = `input-${docId}-${field.name}`;
            const el = document.getElementById(inputId);
            // Check value from DOM or State
            // (If hidden, it should be in state? But user is "uploading", so fields should be visible and NOT hidden yet).
            // So we check DOM value mostly.
            let val = '';
            if (el) val = el.value.trim();
            if (!val && documents[docId] && documents[docId][field.name]) {
                val = documents[docId][field.name];
            }

            if (!val) {
                missingFields.push(field.placeholder);
            } else {
                // Validate the value
                const validation = window.validateField(field.name, val);
                if (!validation.valid) {
                    invalidFields.push(`${field.placeholder}: ${validation.message}`);
                }
            }
        });
    }

    if (missingFields.length > 0) {
        showToast(`Please enter ${missingFields.join(', ')} before uploading`, 'error');
        return;
    }
    
    if (invalidFields.length > 0) {
        showToast(`Invalid format: ${invalidFields.join('; ')}`, 'error');
        return;
    }

    currentDocumentId = docId;
    selectedFile = null;

    const modal = document.getElementById('upload-modal');
    const modalTitle = document.getElementById('modal-doc-title');
    const filePreview = document.getElementById('file-preview');

    const docType = REQUIRED_DOCUMENTS.find(d => d.id === docId);

    modalTitle.textContent = `Upload ${docType.label}`;
    filePreview.classList.add('hidden');
    filePreview.innerHTML = '';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');

    fileInput.value = '';
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);

    uploadArea.onclick = () => fileInput.click();

    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    };
    uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFileSelect(e.dataTransfer.files[0]);
    };
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedFile = null;
    currentDocumentId = null;
}

function handleFileSelect(file) {
    if (!file) return;

    // Validate file size (2.2MB limit - allows for metadata/EXIF)
    if (file.size > 2.2 * 1024 * 1024) {
        showToast('File size must be under 2.2MB', 'error');
        return;
    }

    // Validate file type (PDF, JPG, JPEG only)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg'];
    
    // Check both MIME type and file extension
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
    
    if (!isValidType) {
        showToast('Only PDF, JPG, and JPEG files are allowed', 'error');
        return;
    }

    selectedFile = file;

    const filePreview = document.getElementById('file-preview');
    filePreview.innerHTML = `
        <div class="preview-item">
            <i data-lucide="file-check" class="w-8 h-8 text-green-500"></i>
            <div>
                <p class="preview-filename">${file.name}</p>
                <p class="preview-filesize">${(file.size / 1024).toFixed(1)} KB</p>
            </div>
        </div>
    `;

    filePreview.classList.remove('hidden');
    lucide.createIcons();
}

/* ---------------------------
   CONFIRM UPLOAD
---------------------------*/
/* ---------------------------
   STATE MANAGEMENT
---------------------------*/
window.updateExtraField = function (docId, fieldName, value) {
    if (!documents[docId]) documents[docId] = { status: 'pending' };
    documents[docId][fieldName] = value;
};

// Handle field input with formatting
window.handleFieldInput = function (docId, fieldName, inputElement) {
    const originalValue = inputElement.value;
    let displayValue = originalValue;
    let storedValue = originalValue;
    
    // Special handling for Aadhaar - format with spaces while typing
    if (fieldName === 'aadhar_number') {
        // Remove all non-digits
        const cleaned = originalValue.replace(/\D/g, '');
        storedValue = cleaned; // Store without spaces
        
        // Format for display: NNNN NNNN NNNN
        if (cleaned.length > 0) {
            if (cleaned.length <= 4) {
                displayValue = cleaned;
            } else if (cleaned.length <= 8) {
                displayValue = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
            } else {
                displayValue = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
            }
        } else {
            displayValue = '';
        }
    } else {
        // For other fields, use standard formatting
        storedValue = window.formatFieldValue(fieldName, originalValue);
        displayValue = storedValue;
    }
    
    // Update input value if formatting changed it
    if (displayValue !== originalValue) {
        // Save cursor position
        const cursorPos = inputElement.selectionStart;
        inputElement.value = displayValue;
        
        // Restore cursor position (adjust for added spaces in Aadhaar)
        if (fieldName === 'aadhar_number' && cursorPos > 0) {
            const beforeCursor = originalValue.substring(0, cursorPos);
            const digitsBefore = beforeCursor.replace(/\D/g, '').length;
            let newPos = digitsBefore;
            // Adjust for spaces
            if (digitsBefore > 4) newPos += 1;
            if (digitsBefore > 8) newPos += 1;
            inputElement.setSelectionRange(newPos, newPos);
        } else {
            inputElement.setSelectionRange(cursorPos, cursorPos);
        }
    }
    
    // Update state with clean value (without spaces for Aadhaar)
    window.updateExtraField(docId, fieldName, storedValue);
    
    // Clear error on input
    const errorElement = document.getElementById(`error-${docId}-${fieldName}`);
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.textContent = '';
    }
    
    // Update border color
    inputElement.classList.remove('border-red-500');
    inputElement.classList.add('border-gray-700');
};

// Validate field on blur
window.validateFieldInput = function (docId, fieldName, inputElement) {
    let value = inputElement.value.trim();
    
    // For Aadhaar, remove spaces before validation
    if (fieldName === 'aadhar_number') {
        value = value.replace(/\s/g, '').replace(/-/g, '');
    }
    
    const validation = window.validateField(fieldName, value);
    const errorElement = document.getElementById(`error-${docId}-${fieldName}`);
    
    if (!validation.valid && value.length > 0) {
        // Show error
        if (errorElement) {
            errorElement.textContent = validation.message;
            errorElement.classList.remove('hidden');
        }
        inputElement.classList.remove('border-gray-700');
        inputElement.classList.add('border-red-500');
    } else {
        // Clear error
        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
        }
        inputElement.classList.remove('border-red-500');
        inputElement.classList.add('border-gray-700');
    }
};

/* ---------------------------
   CONFIRM UPLOAD
---------------------------*/
async function confirmUpload() {
    // ✅ FIX: Removed vendorId check - backend uses request.user_id from JWT token
    if (!selectedFile || !currentDocumentId) return;

    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)

    const formData = new FormData();
    formData.append('file', selectedFile);
    // ✅ FIX: Removed vendor_id from formData - backend uses request.user_id from JWT token
    formData.append('doc_type', currentDocumentId);

    // Append manual fields to upload request to save them immediately
    const docDef = REQUIRED_DOCUMENTS.find(d => d.id === currentDocumentId);
    if (docDef && docDef.extraFields) {
        docDef.extraFields.forEach(field => {
            const inputId = `input-${currentDocumentId}-${field.name}`;
            const el = document.getElementById(inputId);
            let val = '';
            if (el) val = el.value.trim();
            if (!val && documents[currentDocumentId] && documents[currentDocumentId][field.name]) {
                val = documents[currentDocumentId][field.name];
            }
            if (val) {
                // Format the value before sending
                const formattedVal = window.formatFieldValue(field.name, val);
                formData.append(field.name, formattedVal);
            }
        });
    }

    // Log FormData for debugging
    console.log(`[DEBUG] Uploading doc ${currentDocumentId}`);
    for (let pair of formData.entries()) {
        console.log(`[DEBUG] FormData: ${pair[0]} = ${pair[1]}`);
    }

    try {
        const response = await ImpromptuIndianApi.fetch('/api/vendor/verification/upload', {
            method: 'POST',
            headers: {
                // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            documents[currentDocumentId] = {
                ...(documents[currentDocumentId] || {}), // Preserves manual inputs, guards against undefined
                status: 'uploaded',
                fileName: selectedFile.name,
                fileUrl: data.fileUrl,
                uploadedDate: new Date().toISOString()
            };

            renderDocumentsGrid();
            closeUploadModal();
            showToast('Document uploaded!', 'success');

        } else {
            const errData = await response.json().catch(() => ({}));
            showToast(errData.error || 'Upload failed', 'error');
        }

    } catch (e) {
        console.error(e);
        showToast('Upload failed', 'error');
    }
}

/* ---------------------------
   REMOVE DOCUMENT
---------------------------*/
/* ---------------------------
   REMOVE DOCUMENT
---------------------------*/
function removeDocument(docId) {
    if (!confirm("Remove this file?")) return;

    // We only reset file related fields, keeping manual inputs might be desired?
    // User said "enter details ... after uploading". If they remove file, maybe they want to keep details?
    // Let's keep manual details to be safe.

    documents[docId] = {
        ...documents[docId],
        status: 'pending',
        fileName: null,
        fileUrl: null,
        uploadedDate: null
    };

    renderDocumentsGrid();
    showToast('File removed', 'info');
}

/* ---------------------------
   SUBMIT VERIFICATION (DUPLICATE REMOVED - using the earlier definition)
---------------------------*/

/* ---------------------------
   VIEW REMARKS
---------------------------*/
function showRemarks(docId) {
    const doc = documents[docId];
    const modal = document.getElementById('remarks-modal');

    document.getElementById('remarks-content').innerHTML = `
        <div class="remarks-header">
            <h4>${docId.toUpperCase()}</h4>
            <span class="status-badge rejected">Rejected</span>
        </div>
        <div class="remarks-body">
            <p>${doc.adminRemarks || "No remarks provided."}</p>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeRemarksModal() {
    document.getElementById('remarks-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/* ---------------------------
   VIEW DOCUMENT
---------------------------*/
function viewDocument(docId) {
    // ✅ FIX: Backend route doesn't accept vendorId in URL - uses request.user_id from JWT
    // ✅ FIX: Use cookie-based authentication (HttpOnly access_token cookie set by backend)
    
    const url = ImpromptuIndianApi.buildUrl(`/api/vendor/verification/document/${docId}`);
    
    // ✅ FIX: Use fetch with Authorization header since window.open doesn't support headers
    fetch(url, {
        headers: {
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showToast('Authentication failed. Please log in again.', 'error');
                window.location.href = 'https://apparels.impromptuindian.com/login.html';
                return;
            }
            throw new Error(`Failed to fetch document: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
            showToast('Please allow popups to view documents', 'error');
        }
        // Clean up blob URL after a delay (10s to allow PDFs to load fully)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    })
    .catch(error => {
        console.error('Error fetching document:', error);
        showToast('Failed to open document', 'error');
    });
}

/* ---------------------------
   TOAST
---------------------------*/
function showToast(message, type = 'success') {
    showAlert(type === 'error' ? "Error" : "Success", message, type);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
    await fetchVerificationStatus();

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    const revealOnScroll = () => {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            if (el.getBoundingClientRect().top < trigger) {
                el.classList.add("show");
            }
        });
    };

    setTimeout(revealOnScroll, 200);
    window.addEventListener("scroll", revealOnScroll);

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUploadModal();
            closeRemarksModal();
        }
    });
});