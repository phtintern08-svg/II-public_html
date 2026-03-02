// Support Ticket Chat Page JavaScript
lucide.createIcons();

// Auto-highlight active sidebar link
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".menu-item").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.includes(currentPage)) link.classList.add("active");
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
// SUPPORT TICKET CHAT SYSTEM
// ============================================

// API BASE
const SUPPORT_API = "https://support.impromptuindian.com/api";

// Get Ticket ID from URL
const urlParams = new URLSearchParams(window.location.search);
const TICKET_ID = urlParams.get("ticket");

if (!TICKET_ID) {
    alert("No ticket ID provided. Redirecting to support page...");
    window.location.href = "support.html";
}

// Get Customer ID
const customerProfile = JSON.parse(localStorage.getItem("customer_profile") || "{}");
const CUSTOMER_ID = customerProfile?.id || customerProfile?.customer_id || localStorage.getItem("user_id");

// Status Badge Mapping
function statusBadge(status) {
    const map = {
        open: "bg-gray-600",
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
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return dateString;
    }
}

// Load Ticket Details
async function loadTicketDetails() {
    if (!TICKET_ID) return;

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/${TICKET_ID}`);
        
        if (!res.ok) {
            throw new Error("Failed to load ticket");
        }

        const ticket = await res.json();

        // Update UI
        document.getElementById("ticket-id-display").textContent = `Ticket #${ticket.ticket_id || TICKET_ID}`;
        document.getElementById("info-ticket-id").textContent = ticket.ticket_id || TICKET_ID;
        document.getElementById("info-category").textContent = ticket.category || "-";
        document.getElementById("info-subject").textContent = ticket.subject || "-";
        document.getElementById("info-created").textContent = formatDate(ticket.created_at);
        document.getElementById("info-updated").textContent = formatDate(ticket.updated_at);
        document.getElementById("issue-description").textContent = ticket.description || "-";

        // Status badge
        const statusEl = document.getElementById("info-status");
        statusEl.innerHTML = `<span class="${statusBadge(ticket.status)}">${ticket.status || "open"}</span>`;

        // Load messages
        loadMessages();
    } catch (error) {
        console.error("Error loading ticket:", error);
        alert("Failed to load ticket details. Please try again.");
    }
}

// Render Chat Messages
function renderChatMessages(messages) {
    const chatDiv = document.getElementById("chat-messages");
    if (!chatDiv) return;

    if (!messages || messages.length === 0) {
        chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">No messages yet. Start the conversation!</div>';
        return;
    }

    chatDiv.innerHTML = messages.map(msg => {
        // Determine if message is from customer or support
        const isCustomer = msg.sender_type === "customer" || msg.sender_id === CUSTOMER_ID;
        const senderName = isCustomer ? "You" : (msg.sender_name || "Support Agent");
        const senderInitial = senderName.charAt(0).toUpperCase();

        return `
            <div class="chat-message ${isCustomer ? "customer" : "support"}">
                <div class="chat-avatar">${senderInitial}</div>
                <div class="chat-content">
                    <div class="chat-bubble">
                        <p class="text-white">${escapeHtml(msg.message || msg.content || "")}</p>
                        ${msg.attachments && msg.attachments.length > 0 ? msg.attachments.map(att => `
                            <div class="chat-attachment">
                                <i data-lucide="paperclip" class="w-4 h-4"></i>
                                <span>${escapeHtml(att.name || att.filename || "Attachment")}</span>
                            </div>
                        `).join("") : ""}
                    </div>
                    <p class="chat-time">${formatDate(msg.created_at || msg.timestamp)}</p>
                </div>
            </div>
        `;
    }).join("");

    // Scroll to bottom
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Re-initialize icons
    if (window.lucide) lucide.createIcons();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Load Messages
async function loadMessages() {
    if (!TICKET_ID) return;

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/${TICKET_ID}/messages`);
        
        if (!res.ok) {
            throw new Error("Failed to load messages");
        }

        const messages = await res.json();
        renderChatMessages(messages);
    } catch (error) {
        console.error("Error loading messages:", error);
        const chatDiv = document.getElementById("chat-messages");
        if (chatDiv) {
            chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">Error loading messages. Please refresh the page.</div>';
        }
    }
}

// Send Message
async function sendMessage() {
    if (!TICKET_ID || !CUSTOMER_ID) {
        alert("Please log in to send messages");
        return;
    }

    const input = document.getElementById("chat-input");
    const message = input.value.trim();

    if (!message) return;

    // Disable input while sending
    input.disabled = true;
    const sendBtn = document.getElementById("send-message-btn");
    sendBtn.disabled = true;

    try {
        const res = await fetch(`${SUPPORT_API}/tickets/${TICKET_ID}/messages`, {
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
            // Reload messages to show the new one
            loadMessages();
        } else {
            alert(data.message || "Failed to send message. Please try again.");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        alert("An error occurred. Please try again.");
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// Attach send button click handler
document.getElementById("send-message-btn")?.addEventListener("click", sendMessage);

// Load ticket details on page start
loadTicketDetails();

// Auto-refresh messages every 10 seconds
setInterval(() => {
    if (TICKET_ID) {
        loadMessages();
    }
}, 10000);
