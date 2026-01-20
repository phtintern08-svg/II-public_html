// ticket-details.js - Ticket Details Page JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Get ticket ID from URL
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id') || 'TKT-001';

// Mock ticket data (will be replaced with API calls)
const ticketData = {
    id: ticketId,
    created: '2025-01-20 14:30:00',
    userName: 'John Doe',
    userRole: 'Customer',
    contact: 'john@example.com / +91 9876543210',
    orderId: 'ORD-12345',
    vendorRider: 'Vendor: ABC Prints, Rider: Rider-001',
    priority: 'Critical',
    status: 'Open',
    assignedAgent: 'Agent Smith',
    description: 'Order was supposed to be delivered yesterday but still not received. Need urgent resolution.',
    attachments: [
        { name: 'proof.jpg', type: 'image' },
        { name: 'invoice.pdf', type: 'document' }
    ],
    messages: [
        {
            sender: 'user',
            senderName: 'John Doe',
            message: 'Order was supposed to be delivered yesterday but still not received.',
            timestamp: '2025-01-20 14:30:00',
            attachments: []
        },
        {
            sender: 'support',
            senderName: 'Agent Smith',
            message: 'I understand your concern. Let me check the order status and get back to you shortly.',
            timestamp: '2025-01-20 14:35:00',
            attachments: []
        }
    ]
};

// Fetch ticket details from API (placeholder)
async function fetchTicketDetails() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch(`/api/support/tickets/${ticketId}`);
        // if (response.ok) {
        //     const data = await response.json();
        //     updateTicketInfo(data);
        //     renderChatMessages(data.messages);
        // }
        
        updateTicketInfo(ticketData);
        renderChatMessages(ticketData.messages);
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        updateTicketInfo(ticketData);
        renderChatMessages(ticketData.messages);
    }
}

// Update ticket information
function updateTicketInfo(data) {
    document.getElementById('ticket-id').textContent = `Ticket ${data.id}`;
    document.getElementById('info-ticket-id').textContent = data.id;
    document.getElementById('info-created').textContent = data.created;
    document.getElementById('info-user-name').textContent = data.userName;
    document.getElementById('info-user-role').textContent = data.userRole;
    document.getElementById('info-contact').textContent = data.contact;
    document.getElementById('info-order-id').textContent = data.orderId || 'N/A';
    document.getElementById('info-vendor-rider').textContent = data.vendorRider || 'N/A';
    
    const priorityClass = data.priority === 'Critical' ? 'status-overdue' : 
                         data.priority === 'High' ? 'status-pending' : 
                         data.priority === 'Medium' ? 'status-in-progress' : 'status-resolved';
    document.getElementById('info-priority').innerHTML = `<span class="${priorityClass}">${data.priority}</span>`;
    
    const statusClass = data.status === 'Open' ? 'status-open' : 
                       data.status === 'In Progress' ? 'status-in-progress' : 
                       data.status === 'Resolved' ? 'status-resolved' : 'status-closed';
    document.getElementById('info-status').innerHTML = `<span class="${statusClass}">${data.status}</span>`;
    
    document.getElementById('info-assigned-agent').textContent = data.assignedAgent || 'Unassigned';
    document.getElementById('issue-description').textContent = data.description;
    
    // Render attachments
    const attachmentsDiv = document.getElementById('issue-attachments');
    if (data.attachments && data.attachments.length > 0) {
        attachmentsDiv.innerHTML = data.attachments.map(att => `
            <div class="flex items-center gap-2 p-2 bg-gray-800 rounded">
                <i data-lucide="${att.type === 'image' ? 'image' : 'file'}" class="w-4 h-4"></i>
                <span class="text-sm">${att.name}</span>
                <button class="btn-secondary text-xs ml-auto">View</button>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    } else {
        attachmentsDiv.innerHTML = '<p class="text-gray-400 text-sm">No attachments</p>';
    }
}

// Render chat messages
function renderChatMessages(messages) {
    const chatDiv = document.getElementById('chat-messages');
    if (!chatDiv) return;

    if (messages.length === 0) {
        chatDiv.innerHTML = '<div class="p-4 text-center text-gray-400">No messages yet. Start the conversation!</div>';
        return;
    }

    chatDiv.innerHTML = messages.map(msg => {
        const isUser = msg.sender === 'user';
        return `
            <div class="chat-message ${isUser ? 'user' : 'support'}">
                <div class="chat-avatar">${msg.senderName.charAt(0).toUpperCase()}</div>
                <div class="chat-content">
                    <div class="chat-bubble">
                        <p class="text-white">${msg.message}</p>
                        ${msg.attachments && msg.attachments.length > 0 ? msg.attachments.map(att => `
                            <div class="chat-attachment">
                                <i data-lucide="paperclip" class="w-4 h-4"></i>
                                <span class="text-sm">${att.name}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                    <p class="chat-time">${msg.timestamp}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    chatDiv.scrollTop = chatDiv.scrollHeight;
    
    if (window.lucide) lucide.createIcons();
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch(`/api/support/tickets/${ticketId}/messages`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ message })
        // });
        
        // Add message to UI immediately
        const newMessage = {
            sender: 'support',
            senderName: 'You',
            message: message,
            timestamp: new Date().toLocaleString(),
            attachments: []
        };
        
        ticketData.messages.push(newMessage);
        renderChatMessages(ticketData.messages);
        input.value = '';
        
        showToast('Message sent!');
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchTicketDetails();

    // Bind send button
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);
    
    // Send on Enter key
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
