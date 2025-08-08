// Background service worker for SilentGuardian
class SilentGuardianBackground {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation/startup
    chrome.runtime.onStartup.addListener(() => this.onStartup());
    chrome.runtime.onInstalled.addListener((details) => this.onInstalled(details));
    
    // Listen for tab updates to inject consent dialog detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async onStartup() {
    console.log('SilentGuardian starting up...');
    await this.initializeSettings();
  }

  async onInstalled(details) {
    console.log('SilentGuardian installed:', details.reason);
    
    if (details.reason === 'install') {
      // Set default settings on first install
      await this.setDefaultSettings();
    }
  }

  async initializeSettings() {
    const settings = await chrome.storage.sync.get({
      trackerBlockingEnabled: true,
      consentAction: 'reject', // 'accept', 'reject', 'dismiss'
      enabledDomains: [],
      disabledDomains: [],
      showNotifications: true
    });

    // Ensure settings are stored
    await chrome.storage.sync.set(settings);
  }

  async setDefaultSettings() {
    const defaultSettings = {
      trackerBlockingEnabled: true,
      consentAction: 'reject',
      enabledDomains: [],
      disabledDomains: [],
      showNotifications: true,
      blockedTrackersCount: 0
    };

    await chrome.storage.sync.set(defaultSettings);
  }

  async handleTabUpdate(tabId, tab) {
    try {
      const settings = await chrome.storage.sync.get(['trackerBlockingEnabled', 'disabledDomains']);
      const url = new URL(tab.url);
      const domain = url.hostname;

      // Check if protection is disabled for this domain
      if (settings.disabledDomains.includes(domain)) {
        return;
      }

      // Inject consent dialog detection if enabled
      if (settings.trackerBlockingEnabled) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['scripts/consent-detector.js']
        }).catch(err => {
          // Ignore errors for pages we can't inject into (chrome://, etc.)
          if (!err.message.includes('Cannot access')) {
            console.warn('Failed to inject consent detector:', err);
          }
        });
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'CONSENT_DIALOG_DETECTED':
          await this.handleConsentDialogDetected(message.data, sender.tab);
          sendResponse({ success: true });
          break;

        case 'TRACKER_BLOCKED':
          await this.incrementBlockedCount();
          sendResponse({ success: true });
          break;

        case 'GET_SETTINGS':
          const settings = await chrome.storage.sync.get();
          sendResponse({ settings });
          break;

        case 'UPDATE_SETTINGS':
          await chrome.storage.sync.set(message.settings);
          sendResponse({ success: true });
          break;

        case 'GET_STATS':
          const stats = await this.getStats(sender.tab?.url);
          sendResponse({ stats });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleConsentDialogDetected(dialogData, tab) {
    const settings = await chrome.storage.sync.get(['consentAction', 'showNotifications']);
    
    if (settings.showNotifications) {
      // Update badge to show consent dialog was detected
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: '!'
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: '#ff6b35'
      });
    }

    // Log the detection for debugging
    console.log('Consent dialog detected on', tab.url, dialogData);
  }

  async incrementBlockedCount() {
    const result = await chrome.storage.sync.get(['blockedTrackersCount']);
    const newCount = (result.blockedTrackersCount || 0) + 1;
    await chrome.storage.sync.set({ blockedTrackersCount: newCount });
  }

  async getStats(url) {
    const settings = await chrome.storage.sync.get();
    const domain = url ? new URL(url).hostname : '';
    
    return {
      totalBlocked: settings.blockedTrackersCount || 0,
      isEnabled: settings.trackerBlockingEnabled && !settings.disabledDomains.includes(domain),
      currentDomain: domain
    };
  }
}

// Initialize the background service
new SilentGuardianBackground();
