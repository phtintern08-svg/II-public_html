// settings.js - Support Settings JavaScript

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Fetch settings from API (placeholder)
async function fetchSettings() {
    try {
        // TODO: Replace with actual API call
        // const response = await ImpromptuIndianApi.fetch('/api/support/settings');
        // if (response.ok) {
        //     const settings = await response.json();
        //     updateSettingsDisplay(settings);
        // }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

// Save SLA settings
async function saveSLASettings() {
    const settings = {
        critical: parseInt(document.getElementById('sla-critical').value),
        high: parseInt(document.getElementById('sla-high').value),
        medium: parseInt(document.getElementById('sla-medium').value),
        low: parseInt(document.getElementById('sla-low').value)
    };

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch('/api/support/settings/sla', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(settings)
        // });
        
        showToast('SLA settings saved successfully!');
    } catch (error) {
        console.error('Error saving SLA settings:', error);
        showToast('Failed to save SLA settings');
    }
}

// Save escalation settings
async function saveEscalationSettings() {
    const settings = {
        enabled: document.getElementById('auto-escalate-enabled').checked,
        threshold: parseInt(document.getElementById('escalation-threshold').value),
        autoUpgrade: document.getElementById('auto-upgrade-priority').checked
    };

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch('/api/support/settings/escalation', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(settings)
        // });
        
        showToast('Escalation settings saved successfully!');
    } catch (error) {
        console.error('Error saving escalation settings:', error);
        showToast('Failed to save escalation settings');
    }
}

// Save notification settings
async function saveNotificationSettings() {
    const settings = {
        notifyOverdue: document.getElementById('notify-overdue').checked,
        notifyEscalation: document.getElementById('notify-escalation').checked,
        notifyCritical: document.getElementById('notify-critical').checked
    };

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch('/api/support/settings/notifications', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(settings)
        // });
        
        showToast('Notification settings saved successfully!');
    } catch (error) {
        console.error('Error saving notification settings:', error);
        showToast('Failed to save notification settings');
    }
}

// Save internal notes settings
async function saveInternalNotesSettings() {
    const settings = {
        enabled: document.getElementById('internal-notes-enabled').checked
    };

    try {
        // TODO: Replace with actual API call
        // await ImpromptuIndianApi.fetch('/api/support/settings/internal-notes', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(settings)
        // });
        
        showToast('Internal notes settings saved successfully!');
    } catch (error) {
        console.error('Error saving internal notes settings:', error);
        showToast('Failed to save internal notes settings');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    fetchSettings();
});
