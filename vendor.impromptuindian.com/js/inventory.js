// Vendor Inventory Page JavaScript
lucide.createIcons();

/* ---------------------------
   MOCK DATA
---------------------------*/
const mockInventory = [
    {
        id: "INV-001",
        name: "Basic Tee",
        color: "Black",
        size: "S",
        stock: 120,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop"
    },
    {
        id: "INV-002",
        name: "Basic Tee",
        color: "Black",
        size: "M",
        stock: 250,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop"
    },
    {
        id: "INV-003",
        name: "Basic Tee",
        color: "Black",
        size: "L",
        stock: 450,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop"
    },
    {
        id: "INV-004",
        name: "Basic Tee",
        color: "White",
        size: "M",
        stock: 400,
        imageUrl: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=100&h=100&fit=crop"
    },
    {
        id: "INV-005",
        name: "Basic Tee",
        color: "White",
        size: "L",
        stock: 150,
        imageUrl: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=100&h=100&fit=crop"
    },
    {
        id: "INV-006",
        name: "Premium Tee",
        color: "Blue",
        size: "XL",
        stock: 80,
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&h=100&fit=crop"
    }
];

/* ---------------------------
   STATE
---------------------------*/
let inventory = [...mockInventory];
let currentProductId = null;
let dropdownElement = null;

/* ---------------------------
   RENDER FUNCTIONS
---------------------------*/
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');

    if (inventory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-gray-400 py-8">
                    No products in inventory. Click "Add Product" to get started.
                </td>
            </tr>
        `;
        return;
    }

    const html = inventory.map(item => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="product-image">
                        <img src="${item.imageUrl}" alt="${item.name}" class="rounded-md object-cover" />
                    </div>
                    <span class="font-medium">${item.name}</span>
                </div>
            </td>
            <td>${item.color}</td>
            <td>${item.size}</td>
            <td>
                <span class="stock-badge ${item.stock < 100 ? 'stock-low' : ''}">${item.stock}</span>
            </td>
            <td class="text-right">
                <button class="action-btn" onclick="showProductActions(event, '${item.id}')">
                    <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    lucide.createIcons();
}

/* ---------------------------
   PRODUCT ACTIONS
---------------------------*/
function showProductActions(event, productId) {
    event.stopPropagation();

    currentProductId = productId;
    dropdownElement = document.getElementById('product-dropdown');

    // Position dropdown
    const rect = event.currentTarget.getBoundingClientRect();
    dropdownElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
    dropdownElement.style.left = `${rect.left + window.scrollX - 150}px`;

    dropdownElement.classList.remove('hidden');
}

function hideDropdown() {
    if (dropdownElement) {
        dropdownElement.classList.add('hidden');
    }
}

function addProduct() {
    alert('Add Product functionality would open a modal/form here.');
    // In a real app, this would open a modal with a form to add a new product
}

function editProduct() {
    const product = inventory.find(p => p.id === currentProductId);
    if (product) {
        alert(`Edit functionality for ${product.name} (${product.color}, ${product.size}) would be implemented here.`);
    }
    hideDropdown();
}

function updateStock() {
    const product = inventory.find(p => p.id === currentProductId);
    if (product) {
        const newStock = prompt(`Update stock for ${product.name} (${product.color}, ${product.size})\nCurrent stock: ${product.stock}`, product.stock);

        if (newStock !== null && !isNaN(newStock)) {
            const stockValue = parseInt(newStock);
            if (stockValue >= 0) {
                inventory = inventory.map(p =>
                    p.id === currentProductId ? { ...p, stock: stockValue } : p
                );
                renderInventoryTable();
                alert(`Stock updated to ${stockValue}`);
            } else {
                alert('Stock must be a positive number.');
            }
        }
    }
    hideDropdown();
}

function deleteProduct() {
    const product = inventory.find(p => p.id === currentProductId);
    if (product) {
        if (confirm(`Are you sure you want to delete ${product.name} (${product.color}, ${product.size})?`)) {
            inventory = inventory.filter(p => p.id !== currentProductId);
            renderInventoryTable();
            alert('Product deleted successfully.');
        }
    }
    hideDropdown();
}

/* ---------------------------
   EVENT LISTENERS
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownElement && !dropdownElement.contains(e.target)) {
            hideDropdown();
        }
    });

    // Initial render
    renderInventoryTable();

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
});
