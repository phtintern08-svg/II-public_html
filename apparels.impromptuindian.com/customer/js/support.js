// Support Page JavaScript - Production Level
// ============================================
// ALL CODE WRAPPED IN DOMContentLoaded FOR STABILITY
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    // Initialize icons
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
    let socket = null;  // Will be initialized with Socket.IO
    let slaTimerInterval = null;
    let typingTimeout = null;

    // ============================================
    // LOGIN PROTECTION
    // ============================================

    if (!CUSTOMER_ID) {
        alert("Session expired. Please log in again.");
        // Redirect to login - adjust path if needed
        const loginPath = window.location.pathname.includes("/customer/") 
            ? "../login.html" 
            : "login.html";
        window.location.href = loginPath;
        return;
    }

    // ============================================
    // INITIALIZATION FUNCTION
    // ============================================

    function initSupportPage() {
        initWebSocket();
        bindModalControls();
        bindChatControls();
        bindTicketSearch();
        bindCloseConversation();

        loadRecentOrders();
        loadTickets();
        updateUnreadBadge();
    }

    // ============================================
    // MODAL CONTROLS (FIXED)
    // ============================================

    function bindModalControls() {
        const modal = document.getElementById("ticketModal");
        const openBtn = document.getElementById("raiseTicketBtn");
        const closeBtn = document.getElementById("closeTicketModal");

        if (!modal) {
            console.warn("Modal not found");
            return;
        }

        // Close Modal Function
        function closeModal() {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
            resetTicketForm();
        }

        // OPEN BUTTON
        if (openBtn) {
            openBtn.addEventListener("click", () => {
                modal.classList.remove("hidden");
                modal.classList.add("flex");
                lucide.createIcons();
            });
        }

        // CANCEL BUTTON
        if (closeBtn) {
            closeBtn.addEventListener("click", closeModal);
        }

        // CLICK OUTSIDE
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // SUBMIT TICKET
        const submitBtn = document.getElementById("submitTicket");
        if (submitBtn) {
            submitBtn.addEventListener("click", async () => {
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
                        closeModal();
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
        }
    }

    // Reset Form
    function resetTicketForm() {
        const orderEl = document.getElementById("ticketOrder");
        const categoryEl = document.getElementById("ticketCategory");
        const priorityEl = document.getElementById("ticketPriority");
        const subjectEl = document.getElementById("ticketSubject");
        const descriptionEl = document.getElementById("ticketDescription");
        const attachmentEl = document.getElementById("ticketAttachment");

        if (orderEl) orderEl.value = "";
        if (categoryEl) categoryEl.value = "Delivery Issue";
        if (priorityEl) priorityEl.value = "medium";
        if (subjectEl) subjectEl.value = "";
        if (descriptionEl) descriptionEl.value = "";
        if (attachmentEl) attachmentEl.value = "";
    }

    // ============================================
    // WEBSOCKET INITIALIZATION
    // ============================================

    function initWebSocket() {
        if (typeof io === "undefined") {
            console.warn("Socket.IO not loaded. Falling back to polling.");
            return;
        }

        try {
            socket = io("https://support.impromptuindian.com", {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            socket.on("connect", () => {
                console.log("✅ WebSocket connected");
            });

            socket.on("disconnect", () => {
                console.log("⚠️ WebSocket disconnected");
            });

            socket.on("connect_error", (error) => {
                console.error("WebSocket connection error:", error);
            });

            // Listen for new messages
            socket.on("new_message", (data) => {
                if (data.ticket_id === currentTicketId) {
                    appendMessage(data);
                    hideTypingIndicator();
                }
                // Update unread count
                updateUnreadBadge();
            });

            // Listen for typing indicator
            socket.on("typing_start", (data) => {
                if (data.ticket_id === currentTicketId && data.sender !== "customer") {
                    showTypingIndicator(data.sender_name || "Support agent");
                }
            });

            socket.on("typing_stop", (data) => {
                if (data.ticket_id === currentTicketId) {
                    hideTypingIndicator();
                }
            });

            // Listen for unread count updates
            socket.on("unread_count", (count) => {
                updateUnreadBadge(count);
            });

            // Listen for ticket updates (status changes, SLA updates)
            socket.on("ticket_update", (data) => {
                if (data.ticket_id === currentTicketId) {
                    if (data.sla_deadline) {
                        startSLATimer(data.sla_deadline);
                    }
                }
                // Refresh ticket list
                loadTickets();
            });

        } catch (error) {
            console.error("Error initializing WebSocket:", error);
        }
    }

    // ============================================
    // CHAT CONTROLS (ENHANCED WITH TYPING)
    // ============================================

    function bindChatControls() {
        const sendBtn = document.getElementById("sendMessage");
        const chatInput = document.getElementById("chatInput");

        if (sendBtn) {
            sendBtn.addEventListener("click", sendChatMessage);
        }

        if (chatInput) {
            // Typing indicator on input
            let typingTimeout;
            chatInput.addEventListener("input", () => {
                if (socket && currentTicketId) {
                    // Emit typing start
                    socket.emit("typing", {
                        ticket_id: currentTicketId,
                        sender: "customer"
                    });

                    // Clear existing timeout
                    clearTimeout(typingTimeout);

                    // Stop typing after 3 seconds of inactivity
                    typingTimeout = setTimeout(() => {
                        if (socket) {
                            socket.emit("typing_stop", {
                                ticket_id: currentTicketId,
                                sender: "customer"
                            });
                        }
                    }, 3000);
                }
            });

            chatInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    sendChatMessage();
                }
            });
        }
    }

    // Send Chat Message (WebSocket Enhanced)
    async function sendChatMessage() {
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

        // Stop typing indicator
        if (socket) {
            socket.emit("typing_stop", {
                ticket_id: currentTicketId,
                sender: "customer"
            });
        }

        try {
            // Send via WebSocket if available, fallback to HTTP
            if (socket && socket.connected) {
                socket.emit("send_message", {
                    ticket_id: currentTicketId,
                    customer_id: CUSTOMER_ID,
                    message: message
                });

                // Optimistically add message to UI
                const tempMessage = {
                    sender_type: "customer",
                    sender_id: CUSTOMER_ID,
                    message: message,
                    created_at: new Date().toISOString()
                };
                appendMessage(tempMessage);
                input.value = "";
            } else {
                // Fallback to HTTP
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
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("An error occurred. Please try again.");
        } finally {
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
        }
    }

    // ============================================
    // TICKET SEARCH
    // ============================================

    function bindTicketSearch() {
        const searchInput = document.getElementById("ticketSearch");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
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
        }
    }

    // ============================================
    // CLOSE CONVERSATION
    // ============================================

    function bindCloseConversation() {
        const closeBtn = document.getElementById("closeConversation");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                const conversationPanel = document.getElementById("ticketConversation");
                if (conversationPanel) {
                    conversationPanel.classList.add("hidden");
                    currentTicketId = null;
                }
            });
        }
    }

    // ============================================
    // LOAD RECENT ORDERS
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
                        <button onclick="window.openSupportChat(${orderId})"
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

    // Raise Ticket from Order (Global function)
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
    // ENHANCED TICKET LOADING
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
                    onclick="window.openTicketConversation('${ticketId}')">
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
    // INLINE TICKET CONVERSATION
    // ============================================

    // Open Ticket Conversation (Inline) - Global function
    window.openTicketConversation = function(ticketId) {
        currentTicketId = ticketId;
        const conversationPanel = document.getElementById("ticketConversation");
        const ticketIdDisplay = document.getElementById("conversationTicketId");

        if (conversationPanel && ticketIdDisplay) {
            ticketIdDisplay.textContent = ticketId;
            conversationPanel.classList.remove("hidden");
            
            // Join Socket.IO room for this ticket
            joinTicketRoom(ticketId);

            // Request SLA timer
            socket.emit('request_sla_timer', { ticket_id: ticketId });

            // Load ticket details for SLA timer
            loadTicketDetails(ticketId);
            loadChatMessages(ticketId);

            // Mark messages as read
            markMessagesAsRead(ticketId);

            // Scroll conversation into view on mobile
            if (window.innerWidth < 1024) {
                conversationPanel.scrollIntoView({ behavior: "smooth" });
            }
        }

        lucide.createIcons();
    };

    // Load Ticket Details (for SLA timer)
    async function loadTicketDetails(ticketId) {
        try {
            const res = await fetch(`${SUPPORT_API}/tickets/${ticketId}`);
            if (res.ok) {
                const ticket = await res.json();
                if (ticket.sla_deadline) {
                    startSLATimer(ticket.sla_deadline);
                }
            }
        } catch (error) {
            console.error("Error loading ticket details:", error);
        }
    }

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
            
            // Mark as read
            markMessagesAsRead(ticketId);
        } catch (error) {
            console.error("Error loading messages:", error);
            chatDiv.innerHTML = '<div class="text-center text-gray-400 py-8">Error loading messages</div>';
        }
    }

    // Append single message (for real-time updates)
    function appendMessage(msg) {
        const chatDiv = document.getElementById("chatMessages");
        if (!chatDiv) return;

        // Remove loading/empty state if present
        if (chatDiv.innerHTML.includes("Loading") || chatDiv.innerHTML.includes("No messages")) {
            chatDiv.innerHTML = "";
        }

        const isCustomer = msg.sender_type === "customer" || msg.sender_id === CUSTOMER_ID;
        const senderName = isCustomer ? "You" : (msg.sender_name || "Support Agent");
        const senderInitial = senderName.charAt(0).toUpperCase();
        const messageText = escapeHtml(msg.message || msg.content || "");
        const timestamp = formatDate(msg.created_at || msg.timestamp);

        const messageHTML = `
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

        chatDiv.insertAdjacentHTML("beforeend", messageHTML);
        
        // Scroll to bottom
        chatDiv.scrollTop = chatDiv.scrollHeight;
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

    // ============================================
    // SLA TIMER
    // ============================================

    function startSLATimer(deadline) {
        // Clear existing timer
        if (slaTimerInterval) {
            clearInterval(slaTimerInterval);
        }

        const timerContainer = document.getElementById("slaTimerContainer");
        const timerElement = document.getElementById("slaTimer");
        
        if (!timerContainer || !timerElement) return;

        timerContainer.classList.remove("hidden");

        slaTimerInterval = setInterval(() => {
            const now = new Date();
            const deadlineDate = new Date(deadline);
            const diffMs = deadlineDate - now;
            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);

            if (diffMins < 0) {
                timerElement.textContent = "Overdue";
                timerElement.className = "font-semibold text-red-400";
                clearInterval(slaTimerInterval);
            } else if (diffMins < 10) {
                // Critical - less than 10 minutes
                timerElement.textContent = `${String(diffMins).padStart(2, "0")}:${String(diffSecs).padStart(2, "0")} left`;
                timerElement.className = "font-semibold text-red-400";
            } else {
                timerElement.textContent = `${String(diffMins).padStart(2, "0")}:${String(diffSecs).padStart(2, "0")} left`;
                timerElement.className = "font-semibold text-yellow-400";
            }
        }, 1000);
    }

    // ============================================
    // TYPING INDICATOR
    // ============================================

    function showTypingIndicator(senderName = "Support agent") {
        const indicator = document.getElementById("typingIndicator");
        const typingText = document.getElementById("typingText");
        
        if (indicator && typingText) {
            typingText.textContent = `${senderName} is typing...`;
            indicator.classList.remove("hidden");
        }
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById("typingIndicator");
        if (indicator) {
            indicator.classList.add("hidden");
        }
    }

    // ============================================
    // UNREAD MESSAGE BADGE
    // ============================================

    async function updateUnreadBadge(count = null) {
        // Try to get count from WebSocket first
        if (count === null) {
            try {
                const res = await fetch(`${SUPPORT_API}/tickets/unread-count?customer_id=${CUSTOMER_ID}`);
                if (res.ok) {
                    const data = await res.json();
                    count = data.count || 0;
                }
            } catch (error) {
                console.error("Error fetching unread count:", error);
                return;
            }
        }

        // Update sidebar badge
        const badge = document.getElementById("supportBadge");
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = "flex";
            } else {
                badge.style.display = "none";
            }
        }
    }

    // Mark messages as read
    async function markMessagesAsRead(ticketId) {
        try {
            await fetch(`${SUPPORT_API}/tickets/${ticketId}/mark-read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customer_id: CUSTOMER_ID
                })
            });
            
            // Update badge
            updateUnreadBadge();
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }

    // ============================================
    // AUTO-REFRESH (FALLBACK - Only if WebSocket fails)
    // ============================================

    // Only use polling if WebSocket is not available
    let pollingInterval = null;
    
    function startPolling() {
        if (socket && socket.connected) {
            // WebSocket is active, no need for polling
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
            return;
        }

        // Start polling as fallback
        if (!pollingInterval) {
            pollingInterval = setInterval(() => {
                if (CUSTOMER_ID) {
                    loadTickets();
                    if (currentTicketId) {
                        loadChatMessages(currentTicketId);
                    }
                }
            }, 15000);
        }
    }

    // Check WebSocket status periodically
    setInterval(() => {
        startPolling();
    }, 5000);

    // ============================================
    // SOCKET.IO REAL-TIME CHAT
    // ============================================

    // Initialize Socket.IO connection
    // HARD-LOCK polling (Passenger doesn't support WebSocket upgrades)
    socket = io(window.location.origin, {
        path: "/socket.io",
        transports: ["polling"],  // FORCE polling only
        upgrade: false,  // PREVENT WebSocket upgrade
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    // Socket connection events
    socket.on('connect', () => {
        console.log('✅ Connected to support chat');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from support chat');
    });

    socket.on('system_message', (data) => {
        console.log('System:', data.msg);
    });

    socket.on('error', (data) => {
        console.error('Socket error:', data.msg);
        if (typeof addAIMessage === 'function') {
            addAIMessage('system', `Error: ${data.msg}`);
        }
    });

    // ============================================
    // AI SUPPORT CHAT SYSTEM
    // ============================================

    let activeOrder = null;
    let activeTicketId = null;
    let currentTicketRoom = null;
    // typingTimeout already declared above, don't redeclare

    // Open AI Chat (Global function)
    window.openSupportChat = function(orderId) {
        activeOrder = orderId;
        const chatModal = document.getElementById("supportChat");
        
        if (chatModal) {
            chatModal.classList.remove("hidden");
            chatModal.classList.add("flex");
            
            // Clear previous messages
            const messagesContainer = document.getElementById("chatMessages");
            if (messagesContainer) {
                messagesContainer.innerHTML = "";
            }
            
            // Emit start_support event via Socket.IO (Flipkart-style guided flow)
            if (socket && socket.connected) {
                socket.emit("start_support", {
                    order_id: orderId,
                    customer_id: CUSTOMER_ID
                });
            } else {
                // Fallback: show welcome message if Socket.IO not connected
                aiWelcome();
            }
            
            // Focus input
            const chatInput = document.getElementById("chatInput");
            if (chatInput) {
                setTimeout(() => chatInput.focus(), 100);
            }
            
            // Reinitialize icons
            if (window.lucide) lucide.createIcons();
        }
    };

    // Select Issue (Global function for Flipkart-style buttons)
    window.selectIssue = function(issueKey, ticketId) {
        if (!socket || !socket.connected) {
            alert("Connection lost. Please refresh the page.");
            return;
        }
        
        // Emit issue_selected event
        socket.emit("issue_selected", {
            issue_key: issueKey,
            ticket_id: ticketId || currentTicketRoom,
            order_id: activeOrder
        });
        
        // Remove the buttons (they're replaced by AI response)
        const buttons = document.querySelectorAll('button[onclick*="selectIssue"]');
        buttons.forEach(btn => btn.remove());
    };

    // Close AI Chat (Global function)
    window.closeSupportChat = function() {
        const chatModal = document.getElementById("supportChat");
        if (chatModal) {
            chatModal.classList.add("hidden");
            chatModal.classList.remove("flex");
            
            // Leave Socket.IO room
            leaveTicketRoom();
            
            activeOrder = null;
            activeTicketId = null;
            currentTicketRoom = null;
        }
    };

    // AI Welcome Message
    function aiWelcome() {
        if (!activeOrder) return;
        
        const welcomeText = `Hi 👋 I'm Impromptu AI Support.\n\n` +
            `I see you need help with Order #${activeOrder}.\n\n` +
            `What issue are you facing?\n\n` +
            `1️⃣ Delivery Delay\n` +
            `2️⃣ Payment Issue\n` +
            `3️⃣ Quality Problem\n` +
            `4️⃣ Refund Request\n` +
            `5️⃣ Other Issue`;
        
        addAIMessage("ai", welcomeText);
    }

    // Add Message to Chat
    function addAIMessage(type, text) {
        const messagesContainer = document.getElementById("chatMessages");
        if (!messagesContainer) return;

        const messageDiv = document.createElement("div");
        messageDiv.className = type === "ai" 
            ? "text-left mb-2" 
            : "text-right mb-2";

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = type === "ai"
            ? "inline-block max-w-[80%] px-3 py-2 rounded-lg bg-gray-700 text-white text-sm whitespace-pre-wrap"
            : "inline-block max-w-[80%] px-3 py-2 rounded-lg bg-yellow-400 text-black text-sm whitespace-pre-wrap";
        
        bubbleDiv.textContent = text;
        messageDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(messageDiv);

        // Auto scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show/Hide Typing Indicator
    function showAITyping(state) {
        const typingIndicator = document.getElementById("typingIndicator");
        if (typingIndicator) {
            typingIndicator.style.display = state ? "block" : "none";
        }
    }

    // Send AI Message (Global function)
    window.sendAIMessage = async function() {
        const chatInput = document.getElementById("chatInput");
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // If ticket exists, use Socket.IO for real-time chat
        if (activeTicketId && currentTicketRoom) {
            // Send via Socket.IO
            sendSocketMessage(message);
            addAIMessage("customer", message);
            chatInput.value = "";
            return;
        }

        // Otherwise, use AI chat API (for initial ticket creation)
        // Add customer message to chat
        addAIMessage("customer", message);
        chatInput.value = "";

        // Show typing indicator
        showAITyping(true);

        try {
            const response = await fetch(`${SUPPORT_API}/ai-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CUSTOMER_TOKEN || ""}`
                },
                body: JSON.stringify({
                    message: message,
                    order_id: activeOrder,
                    ticket_id: activeTicketId,
                    customer_id: CUSTOMER_ID
                })
            });

            const data = await response.json();

            // Hide typing indicator
            showAITyping(false);

            if (data.error) {
                addAIMessage("ai", `Sorry, I encountered an error: ${data.error}`);
                return;
            }

            // Add AI reply
            if (data.reply) {
                addAIMessage("ai", data.reply);
            }

            // Store ticket ID if created
            if (data.ticket_id) {
                activeTicketId = data.ticket_id;
                
                // Join Socket.IO room for this ticket
                joinTicketRoom(data.ticket_id);
                
                // Show ticket created message
                setTimeout(() => {
                    addAIMessage("ai", `\n✅ Your support ticket has been created: ${data.ticket_id}\nAn agent will join this conversation shortly.`);
                }, 500);
                
                // Refresh tickets list
                if (typeof loadTickets === "function") {
                    loadTickets();
                }
            }

        } catch (error) {
            console.error("Error sending AI message:", error);
            showAITyping(false);
            addAIMessage("ai", "Sorry, I'm having trouble connecting. Please try again.");
        }
    };

    // Add typing indicator to chat input
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            if (currentTicketRoom) {
                handleTyping();
            }
        });
    }

    // ============================================
    // SOCKET.IO TICKET ROOM FUNCTIONS
    // ============================================

    // Join ticket room
    function joinTicketRoom(ticketId) {
        if (!ticketId || !CUSTOMER_ID) return;
        
        currentTicketRoom = ticketId;
        
        socket.emit('join_ticket', {
            ticket_id: ticketId,
            user_type: 'customer',
            user_id: CUSTOMER_ID
        });
        
        console.log(`Joined ticket room: ${ticketId}`);
    }

    // Leave ticket room
    function leaveTicketRoom() {
        if (currentTicketRoom) {
            socket.emit('leave_ticket', {
                ticket_id: currentTicketRoom
            });
            currentTicketRoom = null;
        }
    }

    // Send message via Socket.IO
    function sendSocketMessage(message) {
        if (!currentTicketRoom || !message.trim()) return;
        
        socket.emit('send_message', {
            ticket_id: currentTicketRoom,
            message: message,
            sender: 'customer',
            sender_id: CUSTOMER_ID,
            sender_name: 'Customer'
        });
    }

    // Handle typing indicator
    function handleTyping() {
        if (!currentTicketRoom) return;
        
        socket.emit('typing', {
            ticket_id: currentTicketRoom,
            user_type: 'customer',
            user_id: CUSTOMER_ID
        });
        
        // Clear previous timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        // Stop typing after 2 seconds of inactivity
        typingTimeout = setTimeout(() => {
            socket.emit('stop_typing', {
                ticket_id: currentTicketRoom
            });
        }, 2000);
    }

    // Socket.IO event listeners
    socket.on('receive_message', (data) => {
        const senderType = data.sender === 'customer' ? 'customer' : 'ai';
        addAIMessage(senderType, data.message);
    });

    socket.on('show_typing', (data) => {
        if (data.user_type !== 'customer') {
            showAITyping(true);
        }
    });

    socket.on('hide_typing', () => {
        showAITyping(false);
    });

    socket.on('sla_timer', (data) => {
        startSLATimer(data.sla_due_at);
    });

    socket.on('ticket_escalated', (data) => {
        addAIMessage('system', data.message || '⚠️ Ticket has been escalated to senior support');
    });

    socket.on('user_joined', (data) => {
        if (data.user_type === 'agent') {
            addAIMessage('system', `👤 Support agent joined the conversation`);
        }
    });

    socket.on('ticket_created', (data) => {
        // Store ticket ID when created via Socket.IO
        if (data.ticket_id) {
            activeTicketId = data.ticket_id;
            currentTicketRoom = data.ticket_id_raw || data.ticket_id;
            
            // Refresh tickets list
            if (typeof loadTickets === "function") {
                loadTickets();
            }
        }
    });

    // Flipkart-style guided support events
    socket.on('ai_message', (data) => {
        // Display AI message
        if (data.text) {
            addAIMessage('ai', data.text);
        }
    });

    socket.on('ai_options', (data) => {
        // Display issue option buttons (Flipkart-style)
        if (data.options && Array.isArray(data.options)) {
            const messagesContainer = document.getElementById("chatMessages");
            if (messagesContainer) {
                const optionsHtml = data.options.map(opt => `
                    <button onclick="selectIssue('${opt.key}', '${data.ticket_id || activeTicketId}')"
                        class="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg mb-2 transition-colors">
                        ${opt.title}
                    </button>
                `).join('');
                
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'mt-3 space-y-2';
                optionsContainer.innerHTML = optionsHtml;
                messagesContainer.appendChild(optionsContainer);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    });

    socket.on('agent_joined', (data) => {
        // Agent has joined the conversation
        if (data.message) {
            addAIMessage('system', data.message);
        }
    });

    // ============================================
    // START INITIALIZATION
    // ============================================

    initSupportPage();
});
