// Support Page JavaScript - Production Level
lucide.createIcons();

// Auto-highlight active sidebar link
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".menu-item").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.includes(currentPage)) link.classList.add("active");
});

// Accordion Logic
document.querySelectorAll(".accordion").forEach(acc => {
    acc.addEventListener("click", () => {
        acc.classList.toggle("accordion-active");
    });
});

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (total > 0) {
        badge.style.display = "flex";
        badge.textContent = total;
    } else {
        badge.style.display = "none";
    }
}

updateCartBadge();

// ============================================
// PRODUCTION-LEVEL SUPPORT TICKET SYSTEM
// ============================================

// API BASE
const SUPPORT_API = "https://support.impromptuindian.com/api";

// Get Customer ID
const customerProfile = JSON.parse(localStorage.getItem("customer_profile") || "{}");
const CUSTOMER_ID = customerProfile?.id || customerProfile?.customer_id || localStorage.getItem("user_id");

// Global State
let allTickets = [];
let currentTicketId = null;
let allOrders = [];

// ============================================
// SECTION 1: LOAD RECENT ORDERS
// ============================================

async function loadRecentOrders() {
    const container = document.getElementById("recentOrdersHelp");
    if (!container) return;

    try {
        const token = localStorage.getItem("token");
        const response = await window.ImpromptuIndianApi.fetch("/api/customer/orders", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Unable to load orders</div>';
            return;
        }

        const data = await response.json();
        allOrders = data.orders || data || [];

        if (!allOrders || allOrders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-400 text-sm">
                    <i data-lucide="package" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p>No recent orders</p>
                </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Show last 5 orders
        const recentOrders = allOrders.slice(0, 5).sort((a, b) => (b.id || 0) - (a.id || 0));

        container.innerHTML = recentOrders.map(order => {
            const orderId = order.id || order.order_id || "N/A";
            const productType = order.product_type || "Order";
            const status = order.status || "Unknown";
            
            return `
                <div class="flex justify-between items-center bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                    <div class="flex-1">
                        <p class="font-semibold">Order #${orderId}</p>
                        <p class="text-xs text-gray-400">${productType} • ${status}</p>
                    </div>
                    <button onclick="raiseFromOrder(${orderId})"
                        class="text-yellow-400 hover:text-yellow-300 font-semibold text-sm px-3 py-1 rounded transition-colors">
                        Get Help
                    </button>
                </div>
            `;
        }).join("");

        // Populate order dropdown in modal
        populateOrderDropdown();

        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error("Error loading recent orders:", error);
        container.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Error loading orders</div>';
    }
}

// Populate Order Dropdown in Modal
function populateOrderDropdown() {
    const select = document.getElementById("ticketOrder");
    if (!select) return;

    // Clear existing options except first
    select.innerHTML = '<option value="">No specific order</option>';

    if (allOrders && allOrders.length > 0) {
        const sortedOrders = [...allOrders].sort((a, b) => (b.id || 0) - (a.id || 0));
        sortedOrders.forEach(order => {
            const option = document.createElement("option");
            option.value = order.id || order.order_id;
            option.textContent = `Order #${order.id || order.order_id} - ${order.product_type || "Order"}`;
            select.appendChild(option);
        });
    }
}

// Raise Ticket from Order
window.raiseFromOrder = function(orderId) {
    const modal = document.getElementById("ticketModal");
    const orderSelect = document.getElementById("ticketOrder");
    
    if (modal && orderSelect) {
        // Set the order in dropdown
        orderSelect.value = orderId;
        
        // Auto-fill category based on order status
        const order = allOrders.find(o => (o.id || o.order_id) == orderId);
        if (order) {
            const categorySelect = document.getElementById("ticketCategory");
            if (categorySelect) {
                if (order.status?.toLowerCase().includes("delivery") || order.status?.toLowerCase().includes("shipped")) {
                    categorySelect.value = "Delivery Issue";
                } else if (order.status?.toLowerCase().includes("payment") || order.status?.toLowerCase().includes("pending")) {
                    categorySelect.value = "Payment Issue";
                }
            }
            
            // Auto-fill subject
            const subjectInput = document.getElementById("ticketSubject");
            if (subjectInput) {
                subjectInput.value = `Issue with Order #${orderId}`;
            }
        }
        
        // Open modal
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        lucide.createIcons();
    }
};

// ============================================
// SECTION 2: TICKET SEARCH
// ============================================

document.getElementById("ticketSearch")?.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    if (!term) {
        renderTickets(allTickets);
        return;
    }

    const filtered = allTickets.filter(ticket => {
        const ticketId = (ticket.ticket_id || ticket.id || "").toString().toLowerCase();
        const subject = (ticket.subject || "").toLowerCase();
        const category = (ticket.category || "").toLowerCase();
        const status = (ticket.status || "").toLowerCase();
        
        return ticketId.includes(term) || 
               subject.includes(term) || 
               category.includes(term) || 
               status.includes(term);
    });

    renderTickets(filtered);
});

