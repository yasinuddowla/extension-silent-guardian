// Specialized consent dialog detection script
// This script is injected into pages to detect and handle consent dialogs

(function() {
  'use strict';

  class ConsentDetector {
    constructor() {
      this.detectedDialogs = new Set();
      this.init();
    }

    init() {
      // Run detection immediately and on DOM changes
      this.detectExistingDialogs();
      this.setupMutationObserver();
      
      // Also check after a delay for lazy-loaded dialogs
      setTimeout(() => this.detectExistingDialogs(), 2000);
      setTimeout(() => this.detectExistingDialogs(), 5000);
    }

    detectExistingDialogs() {
      // Popular consent management platforms
      const platformSelectors = {
        // OneTrust
        '#onetrust-banner-sdk': 'onetrust',
        '#onetrust-consent-sdk': 'onetrust',
        
        // Cookiebot
        '#CybotCookiebotDialog': 'cookiebot',
        '#CybotCookiebotDialogBodyUnderlay': 'cookiebot',
        
        // Cookie Consent (Osano)
        '.cc-window': 'osano',
        '.cc-banner': 'osano',
        
        // Quantcast Choice
        '#qcCmpUi': 'quantcast',
        
        // TrustArc
        '#truste-consent-track': 'trustarc',
        '.truste_overlay': 'trustarc',
        
        // Cookie Information
        '#cookie-information-template-wrapper': 'cookie-information',
        
        // Generic patterns
        '[class*="cookie-consent"]': 'generic',
        '[class*="gdpr"]': 'generic',
        '[class*="privacy-notice"]': 'generic',
        '[id*="consent"]': 'generic'
      };

      for (const [selector, platform] of Object.entries(platformSelectors)) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (this.isVisibleConsentDialog(element) && !this.detectedDialogs.has(element)) {
            this.handleDetectedDialog(element, platform);
            this.detectedDialogs.add(element);
          }
        });
      }

      // Advanced heuristic detection
      this.heuristicDetection();
    }

    heuristicDetection() {
      // Look for elements with consent-related text and modal-like properties
      const allElements = document.querySelectorAll('div, section, aside, main');
      
      for (const element of allElements) {
        if (this.detectedDialogs.has(element)) continue;
        
        if (this.isLikelyConsentDialogAdvanced(element)) {
          this.handleDetectedDialog(element, 'heuristic');
          this.detectedDialogs.add(element);
        }
      }
    }

    isVisibleConsentDialog(element) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    isLikelyConsentDialogAdvanced(element) {
      const text = element.textContent?.toLowerCase() || '';
      const className = element.className?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      
      // Must contain relevant keywords
      const consentKeywords = [
        'cookie', 'consent', 'privacy', 'gdpr', 'ccpa', 'tracking',
        'analytics', 'advertising', 'personalized', 'necessary cookies',
        'accept', 'reject', 'manage preferences', 'cookie policy'
      ];
      
      const hasConsentText = consentKeywords.some(keyword => 
        text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
      );
      
      if (!hasConsentText) return false;
      
      // Must be positioned as overlay/modal
      const style = getComputedStyle(element);
      const isPositioned = ['fixed', 'absolute'].includes(style.position);
      const hasHighZIndex = parseInt(style.zIndex) > 100;
      const coversScreen = element.offsetWidth > window.innerWidth * 0.3 || 
                          element.offsetHeight > window.innerHeight * 0.2;
      
      // Must be visible
      if (!this.isVisibleConsentDialog(element)) return false;
      
      // Must have action buttons
      const hasButtons = element.querySelector('button, a[href], input[type="button"], input[type="submit"]');
      
      return (isPositioned || hasHighZIndex) && coversScreen && hasButtons;
    }

    handleDetectedDialog(element, platform) {
      console.log(`SilentGuardian: Detected ${platform} consent dialog`, element);
      
      // Send detection to background script
      chrome.runtime?.sendMessage({
        type: 'CONSENT_DIALOG_DETECTED',
        data: {
          platform,
          url: window.location.href,
          selector: this.getElementSelector(element),
          text: element.textContent.substring(0, 300)
        }
      }).catch(() => {
        // Ignore errors if extension context is not available
      });

      // Auto-handle if user preferences allow
      this.autoHandleDialog(element, platform);
    }

    async autoHandleDialog(element, platform) {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        const settings = response?.settings;
        
        if (!settings || settings.consentAction === 'manual') {
          return; // Let user handle manually
        }

        // Wait a bit for the dialog to fully render
        setTimeout(() => {
          this.executeConsentAction(element, platform, settings.consentAction);
        }, 1500);
        
      } catch (error) {
        console.log('SilentGuardian: Could not get settings, skipping auto-handle');
      }
    }

    executeConsentAction(element, platform, action) {
      const actionMap = {
        reject: this.findRejectButton.bind(this),
        accept: this.findAcceptButton.bind(this),
        dismiss: this.findCloseButton.bind(this)
      };

      const findButton = actionMap[action] || actionMap.dismiss;
      const button = findButton(element, platform);

      if (button) {
        console.log(`SilentGuardian: Auto-${action} ${platform} dialog`);
        
        // Simulate user click
        button.focus();
        button.click();
        
        // Also try triggering events
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
          button.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
        });
        
        // Hide as backup
        setTimeout(() => {
          if (this.isVisibleConsentDialog(element)) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
          }
        }, 500);
        
      } else {
        console.log(`SilentGuardian: Could not find ${action} button for ${platform}, hiding dialog`);
        // Fallback: hide the dialog
        element.style.display = 'none';
        element.style.visibility = 'hidden';
      }
    }

    findRejectButton(element, platform) {
      const rejectSelectors = [
        // Platform-specific
        ...(platform === 'onetrust' ? ['#onetrust-reject-all-handler', '.ot-pc-refuse-all-handler'] : []),
        ...(platform === 'cookiebot' ? ['#CybotCookiebotDialogBodyButtonDecline'] : []),
        ...(platform === 'quantcast' ? ['.qc-cmp-button[mode="secondary"]'] : []),
        
        // Generic selectors
        'button[id*="reject"]',
        'button[class*="reject"]',
        'button[data-action*="reject"]',
        'a[href*="reject"]',
        '.reject-all',
        '.decline-all'
      ];

      const rejectTextPatterns = ['reject', 'decline', 'no thanks', 'refuse', 'deny'];
      
      return this.findButtonBySelectors(element, rejectSelectors) || 
             this.findButtonByText(element, rejectTextPatterns);
    }

    findAcceptButton(element, platform) {
      const acceptSelectors = [
        // Platform-specific
        ...(platform === 'onetrust' ? ['#onetrust-accept-btn-handler', '.ot-pc-accept-all-handler'] : []),
        ...(platform === 'cookiebot' ? ['#CybotCookiebotDialogBodyButtonAccept'] : []),
        ...(platform === 'quantcast' ? ['.qc-cmp-button[mode="primary"]'] : []),
        
        // Generic selectors
        'button[id*="accept"]',
        'button[class*="accept"]',
        'button[data-action*="accept"]',
        'a[href*="accept"]',
        '.accept-all',
        '.agree-all'
      ];

      const acceptTextPatterns = ['accept', 'agree', 'i agree', 'allow', 'ok', 'continue'];
      
      return this.findButtonBySelectors(element, acceptSelectors) || 
             this.findButtonByText(element, acceptTextPatterns);
    }

    findCloseButton(element, platform) {
      const closeSelectors = [
        'button[aria-label*="close"]',
        'button[title*="close"]',
        'button[class*="close"]',
        '.close',
        '.dismiss',
        '[data-dismiss]'
      ];

      const closeTextPatterns = ['×', '✕', 'close', 'dismiss'];
      
      return this.findButtonBySelectors(element, closeSelectors) || 
             this.findButtonByText(element, closeTextPatterns);
    }

    findButtonBySelectors(element, selectors) {
      for (const selector of selectors) {
        // Try within the dialog first
        let button = element.querySelector(selector);
        if (button && this.isClickableButton(button)) {
          return button;
        }
        
        // Try in the whole document
        button = document.querySelector(selector);
        if (button && this.isClickableButton(button)) {
          return button;
        }
      }
      return null;
    }

    findButtonByText(element, textPatterns) {
      // First search within the dialog element
      const buttons = element.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]');
      
      for (const button of buttons) {
        const buttonText = button.textContent?.toLowerCase().trim() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        const title = button.getAttribute('title')?.toLowerCase() || '';
        
        for (const pattern of textPatterns) {
          if (buttonText.includes(pattern) || ariaLabel.includes(pattern) || title.includes(pattern)) {
            if (this.isClickableButton(button)) {
              return button;
            }
          }
        }
      }
      
      // If not found in dialog, search in whole document
      const allButtons = document.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]');
      
      for (const button of allButtons) {
        const buttonText = button.textContent?.toLowerCase().trim() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        const title = button.getAttribute('title')?.toLowerCase() || '';
        
        for (const pattern of textPatterns) {
          if (buttonText.includes(pattern) || ariaLabel.includes(pattern) || title.includes(pattern)) {
            if (this.isClickableButton(button)) {
              return button;
            }
          }
        }
      }
      
      return null;
    }

    isClickableButton(button) {
      const style = getComputedStyle(button);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !button.disabled &&
        button.offsetWidth > 0 &&
        button.offsetHeight > 0
      );
    }

    getElementSelector(element) {
      if (element.id) return `#${element.id}`;
      if (element.className) return `.${element.className.split(' ')[0]}`;
      return element.tagName.toLowerCase();
    }

    setupMutationObserver() {
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any added nodes might be consent dialogs
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent?.toLowerCase() || '';
                if (text.includes('cookie') || text.includes('consent') || text.includes('privacy')) {
                  shouldCheck = true;
                  break;
                }
              }
            }
          }
        }
        
        if (shouldCheck) {
          // Debounce the detection
          clearTimeout(this.detectionTimeout);
          this.detectionTimeout = setTimeout(() => {
            this.detectExistingDialogs();
          }, 100);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ConsentDetector());
  } else {
    new ConsentDetector();
  }

})();
