// Vendor Verification Page JavaScript - Version 2
console.log('Vendor Verification JS v5 loaded');
lucide.createIcons();

/* ---------------------------
   DOCUMENT TYPES
---------------------------*/
const REQUIRED_DOCUMENTS = [
    { id: 'pan', label: 'PAN Card', icon: 'credit-card', required: true, extraFields: [{ name: 'pan_number', placeholder: 'Enter PAN Number' }] },
    { id: 'aadhar', label: 'Aadhar Card', icon: 'id-card', required: true, extraFields: [{ name: 'aadhar_number', placeholder: 'Enter Aadhar Number' }] },
    { id: 'gst', label: 'GST Certificate', icon: 'file-text', required: true, extraFields: [{ name: 'gst_number', placeholder: 'Enter GST Number' }] },
    { id: 'business', label: 'Business Registration', icon: 'building-2', required: true },
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

        // Logic for re-upload permission
        const isRejectedGlobal = verificationStatus === 'rejected';
        const isNotSubmitted = verificationStatus === 'not-submitted';
        let canUpload = isNotSubmitted;

        if (isRejectedGlobal) {
            // If global is rejected, only allow editing rejected documents or those not yet handled?
            // Assuming 'pending' means not yet uploaded or not yet reviewed.
            // If it's 'approved', lock it.
            canUpload = (status === 'rejected' || status === 'pending' || !doc.status);
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

                return `
                    <div class="${colSpan}" style="${displayStyle}">
                        <label class="text-xs text-gray-400 block mb-1 uppercase tracking-wider">${field.placeholder}</label>
                        <input type="text" 
                               id="input-${docType.id}-${field.name}" 
                               class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                               style="${displayStyle}"
                               placeholder="${field.placeholder}"
                               value="${val}"
                               oninput="window.updateExtraField('${docType.id}', '${field.name}', this.value)"
                               ${disabled}
                        >
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
    let extraData = {};

    REQUIRED_DOCUMENTS.forEach(doc => {
        if (doc.extraFields) {
            doc.extraFields.forEach(field => {
                const inputId = `input-${doc.id}-${field.name}`;
                const el = document.getElementById(inputId);
                if (el) {
                    const val = el.value.trim();
                    if (val) {
                        extraData[field.name] = val;
                    } else if (documents[doc.id] && documents[doc.id][field.name]) {
                        // Fallback to state if input empty (e.g. if hidden but value present in state)
                        extraData[field.name] = documents[doc.id][field.name];
                    } else {
                        // Only mark missing if absolutely no data
                        missingExtras.push(`${doc.label}: ${field.placeholder}`);
                    }
                } else if (documents[doc.id] && documents[doc.id][field.name]) {
                    // Fallback to state if element completely missing/hidden (though we fixed hiding, just in case)
                    extraData[field.name] = documents[doc.id][field.name];
                } else {
                    missingExtras.push(`${doc.label}: ${field.placeholder}`);
                }
            });
        }
    });

    if (missingExtras.length > 0) {
        showToast(`Please fill in details for: ${missingExtras.join(', ')}`, 'error');
        return;
    }

    try {
        const payload = {
            vendor_id: vendorId,
            ...extraData
        };

        const response = await ImpromptuIndianApi.fetch('/vendor/verification/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            showToast('Failed to submit verification', 'error');
            return;
        }

        verificationStatus = 'pending';

        // Reload status to refresh valid data
        await fetchVerificationStatus();

        showToast('Documents submitted for verification!', 'success');

        // Lock UI completely
        freezeVerificationUI();

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
const vendorId = localStorage.getItem('user_id');

if (!vendorId) {
    console.error("Vendor ID not found");
}

/* ---------------------------
   FETCH VERIFICATION STATUS
---------------------------*/
async function fetchVerificationStatus() {
    if (!vendorId) return;

    const submitSection = document.getElementById('submit-section');
    const submitBtn = document.getElementById('submit-btn');

    if (submitSection) {
        submitSection.style.display = 'flex';
        submitSection.classList.add('show'); // Force visibility
    }

    try {
        const response = await ImpromptuIndianApi.fetch(`/vendor/verification/status/${vendorId}`);
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
                else if (verificationStatus === 'pending' || verificationStatus === 'under-review') {
                    submitBtn.textContent = 'Documents Submitted – Awaiting Review';
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

                    // keep UI locked but do not hide submit button
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
    try {
        const response = await ImpromptuIndianApi.fetch(`/vendor/quotation/status/${vendorId}`);
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
        if (e.target.files[0]) {
            quotationFilename.textContent = e.target.files[0].name;
            quotationFilename.classList.add('text-blue-400');
        }
    };
}

/* ---------------------------
   SUBMIT QUOTATION
---------------------------*/
async function submitQuotation() {
    const file = quotationInput.files[0];
    const commission = document.getElementById('quotation-commission').value;

    if (!file) return showToast('Please upload quotation file', 'error');
    if (!commission) return showToast('Enter commission rate', 'error');
    if (parseFloat(commission) < 15) return showToast('Minimum commission is 15%', 'error');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendor_id', vendorId);
    formData.append('commission_rate', commission);

    try {
        const btn = document.querySelector('button[onclick="submitQuotation()"]');
        btn.textContent = "Submitting...";
        btn.disabled = true;

        const response = await ImpromptuIndianApi.fetch('/vendor/quotation/submit', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showToast('Quotation submitted!', 'success');
            setTimeout(() => location.reload(), 1200);
        }
        else {
            showToast('Failed to submit', 'error');
            btn.disabled = false;
        }

    } catch (e) {
        console.error(e);
        showToast('Error submitting quotation', 'error');
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

    banner.innerHTML = banners[verificationStatus];
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
        return ['pending', 'under-review', 'approved', 'rejected'].includes(verificationStatus) ? 'completed' : 'pending';
    }
    if (stepId === 'review') {
        if (verificationStatus === 'under-review') return 'current';
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
        "under-review": "search",
        approved: "check-circle",
        rejected: "x-circle"
    }[status] || "circle";
}

function getStatusLabel(status) {
    return {
        pending: "Pending Upload",
        uploaded: "Uploaded",
        "under-review": "Under Review",
        approved: "Approved",
        rejected: "Rejected - Reupload"
    }[status] || "Pending";
}

/* ---------------------------
   UPLOAD MODAL
---------------------------*/
function openUploadModal(docId) {
    const docDef = REQUIRED_DOCUMENTS.find(d => d.id === docId);

    // Validate manual fields if any
    let missingFields = [];
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
            }
        });
    }

    if (missingFields.length > 0) {
        showToast(`Please enter ${missingFields.join(', ')} before uploading`, 'error');
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

    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be under 5MB', 'error');
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

/* ---------------------------
   CONFIRM UPLOAD
---------------------------*/
async function confirmUpload() {
    if (!selectedFile || !currentDocumentId || !vendorId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('vendor_id', vendorId);
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
                formData.append(field.name, val);
            }
        });
    }

    // Log FormData for debugging
    console.log(`[DEBUG] Uploading doc ${currentDocumentId} for vendor ${vendorId}`);
    for (let pair of formData.entries()) {
        console.log(`[DEBUG] FormData: ${pair[0]} = ${pair[1]}`);
    }

    try {
        const response = await ImpromptuIndianApi.fetch('/vendor/verification/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            documents[currentDocumentId] = {
                ...documents[currentDocumentId], // Preserves manual inputs
                status: 'uploaded',
                fileName: selectedFile.name,
                fileUrl: data.fileUrl,
                uploadedDate: new Date().toISOString()
            };

            renderDocumentsGrid();
            closeUploadModal();
            showToast('Document uploaded!', 'success');

        } else {
            showToast('Upload failed', 'error');
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

    try {
        const response = await ImpromptuIndianApi.fetch('/vendor/verification/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendor_id: vendorId })
        });

        if (!response.ok) {
            showToast('Failed to submit verification', 'error');
            return;
        }

        verificationStatus = 'pending';
        renderStatusBanner();
        renderTimeline();
        renderDocumentsGrid();

        showToast('Documents submitted for verification!', 'success');

        // Lock UI completely
        freezeVerificationUI();

    } catch (e) {
        console.error(e);
        showToast('Error submitting verification', 'error');
    }
}

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
    if (!vendorId) return;
    const url = ImpromptuIndianApi.buildUrl(`/vendor/verification/document/${vendorId}/${docId}`);
    window.open(url, '_blank');
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
document.addEventListener('DOMContentLoaded', () => {
    fetchVerificationStatus();

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