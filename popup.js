// Popup script for SilentGuardian
class SilentGuardianPopup {
  constructor() {
    this.settings = {};
    this.currentTab = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.getCurrentTab();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        this.settings = response.settings || {};
      } else {
        throw new Error('Chrome runtime not available');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings when Chrome APIs are not available
      this.settings = {
        trackerBlockingEnabled: true,
        consentAction: 'reject',
        showNotifications: true,
        disabledDomains: []
      };
    }
  }

  async getCurrentTab() {
    try {
      if (chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tab;
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
      this.currentTab = null;
    }
  }

  setupEventListeners() {
    // Site toggle
    const siteToggle = document.getElementById('siteToggle');
    siteToggle.addEventListener('change', (e) => {
      this.toggleSiteProtection(e.target.checked);
    });

    // Tracker blocking toggle
    const trackerToggle = document.getElementById('trackerBlockingToggle');
    trackerToggle.addEventListener('change', (e) => {
      this.updateSetting('trackerBlockingEnabled', e.target.checked);
    });

    // Consent action select
    const consentSelect = document.getElementById('consentActionSelect');
    consentSelect.addEventListener('change', (e) => {
      this.updateSetting('consentAction', e.target.value);
    });

    // Notifications toggle
    const notificationsToggle = document.getElementById('notificationsToggle');
    notificationsToggle.addEventListener('change', (e) => {
      this.updateSetting('showNotifications', e.target.checked);
    });

    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelpPage();
    });
  }

  updateUI() {
    this.updateStatus();
    this.updateSiteInfo();
    this.updateSettings();
  }

  updateStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    const currentDomain = this.getCurrentDomain();
    const isEnabled = this.isProtectionEnabled(currentDomain);
    
    if (isEnabled && this.settings.trackerBlockingEnabled) {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Active';
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Inactive';
    }
  }

  updateSiteInfo() {
    const domainElement = document.getElementById('currentDomain');
    const statusElement = document.getElementById('siteProtectionStatus');
    const siteToggle = document.getElementById('siteToggle');

    const currentDomain = this.getCurrentDomain();
    domainElement.textContent = currentDomain || 'Unknown domain';

    const isProtected = this.isProtectionEnabled(currentDomain);
    siteToggle.checked = isProtected;
    
    if (isProtected) {
      statusElement.textContent = 'Protected';
      statusElement.className = 'site-status';
    } else {
      statusElement.textContent = 'Disabled';
      statusElement.className = 'site-status disabled';
    }
  }

  updateSettings() {
    // Tracker blocking toggle
    const trackerToggle = document.getElementById('trackerBlockingToggle');
    trackerToggle.checked = this.settings.trackerBlockingEnabled !== false;

    // Consent action select
    const consentSelect = document.getElementById('consentActionSelect');
    consentSelect.value = this.settings.consentAction || 'reject';

    // Notifications toggle
    const notificationsToggle = document.getElementById('notificationsToggle');
    notificationsToggle.checked = this.settings.showNotifications !== false;
  }

  getCurrentDomain() {
    if (this.currentTab && this.currentTab.url) {
      try {
        const url = new URL(this.currentTab.url);
        return url.hostname;
      } catch (error) {
        console.error('Failed to parse URL:', error);
      }
    }
    return null;
  }

  isProtectionEnabled(domain) {
    if (!domain) return false;
    const disabledDomains = this.settings.disabledDomains || [];
    return !disabledDomains.includes(domain);
  }

  async toggleSiteProtection(enabled) {
    try {
      const domain = this.getCurrentDomain();
      if (!domain) {
        alert('Cannot determine current domain. Please refresh the page and try again.');
        return;
      }

      let disabledDomains = this.settings.disabledDomains || [];
      
      if (enabled) {
        // Remove from disabled list
        disabledDomains = disabledDomains.filter(d => d !== domain);
      } else {
        // Add to disabled list
        if (!disabledDomains.includes(domain)) {
          disabledDomains.push(domain);
        }
      }

      await this.updateSetting('disabledDomains', disabledDomains);
      
      // Reload the tab to apply changes (only if we have tab reference)
      if (this.currentTab && chrome.tabs && chrome.tabs.reload) {
        chrome.tabs.reload(this.currentTab.id);
      }
      
      // Update UI immediately
      this.updateStatus();
      this.updateSiteInfo();
      
    } catch (error) {
      console.error('Failed to toggle site protection:', error);
    }
  }

  async updateSetting(key, value) {
    try {
      this.settings[key] = value;
      
      if (chrome.runtime && chrome.runtime.sendMessage) {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: { [key]: value }
        });
      } else {
        console.warn('Chrome runtime not available, settings will not persist');
      }
      
      // Update UI if needed
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  }

  openHelpPage() {
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({
        url: 'https://yasinuddowla.com',
        active: true
      });
    } else {
      // Fallback: open in same window
      window.open('https://yasinuddowla.com', '_blank');
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SilentGuardianPopup();
});