// ============================================
// SECTION 3: ENHANCED TICKET LOADING
// ============================================

// Enhanced Status Badge Mapping
function statusBadge(status) {
    const map = {
        open: "bg-gray-600",
        assigned: "bg-blue-600",
        in_progress: "bg-yellow-500",
        resolved: "bg-green-600",
        closed: "bg-red-600"
    };
    return `${map[status] || "bg-gray-600"} text-xs px-2 py-1 rounded`;
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
        return dateString;
    }
}

// Render Tickets
function renderTickets(tickets) {
    const tbody = document.getElementById("ticketsTableBody");
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="py-4 opacity-60 text-center">
                    No tickets found
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => {
        const ticketId = t.ticket_id || t.id || "N/A";
        const status = t.status || "open";
        const updated = formatDate(t.updated_at || t.created_at);
        
        return `
            <tr class="border-t border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onclick="openTicketConversation('${ticketId}')">
                <td class="py-3 font-medium">
                    ${ticketId}
                </td>
                <td>
                    <span class="${statusBadge(status)}">
                        ${status}
                    </span>
                </td>
                <td class="hidden sm:table-cell text-xs text-gray-400">
                    ${updated}
                </td>
            </tr>
        `;
    }).join("");
}

// Load Customer Tickets
async function loadTickets() {
    if (!CUSTOMER_ID) {
        return;
    }

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/customer/${CUSTOMER_ID}`);
        
        if (!res.ok) {
            throw new Error("Failed to load tickets");
        }

        const tickets = await res.json();
        allTickets = tickets || [];

        renderTickets(allTickets);
    } catch (error) {
        console.error("Error loading tickets:", error);
        const tbody = document.getElementById("ticketsTableBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="py-4 opacity-60 text-center">
                        Error loading tickets
                    </td>
                </tr>`;
        }
    }
}

// ============================================
// SECTION 4: INLINE TICKET CONVERSATION
// ============================================

// Open Ticket Conversation (Inline)
window.openTicketConversation = function(ticketId) {
    currentTicketId = ticketId;
    const conversationPanel = document.getElementById("ticketConversation");
    const ticketIdDisplay = document.getElementById("conversationTicketId");
    
    if (conversationPanel && ticketIdDisplay) {
        ticketIdDisplay.textContent = ticketId;
        conversationPanel.classList.remove("hidden");
        loadChatMessages(ticketId);
        
        // Scroll conversation into view on mobile
        if (window.innerWidth < 1024) {
            conversationPanel.scrollIntoView({ behavior: "smooth" });
        }
    }
    
    lucide.createIcons();
};

// Close Conversation
document.getElementById("closeConversation")?.addEventListener("click", () => {
    const conversationPanel = document.getElementById("ticketConversation");
    if (conversationPanel) {
        conversationPanel.classList.add("hidden");
        currentTicketId = null;
    }
});

