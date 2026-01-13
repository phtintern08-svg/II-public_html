// In Production Page JavaScript
lucide.createIcons();

/* ---------------------------
   PRODUCTION STAGES
---------------------------*/
const PRODUCTION_STAGES = [
    { id: 'accepted', label: 'Order Accepted', icon: 'check-circle' },
    { id: 'material', label: 'Material Preparation', icon: 'package' },
    { id: 'printing', label: 'Printing In Progress', icon: 'printer' },
    { id: 'completed', label: 'Printing Completed', icon: 'check-square' },
    { id: 'quality', label: 'Quality Check', icon: 'search-check' },
    { id: 'packed', label: 'Packed & Ready', icon: 'box' }
];

/* ---------------------------
   STATE
---------------------------*/
let productionOrders = [];
let currentOrderId = null;
let uploadedFiles = [];
let currentView = 'list';
let pipelineFilter = '';
const vendorId = localStorage.getItem('user_id');

/* ---------------------------
   FETCH ORDERS FROM BACKEND
---------------------------*/
async function fetchProductionOrders() {
    if (!vendorId) {
        showToast('Vendor ID not found. Please log in again.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/vendor/orders?status=in_production`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch production orders');

        const responseData = await response.json();
        const data = responseData.orders || responseData;

        productionOrders = data.map(o => ({
            ...o,
            deadline: o.deadline ? new Date(o.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }));

        renderView();
    } catch (e) {
        console.error('Error fetching production orders:', e);
        showToast('Error loading orders from server');
    }
}

function renderView() {
    const filteredOrders = productionOrders.filter(order =>
        order.id.toLowerCase().includes(pipelineFilter.toLowerCase()) ||
        order.productType.toLowerCase().includes(pipelineFilter.toLowerCase())
    );

    if (currentView === 'list') {
        renderProductionTable(filteredOrders);
    } else {
        renderKanbanBoard(filteredOrders);
    }
}

function switchView(view) {
    currentView = view;
    document.getElementById('view-list').classList.toggle('active', view === 'list');
    document.getElementById('view-kanban').classList.toggle('active', view === 'kanban');

    document.getElementById('list-view').classList.toggle('hidden', view !== 'list');
    document.getElementById('kanban-view').classList.toggle('hidden', view !== 'kanban');

    renderView();
}

/* ---------------------------
   RENDER TABLE
---------------------------*/
function renderProductionTable(orders) {
    const tbody = document.getElementById('production-table-body');
    const tableOrders = orders || productionOrders;

    if (tableOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12">
                    <div class="flex flex-col items-center opacity-30">
                        <i data-lucide="inbox" class="w-12 h-12 mb-2"></i>
                        <span class="text-xs font-bold uppercase tracking-widest">No Requisitions Found</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const html = tableOrders.map(order => {
        const diff = order.deadline - new Date();
        const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        const urgencyClass = daysRemaining <= 2 ? 'urgent' : daysRemaining <= 5 ? 'moderate' : 'normal';
        const currentStageObj = PRODUCTION_STAGES.find(s => s.id === order.currentStage) || PRODUCTION_STAGES[0];
        const stageIndex = PRODUCTION_STAGES.findIndex(s => s.id === order.currentStage);
        const progress = ((stageIndex + 1) / PRODUCTION_STAGES.length) * 100;

        const canAdvance = stageIndex < PRODUCTION_STAGES.length - 1;

        return `
            <tr class="reveal show border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-bold text-white text-sm tracking-tight">#${order.id}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-200 mb-1">${order.productType}</span>
                        <div class="flex items-center gap-2">
                             <span class="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wide">
                                ${order.customization?.printType || 'STANDARD'}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="font-semibold text-sm text-gray-300">${order.quantity} units</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1.5 w-40">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-blue-400 uppercase tracking-wide">${currentStageObj.label}</span>
                            <span class="text-[10px] text-gray-500 font-mono">${Math.round(progress)}%</span>
                        </div>
                        <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden ring-1 ring-white/5">
                            <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 ${urgencyClass === 'urgent' ? 'text-red-400' : urgencyClass === 'moderate' ? 'text-amber-400' : 'text-green-400'}">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        <span class="text-xs font-bold font-mono tracking-tight">${daysRemaining} Days Left</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-3">
                        <button class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-gray-700 transition-all" onclick="openUpdateModal('${order.id}')">
                            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i>
                            Analyze
                        </button>
                        <button class="p-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 rounded-lg border border-blue-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Next Phase" onclick="quickAdvance('${order.id}')" ${!canAdvance ? 'disabled' : ''}>
                             <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
    lucide.createIcons();
}

function renderKanbanBoard(orders) {
    const board = document.getElementById('kanban-board');
    const boardOrders = orders || productionOrders;

    board.innerHTML = PRODUCTION_STAGES.map(stage => {
        const ordersInStage = boardOrders.filter(o => o.currentStage === stage.id);

        return `
            <div class="kanban-column">
                <div class="column-header">
                    <div class="column-title-group">
                        <div class="column-icon">
                            <i data-lucide="${stage.icon}" class="w-4 h-4"></i>
                        </div>
                        <span class="column-title">${stage.label}</span>
                    </div>
                    <span class="column-count">${ordersInStage.length}</span>
                </div>
                <div class="kanban-cards">
                    ${ordersInStage.map(order => `
                        <div class="kanban-card" onclick="openUpdateModal('${order.id}')">
                            <div class="kanban-card-id">
                                <span>${order.id}</span>
                                <button class="quick-advance" onclick="event.stopPropagation(); quickAdvance('${order.id}')" title="Advance Phase">
                                    <i data-lucide="arrow-right" class="w-3 h-3"></i>
                                </button>
                            </div>
                            <div class="kanban-card-spec">
                                ${order.productType} • ${order.customization?.fabric || 'Standard'}
                            </div>
                            <div class="kanban-card-footer">
                                <span class="kanban-card-vol">${order.quantity} UNITS</span>
                                <div class="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                    <i data-lucide="clock" class="w-2.5 h-2.5"></i>
                                    ${Math.max(0, Math.ceil((order.deadline - new Date()) / (1000 * 60 * 60 * 24)))}d
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${ordersInStage.length === 0 ? '<div class="text-center py-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest">No Requisitions</div>' : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

async function quickAdvance(orderId) {
    const order = productionOrders.find(o => o.id === orderId);
    if (!order) return;

    const currentIndex = PRODUCTION_STAGES.findIndex(s => s.id === order.currentStage);
    if (currentIndex >= PRODUCTION_STAGES.length - 1) return;

    const nextStage = PRODUCTION_STAGES[currentIndex + 1].id;

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: nextStage,
                remarks: 'Quick check-off from technical pipeline dashboard.'
            })
        });

        if (!response.ok) throw new Error('Rapid update failed');

        await fetchProductionOrders();
        showToast(`Requisition ${orderId} progressed to ${nextStage}`);
    } catch (e) {
        console.error('Quick advance error:', e);
        showToast('Phase progression failed');
    }
}

/* ---------------------------
   UPDATE MODAL
---------------------------*/
function openUpdateModal(orderId) {
    const order = productionOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    uploadedFiles = [...(order.photos || [])];

    const modal = document.getElementById('update-modal');
    const modalTitle = document.getElementById('modal-order-id');
    const orderInfo = document.getElementById('order-info');

    modalTitle.textContent = `Update ${order.id}`;

    // Technical info bar
    orderInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Active Phase:</span>
            <span class="info-value text-blue-400">${PRODUCTION_STAGES.find(s => s.id === order.currentStage)?.label || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Tech Spec:</span>
            <span class="info-value">${order.productType}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Batch Volume:</span>
            <span class="info-value">${order.quantity} units</span>
        </div>
    `;

    // Render stages
    renderStages(order.currentStage);

    // Set notes
    const notesEl = document.getElementById('internal-notes');
    if (notesEl) notesEl.value = order.notes || '';

    // Render uploaded files
    renderUploadedFiles();

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentOrderId = null;
    uploadedFiles = [];
}

/* ---------------------------
   RENDER STAGES
---------------------------*/
function renderStages(currentStage) {
    const stagesList = document.getElementById('stages-list');
    const currentIndex = PRODUCTION_STAGES.findIndex(s => s.id === currentStage);

    const html = PRODUCTION_STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';

        return `
            <div class="stage-item ${statusClass}" onclick="selectStage('${stage.id}')">
                <div class="stage-icon">
                    <i data-lucide="${stage.icon}" class="w-5 h-5"></i>
                </div>
                <div class="stage-info">
                    <p class="stage-label">${stage.label}</p>
                    ${isCompleted ? '<p class="stage-status">Completed</p>' :
                isCurrent ? '<p class="stage-status">In Progress</p>' :
                    '<p class="stage-status">Pending</p>'}
                </div>
                ${isCurrent ? '<div class="stage-current-indicator"></div>' : ''}
            </div>
        `;
    }).join('');

    stagesList.innerHTML = html;
    lucide.createIcons();
}

let selectedStageId = null;
function selectStage(stageId) {
    selectedStageId = stageId;
    renderStages(stageId);
}

/* ---------------------------
   FILE UPLOAD
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });
    }
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            uploadedFiles.push({
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file)
            });
        }
    });
    renderUploadedFiles();
}

function renderUploadedFiles() {
    const container = document.getElementById('uploaded-files');
    if (!container) return;

    if (uploadedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    const html = uploadedFiles.map((file, index) => `
        <div class="uploaded-file">
            <img src="${file.url}" alt="${file.name}" class="file-preview">
            <div class="file-info">
                <p class="file-name">${file.name}</p>
                <p class="file-size">${(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    container.innerHTML = html;
    lucide.createIcons();
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderUploadedFiles();
}

/* ---------------------------
   SAVE UPDATE
---------------------------*/
async function saveUpdate() {
    if (!currentOrderId) return;

    // Use current stage from order if none selected in modal session
    const stageId = selectedStageId || productionOrders.find(o => o.id === currentOrderId).currentStage;
    const notes = document.getElementById('internal-notes')?.value || '';

    try {
        const token = localStorage.getItem('token');
        const response = await ImpromptuIndianApi.fetch(`/api/orders/${currentOrderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: stageId,
                remarks: notes
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update stage');
        }

        const data = await response.json();

        // Update local state temporarily or just re-fetch
        await fetchProductionOrders();

        // Close modal
        closeUpdateModal();

        // Show success toast
        showToast(data.message || 'Production stage updated successfully!');
    } catch (e) {
        console.error('Error updating production stage:', e);
        showToast(e.message || 'Error updating production stage');
    }
}

/* ---------------------------
   TOAST
---------------------------*/
function showToast(message) {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');

    if (!toast || !messageEl) return;

    messageEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    fetchProductionOrders();

    // Technical Discovery Logic
    const searchInput = document.getElementById('pipeline-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            pipelineFilter = e.target.value;
            renderView();
        });
    }

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add("show");
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener("scroll", revealOnScroll);

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUpdateModal();
        }
    });
});
