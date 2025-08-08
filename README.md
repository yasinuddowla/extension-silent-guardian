# SilentGuardian Chrome Extension

## Project Overview

SilentGuardian is a privacy-focused Chrome extension that blocks trackers and automatically handles cookie consent dialogs. It provides users with enhanced privacy protection while browsing the web.

## Features

- **Tracker Blocking**: Blocks known tracking scripts and pixels from major advertising networks
- **Consent Dialog Auto-Handling**: Automatically detects and handles cookie consent dialogs
- **User Control**: Toggle protection per-site and configure consent preferences
- **Minimal UI**: Clean, intuitive popup interface

## Project Structure

```
silent-guardian/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Service worker for background operations
├── content.js                 # Content script injected into web pages
├── popup.html                 # Extension popup interface
├── popup.css                  # Popup styling
├── popup.js                   # Popup functionality
├── scripts/
│   └── consent-detector.js    # Advanced consent dialog detection
├── rules/
│   └── tracker_rules.json     # Declarative net request rules for blocking
├── icons/                     # Extension icons (placeholder directory)
└── project-details.md         # Original project specification
```

## Installation & Development

### Prerequisites
- Chrome browser (version 88+)
- Developer mode enabled in Chrome extensions

### Setup
1. Clone or download this project
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory
5. The extension should now appear in your extensions list

### Testing
1. Navigate to websites with cookie banners (e.g., news sites, e-commerce)
2. Open the extension popup to configure settings
3. Test different consent action settings
4. Monitor the browser console for SilentGuardian logs

## Core Components

### Background Service Worker (`background.js`)
- Manages extension lifecycle and settings
- Handles messages between content scripts and popup
- Stores user preferences
- Injects consent detection scripts

### Content Script (`content.js`)
- Runs on all web pages
- Blocks tracking scripts and pixels in real-time
- Detects and handles consent dialogs
- Communicates with background script

### Consent Detector (`scripts/consent-detector.js`)
- Advanced consent dialog detection using multiple strategies
- Platform-specific detection for popular consent management platforms
- Heuristic-based detection for custom implementations
- Automated interaction with consent dialogs

### Popup Interface
- Per-site protection toggle
- Global settings configuration
- User-friendly controls
- Clean, minimal design

## Technical Implementation

### Tracker Blocking
- Uses Chrome's Declarative Net Request API for efficient blocking
- Content script-level blocking for dynamic script injection
- Covers major tracking platforms (Google Analytics, Facebook Pixel, etc.)

### Consent Dialog Detection
- Multi-layered detection approach:
  1. Known consent management platform selectors
  2. Heuristic analysis of DOM elements
  3. Mutation observer for dynamically loaded dialogs
- Automatic interaction based on user preferences

### Privacy & Performance
- No data collection or tracking
- Efficient blocking mechanisms
- Optimized for performance impact
- Local storage only

## Configuration Options

- **Tracker Blocking**: Enable/disable tracker blocking globally
- **Consent Action**: Choose auto-reject, auto-accept, auto-dismiss, or manual
- **Site Exceptions**: Disable protection for specific domains
- **Notifications**: Show/hide detection notifications

## Future Enhancements

- Advanced whitelist/blacklist management
- Custom blocking rules
- Export/import settings
- Machine learning for improved consent detection
- Enhanced UI customization

## Contributing

This is a development project. Key areas for contribution:
- Additional tracker domains for blocking rules
- Improved consent dialog detection patterns
- UI/UX enhancements
- Performance optimizations

## License

This project is for educational and development purposes.