// Load Chat Messages
async function loadChatMessages(ticketId) {
    const chatDiv = document.getElementById("chatMessages");
    if (!chatDiv) return;

    chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">Loading messages...</div>';

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/${ticketId}/messages`);
        
        if (!res.ok) {
            throw new Error("Failed to load messages");
        }

        const messages = await res.json();
        renderChatMessages(messages);
    } catch (error) {
        console.error("Error loading messages:", error);
        chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">Error loading messages</div>';
    }
}

// Render Chat Messages
function renderChatMessages(messages) {
    const chatDiv = document.getElementById("chatMessages");
    if (!chatDiv) return;

    if (!messages || messages.length === 0) {
        chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">No messages yet. Start the conversation!</div>';
        return;
    }

    chatDiv.innerHTML = messages.map(msg => {
        const isCustomer = msg.sender_type === "customer" || msg.sender_id === CUSTOMER_ID;
        const senderName = isCustomer ? "You" : (msg.sender_name || "Support Agent");
        const senderInitial = senderName.charAt(0).toUpperCase();
        const messageText = escapeHtml(msg.message || msg.content || "");
        const timestamp = formatDate(msg.created_at || msg.timestamp);

        return `
            <div class="flex gap-3 ${isCustomer ? "flex-row-reverse" : ""}">
                <div class="w-8 h-8 rounded-full ${isCustomer ? "bg-yellow-400 text-black" : "bg-blue-600 text-white"} flex items-center justify-center font-bold text-sm flex-shrink-0">
                    ${senderInitial}
                </div>
                <div class="flex-1 max-w-[70%]">
                    <div class="${isCustomer ? "bg-yellow-400/20 border-yellow-400/30" : "bg-gray-800 border-gray-700"} p-3 rounded-lg border">
                        <p class="text-white text-sm">${messageText}</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 ${isCustomer ? "text-right" : ""}">${timestamp}</p>
                </div>
            </div>
        `;
    }).join("");

    // Scroll to bottom
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Send Chat Message
window.sendChatMessage = async function() {
    if (!currentTicketId || !CUSTOMER_ID) {
        alert("Please log in to send messages");
        return;
    }

    const input = document.getElementById("chatInput");
    const message = input?.value.trim();

    if (!message) return;

    // Disable input
    input.disabled = true;
    const sendBtn = document.getElementById("sendMessage");
    if (sendBtn) sendBtn.disabled = true;

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/${currentTicketId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer_id: CUSTOMER_ID,
                message: message
            })
        });

        const data = await res.json();

        if (data.success || res.ok) {
            input.value = "";
            loadChatMessages(currentTicketId);
        } else {
            alert(data.message || "Failed to send message");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        alert("An error occurred. Please try again.");
    } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
};

// Attach send button click handler
document.getElementById("sendMessage")?.addEventListener("click", sendChatMessage);

// ============================================
// SECTION 5: ENHANCED RAISE TICKET MODAL
// ============================================

// Modal Control
const modal = document.getElementById("ticketModal");

document.getElementById("raiseTicketBtn")?.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    lucide.createIcons();
});

document.getElementById("closeTicketModal")?.addEventListener("click", () => {
    modal.classList.add("hidden");
    resetTicketForm();
});

// Close modal on outside click
modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
        resetTicketForm();
    }
});

// Reset Form
function resetTicketForm() {
    document.getElementById("ticketOrder").value = "";
    document.getElementById("ticketCategory").value = "Delivery Issue";
    document.getElementById("ticketPriority").value = "medium";
    document.getElementById("ticketSubject").value = "";
    document.getElementById("ticketDescription").value = "";
    document.getElementById("ticketAttachment").value = "";
}

// Create Ticket (Enhanced)
document.getElementById("submitTicket")?.addEventListener("click", async () => {
    if (!CUSTOMER_ID) {
        alert("Please log in to create a ticket");
        return;
    }

    const subject = document.getElementById("ticketSubject").value.trim();
    const description = document.getElementById("ticketDescription").value.trim();
    const category = document.getElementById("ticketCategory").value;
    const priority = document.getElementById("ticketPriority").value;
    const orderId = document.getElementById("ticketOrder").value;
    const attachment = document.getElementById("ticketAttachment").files[0];

    if (!subject || !description) {
        alert("Please fill in subject and description");
        return;
    }

    // Disable button
    const submitBtn = document.getElementById("submitTicket");
    const oldText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
        // Prepare form data for file upload
        const formData = new FormData();
        formData.append("customer_id", CUSTOMER_ID);
        formData.append("category", category);
        formData.append("subject", subject);
        formData.append("description", description);
        formData.append("priority", priority);
        if (orderId) formData.append("order_id", orderId);
        if (attachment) formData.append("attachment", attachment);

        // Try FormData first (for file upload), fallback to JSON
        let res;
        if (attachment) {
            res = await fetch(`${SUPPORT_API}/tickets/create`, {
                method: "POST",
                body: formData
            });
        } else {
            res = await fetch(`${SUPPORT_API}/tickets/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customer_id: CUSTOMER_ID,
                    category,
                    subject,
                    description,
                    priority,
                    order_id: orderId || null
                })
            });
        }

        const data = await res.json();

        if (data.success || res.ok) {
            resetTicketForm();
            modal.classList.add("hidden");
            loadTickets();
            
            // If ticket was created, open conversation
            if (data.ticket_id) {
                setTimeout(() => {
                    openTicketConversation(data.ticket_id);
                }, 500);
            }
        } else {
            alert(data.message || "Failed to create ticket. Please try again.");
        }
    } catch (error) {
        console.error("Error creating ticket:", error);
        alert("An error occurred. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
    }
});

// ============================================
// SECTION 6: AUTO-REFRESH
// ============================================

// Auto-refresh tickets every 15 seconds
setInterval(() => {
    if (CUSTOMER_ID) {
        loadTickets();
        
        // Refresh chat if conversation is open
        if (currentTicketId) {
            loadChatMessages(currentTicketId);
        }
    }
}, 15000);

// ============================================
// INITIALIZATION
// ============================================

// Load everything on page start
loadRecentOrders();
loadTickets();
