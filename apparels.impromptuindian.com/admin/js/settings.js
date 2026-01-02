// settings.js – admin platform configuration (mock)

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

let currentTab = 'branding';

// Mock settings data
const settings = {
    branding: {
        platformName: 'Threadly',
        logo: '',
        primaryColor: '#1273EB',
        secondaryColor: '#10b981'
    },
    commission: {
        defaultRate: 15,
        minimumRate: 10,
        maximumRate: 25
    },
    penalties: {
        lateDeliveryEnabled: true,
        penaltyPerHour: 50,
        maxPenalty: 500
    },
    sla: {
        vendorProductionDays: 3,
        riderDeliveryHours: 24,
        autoEscalation: true
    },
    notifications: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true
    },
    payment: {
        gateway: 'razorpay',
        apiKey: '',
        secretKey: ''
    }
};

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderSettings();
}

function renderSettings() {
    const container = document.getElementById('settings-content');

    switch (currentTab) {
        case 'branding':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">Platform Branding</h3>
          <div class="form-group">
            <label class="form-label">Platform Name</label>
            <input type="text" class="form-input" id="platform-name" value="${settings.branding.platformName}" />
          </div>
          <div class="form-group">
            <label class="form-label">Logo Upload</label>
            <input type="file" class="form-input" accept="image/*" />
            <p class="form-help">Recommended size: 200x50px, PNG format</p>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Color</label>
            <div class="color-picker-group">
              <input type="color" class="form-input" id="primary-color" value="${settings.branding.primaryColor}" style="width: 80px;" />
              <div class="color-preview" style="background: ${settings.branding.primaryColor};"></div>
              <span>${settings.branding.primaryColor}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Secondary Color</label>
            <div class="color-picker-group">
              <input type="color" class="form-input" id="secondary-color" value="${settings.branding.secondaryColor}" style="width: 80px;" />
              <div class="color-preview" style="background: ${settings.branding.secondaryColor};"></div>
              <span>${settings.branding.secondaryColor}</span>
            </div>
          </div>
        </div>
      `;
            break;

        case 'commission':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">Commission Configuration</h3>
          <div class="form-group">
            <label class="form-label">Default Commission Rate (%)</label>
            <input type="number" class="form-input" id="default-commission" value="${settings.commission.defaultRate}" min="0" max="100" />
            <p class="form-help">Applied to new vendors by default</p>
          </div>
          <div class="form-group">
            <label class="form-label">Minimum Commission Rate (%)</label>
            <input type="number" class="form-input" id="min-commission" value="${settings.commission.minimumRate}" min="0" max="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Maximum Commission Rate (%)</label>
            <input type="number" class="form-input" id="max-commission" value="${settings.commission.maximumRate}" min="0" max="100" />
          </div>
        </div>
      `;
            break;

        case 'penalties':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">Late Delivery Penalties</h3>
          <div class="toggle-container">
            <span class="toggle-label">Enable Late Delivery Penalties</span>
            <div class="toggle-switch ${settings.penalties.lateDeliveryEnabled ? 'active' : ''}" onclick="togglePenalties()"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Penalty Per Hour (₹)</label>
            <input type="number" class="form-input" id="penalty-per-hour" value="${settings.penalties.penaltyPerHour}" min="0" />
            <p class="form-help">Amount deducted from vendor payout for each hour of delay</p>
          </div>
          <div class="form-group">
            <label class="form-label">Maximum Penalty (₹)</label>
            <input type="number" class="form-input" id="max-penalty" value="${settings.penalties.maxPenalty}" min="0" />
            <p class="form-help">Cap on total penalty amount per order</p>
          </div>
        </div>
      `;
            break;

        case 'sla':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">SLA Rules</h3>
          <div class="form-group">
            <label class="form-label">Vendor Production Timeline (Days)</label>
            <input type="number" class="form-input" id="vendor-timeline" value="${settings.sla.vendorProductionDays}" min="1" />
            <p class="form-help">Standard production time expected from vendors</p>
          </div>
          <div class="form-group">
            <label class="form-label">Rider Delivery Timeline (Hours)</label>
            <input type="number" class="form-input" id="rider-timeline" value="${settings.sla.riderDeliveryHours}" min="1" />
            <p class="form-help">Standard delivery time expected from riders</p>
          </div>
          <div class="toggle-container">
            <span class="toggle-label">Auto-Escalation on SLA Breach</span>
            <div class="toggle-switch ${settings.sla.autoEscalation ? 'active' : ''}" onclick="toggleEscalation()"></div>
          </div>
        </div>
      `;
            break;

        case 'notifications':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">Notification Settings</h3>
          <div class="toggle-container">
            <span class="toggle-label">Email Notifications</span>
            <div class="toggle-switch ${settings.notifications.emailEnabled ? 'active' : ''}" onclick="toggleEmail()"></div>
          </div>
          <div class="toggle-container">
            <span class="toggle-label">SMS Notifications</span>
            <div class="toggle-switch ${settings.notifications.smsEnabled ? 'active' : ''}" onclick="toggleSMS()"></div>
          </div>
          <div class="toggle-container">
            <span class="toggle-label">Push Notifications</span>
            <div class="toggle-switch ${settings.notifications.pushEnabled ? 'active' : ''}" onclick="togglePush()"></div>
          </div>
          <div class="form-group mt-4">
            <label class="form-label">Custom Notification Templates</label>
            <textarea class="form-textarea" placeholder="Enter custom notification templates..."></textarea>
          </div>
        </div>
      `;
            break;

        case 'payment':
            container.innerHTML = `
        <div class="settings-section">
          <h3 class="section-title">Payment Gateway Configuration</h3>
          <div class="form-group">
            <label class="form-label">Payment Gateway</label>
            <select class="form-select" id="payment-gateway">
              <option value="razorpay" ${settings.payment.gateway === 'razorpay' ? 'selected' : ''}>Razorpay</option>
              <option value="stripe" ${settings.payment.gateway === 'stripe' ? 'selected' : ''}>Stripe</option>
              <option value="paytm" ${settings.payment.gateway === 'paytm' ? 'selected' : ''}>Paytm</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">API Key</label>
            <input type="text" class="form-input" id="api-key" value="${settings.payment.apiKey}" placeholder="Enter API key" />
          </div>
          <div class="form-group">
            <label class="form-label">Secret Key</label>
            <input type="password" class="form-input" id="secret-key" value="${settings.payment.secretKey}" placeholder="Enter secret key" />
            <p class="form-help">Keep this secure and never share publicly</p>
          </div>
        </div>
      `;
            break;
    }

    if (window.lucide) lucide.createIcons();
}

function togglePenalties() {
    settings.penalties.lateDeliveryEnabled = !settings.penalties.lateDeliveryEnabled;
    renderSettings();
}

function toggleEscalation() {
    settings.sla.autoEscalation = !settings.sla.autoEscalation;
    renderSettings();
}

function toggleEmail() {
    settings.notifications.emailEnabled = !settings.notifications.emailEnabled;
    renderSettings();
}

function toggleSMS() {
    settings.notifications.smsEnabled = !settings.notifications.smsEnabled;
    renderSettings();
}

function togglePush() {
    settings.notifications.pushEnabled = !settings.notifications.pushEnabled;
    renderSettings();
}

function saveSettings() {
    // Collect all form values and update settings object
    showToast('All settings saved successfully!');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    renderSettings();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
