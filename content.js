// Content script for SilentGuardian - runs on all pages
class SilentGuardianContent {
  constructor() {
    this.blockedRequests = 0;
    this.consentDialogDetected = false;
    this.init();
  }

  init() {
    // Start monitoring immediately
    this.startTrackerBlocking();
    this.startConsentDialogDetection();

    // Listen for DOM changes
    this.observeDOM();

    console.log('SilentGuardian content script loaded');
  }

  startTrackerBlocking() {
    // Intercept and block known tracking scripts
    this.blockTrackingScripts();
    this.blockTrackingPixels();
  }

  blockTrackingScripts() {
    const trackerDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com/tr',
      'connect.facebook.net',
      'doubleclick.net',
      'googlesyndication.com',
      'amazon-adsystem.com',
      'outbrain.com',
      'taboola.com',
      'criteo.com',
      'adsystem.amazon.com'
    ];

    // Block script loading
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName) {
      const element = originalCreateElement(tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = function(name, value) {
          if (name === 'src' && value) {
            if (trackerDomains.some(domain => value.includes(domain))) {
              console.log('SilentGuardian: Blocked tracking script:', value);
              this.blockedRequests++;
              return; // Don't set the src, effectively blocking the script
            }
          }
          return originalSetAttribute(name, value);
        };
      }
      
      return element;
    };
  }

  blockTrackingPixels() {
    // Block tracking pixels (1x1 images)
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName) {
      const element = originalCreateElement(tagName);
      
      if (tagName.toLowerCase() === 'img') {
        const originalSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = function(name, value) {
          if (name === 'src' && value) {
            // Check for tracking pixel patterns
            if (value.includes('facebook.com/tr') || 
                value.includes('google-analytics.com') ||
                value.includes('doubleclick.net') ||
                (element.width === 1 && element.height === 1)) {
              console.log('SilentGuardian: Blocked tracking pixel:', value);
              this.blockedRequests++;
              return; // Block the tracking pixel
            }
          }
          return originalSetAttribute(name, value);
        };
      }
      
      return element;
    };
  }

  startConsentDialogDetection() {
    // Common consent dialog selectors and patterns
    this.consentSelectors = [
      // Generic patterns
      '[class*="cookie"]',
      '[class*="consent"]',
      '[class*="gdpr"]',
      '[class*="privacy"]',
      '[id*="cookie"]',
      '[id*="consent"]',
      '[id*="gdpr"]',
      
      // Specific dialog libraries
      '.cc-window', // Cookie Consent library
      '#cookieNotice',
      '.cookie-banner',
      '.privacy-notice',
      '.consent-banner',
      '.gdpr-banner',
      
      // Modal patterns
      '[role="dialog"]',
      '.modal',
      '.overlay'
    ];

    this.detectConsentDialogs();
  }

  detectConsentDialogs() {
    // Check for consent dialogs every 500ms for the first 10 seconds
    let checks = 0;
    const maxChecks = 20;
    
    const checkInterval = setInterval(() => {
      checks++;
      
      if (this.findAndHandleConsentDialog() || checks >= maxChecks) {
        clearInterval(checkInterval);
      }
    }, 500);
  }

  findAndHandleConsentDialog() {
    for (const selector of this.consentSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (this.isLikelyConsentDialog(element)) {
          this.handleConsentDialog(element);
          return true;
        }
      }
    }
    return false;
  }

  isLikelyConsentDialog(element) {
    const text = element.textContent.toLowerCase();
    const consentKeywords = [
      'cookie', 'consent', 'privacy', 'gdpr', 'accept', 'reject', 
      'agree', 'terms', 'policy', 'tracking', 'personalized',
      'necessary cookies', 'analytics'
    ];

    // Must be visible
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Must contain consent-related keywords
    const hasConsentKeywords = consentKeywords.some(keyword => text.includes(keyword));
    
    // Must be positioned prominently (likely overlay/modal)
    const isOverlay = style.position === 'fixed' || style.position === 'absolute';
    const hasHighZIndex = parseInt(style.zIndex) > 100;
    
    return hasConsentKeywords && (isOverlay || hasHighZIndex);
  }

  async handleConsentDialog(element) {
    if (this.consentDialogDetected) return; // Already handled
    
    this.consentDialogDetected = true;
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'CONSENT_DIALOG_DETECTED',
      data: {
        url: window.location.href,
        element: element.className || element.id,
        text: element.textContent.substring(0, 200)
      }
    });

    // Get user preference for handling consent
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const settings = response.settings;

    if (!settings.consentAction || settings.consentAction === 'manual') {
      return; // Let user handle manually
    }

    // Auto-handle based on user preference
    setTimeout(() => {
      this.autoHandleConsent(element, settings.consentAction);
    }, 1000); // Small delay to ensure dialog is fully rendered
  }

  autoHandleConsent(dialogElement, action) {
    const buttonSelectors = {
      reject: [
        'button[id*="reject"]',
        'button[class*="reject"]',
        'button:contains("Reject")',
        'button:contains("Decline")',
        'button:contains("No")',
        'a[href*="reject"]',
        '.reject-all',
        '[data-action="reject"]'
      ],
      accept: [
        'button[id*="accept"]',
        'button[class*="accept"]',
        'button:contains("Accept")',
        'button:contains("Agree")',
        'button:contains("Yes")',
        'a[href*="accept"]',
        '.accept-all',
        '[data-action="accept"]'
      ],
      dismiss: [
        'button[aria-label*="close"]',
        'button[title*="close"]',
        '.close',
        '.dismiss',
        '[data-dismiss]',
        'button:contains("×")',
        'button:contains("✕")'
      ]
    };

    const selectors = buttonSelectors[action] || buttonSelectors.dismiss;
    
    for (const selector of selectors) {
      const button = dialogElement.querySelector(selector) || document.querySelector(selector);
      if (button) {
        console.log(`SilentGuardian: Auto-${action} consent dialog`);
        button.click();
        
        // Hide the dialog as backup
        setTimeout(() => {
          dialogElement.style.display = 'none';
        }, 100);
        
        return;
      }
    }

    // Fallback: try to hide the dialog
    console.log('SilentGuardian: Could not find consent button, hiding dialog');
    dialogElement.style.display = 'none';
  }

  observeDOM() {
    // Watch for new elements being added (lazy-loaded consent dialogs)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the new element is a consent dialog
              if (this.isLikelyConsentDialog(node)) {
                this.handleConsentDialog(node);
              }
              
              // Check if any child elements are consent dialogs
              for (const selector of this.consentSelectors) {
                const consentElements = node.querySelectorAll?.(selector);
                if (consentElements) {
                  for (const element of consentElements) {
                    if (this.isLikelyConsentDialog(element)) {
                      this.handleConsentDialog(element);
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SilentGuardianContent();
  });
} else {
  new SilentGuardianContent();
}
