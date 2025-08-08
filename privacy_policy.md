# Privacy Policy for SilentGuardian Chrome Extension

**Last Updated: August 8, 2025**

## Overview

SilentGuardian is a privacy-focused Chrome extension designed to block tracking scripts and automatically handle cookie consent dialogs. This privacy policy explains how we collect, use, and protect your information when you use our extension.

## Information We Collect

### Data We DO NOT Collect

SilentGuardian is designed with privacy as a core principle. We **do not collect, store, or transmit** any of the following:

- Personal information (name, email, address, phone number)
- Browsing history or website visits
- Search queries or typed content
- Cookies or tracking data
- IP addresses or location data
- User behavior analytics
- Any form of personally identifiable information (PII)

### Data We DO Collect (Local Only)

The extension stores the following data **locally on your device only**:

- **User Preferences**: Your settings for tracker blocking, consent action preferences, and notification settings
- **Domain Settings**: Which websites you've enabled or disabled protection for
- **Extension Configuration**: Basic settings to make the extension function properly

**Important**: All this data is stored locally in your browser using Chrome's storage API and never leaves your device.

## How We Use Information

The limited local data we store is used solely to:

- Remember your privacy preferences across browser sessions
- Maintain per-website protection settings
- Provide the core functionality of blocking trackers and handling consent dialogs
- Ensure the extension works according to your chosen settings

## Data Sharing and Third Parties

**We do not share any data with third parties.** SilentGuardian:

- Does not send data to external servers
- Does not use analytics services
- Does not integrate with advertising networks
- Does not communicate with any external services except Chrome's built-in APIs
- Has no affiliate partnerships that involve data sharing

## Permissions Explanation

SilentGuardian requests the following Chrome permissions for its core functionality:

### Required Permissions

- **activeTab**: Allows the extension to access the current tab to toggle protection and detect consent dialogs
- **storage**: Enables saving your preferences locally in your browser
- **scripting**: Required to inject consent detection scripts into web pages
- **declarativeNetRequest**: Used to block tracking scripts efficiently
- **host_permissions (<all_urls>)**: Necessary to block trackers and detect consent dialogs across all websites

### Why These Permissions Are Necessary

Each permission is essential for the extension's core privacy protection functionality:

- Without `activeTab`, we can't determine which website you're on
- Without `storage`, your settings would reset every time you restart your browser
- Without `scripting`, we can't detect and handle cookie consent dialogs
- Without `declarativeNetRequest`, we can't block tracking scripts
- Without `host_permissions`, the extension wouldn't work on most websites

## Data Security

Since we don't collect or transmit data, traditional data security concerns don't apply. However:

- All settings are stored using Chrome's secure storage API
- No data is transmitted over the internet
- Your privacy settings remain entirely under your control
- You can clear all extension data by removing the extension

## User Control and Data Deletion

You have complete control over your data:

- **View Settings**: Open the extension popup to see all your current settings
- **Modify Settings**: Change any preference at any time through the extension interface
- **Delete All Data**: Uninstall the extension to remove all locally stored data
- **Reset Settings**: Clear extension data through Chrome's extension management page

## Children's Privacy

SilentGuardian does not collect any personal information from anyone, including children under 13. The extension is safe for users of all ages and complies with COPPA (Children's Online Privacy Protection Act) by design, as it collects no personal data whatsoever.

## International Users

This privacy policy applies to all users worldwide. Since no data is collected or transmitted, there are no cross-border data transfer concerns. All data remains local to your device regardless of your location.

## Changes to This Privacy Policy

If we make any changes to this privacy policy, we will:

- Update the "Last Updated" date at the top of this policy
- Notify users through the Chrome Web Store update mechanism
- Maintain the same core principle: no data collection or transmission

Continued use of the extension after policy updates constitutes acceptance of the changes.

## Open Source Transparency

SilentGuardian's code is designed to be transparent. Users and security researchers can verify our privacy claims by examining the extension's code, which clearly shows:

- No network requests to external servers
- No data collection mechanisms
- Only local storage usage for user preferences

## Contact Information

If you have questions about this privacy policy or the extension's privacy practices:

- **Email**: support@yasinuddowla.com
- **Website**: https://yasinuddowla.com
- **Extension Support**: Available through the Chrome Web Store

## Compliance

This privacy policy and the SilentGuardian extension comply with:

- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Children's Online Privacy Protection Act (COPPA)

## Legal Basis for Processing (GDPR)

Under GDPR, our legal basis for processing the minimal local data is:

- **Legitimate Interest**: Storing your preferences to provide the privacy protection service you've requested
- **Consent**: By installing and using the extension, you consent to local storage of your settings

Since no personal data is collected or processed, most GDPR obligations don't apply, but we maintain this transparent policy for user confidence.

---

**Summary**: SilentGuardian is designed to protect your privacy, not compromise it. We collect no personal data, track no behavior, and share nothing with third parties. Your privacy settings stay on your device, under your control.
