# UniMaxDL DOM Contract & JavaScript Hooks Checklist

This document catalogs every DOM element ID, class, and dynamic injection contract across `downloader.js`, `nav.js`, and `releases.js` to prevent any regressions during the SIGNAL DECK overhaul.

---

## 1. Input & Extraction Bay (`index.html` & platform pages)
| DOM ID | Element Type | Role / Event Hook |
| :--- | :--- | :--- |
| `url-input` | `<input type="url">` | User URL entry; listened to on `input`, `keydown` (Enter) |
| `clear-btn` | `<button>` | Clears input field (`clearInput()`), toggled on text presence |
| `btn-text` | `<span>` | Primary button text (`"Analyze"`, `"Analyzing..."`) |
| `btn-spinner` | `<svg>` / `<span>` | Rotating loading spinner during fetch |
| `loading-skeleton` | `<div>` | Animated pulse placeholder while fetching manifest |
| `media-card-container` | `<div>` | Target container where `UDL_DOWNLOADER.renderMediaCard()` injects markup |

---

## 2. Dynamic Results Bay (`downloader.js`)
| Dynamic ID / Class | Description |
| :--- | :--- |
| `tab-btn-video` | Tab trigger for Video Streams |
| `tab-btn-audio` | Tab trigger for Audio Streams |
| `format-section-video` | Video format cards container |
| `format-section-audio` | Audio format cards container |
| `tasks-container` | Active background download queue & progress tasks container |
| `udl-4k-modal` | Modal dialog prompt for 4K/8K stream instructions |
| `udl-settings-modal` | Settings dialog |
| `udl-download-helper-modal` | Download helper guidance modal |
| `udl-gateway-action-btn` | Cloud gateway action button |
| `udl-gateway-badge` | Cloud gateway status badge |
| `udl-gateway-progress` | Cloud gateway progress bar |

---

## 3. Global Navigation & Menus (`nav.js`)
| DOM ID | Element Type | Role |
| :--- | :--- | :--- |
| `mobile-drawer` | `<aside>` / `<div>` | Responsive mobile navigation drawer (sliding panel) |
| `mobile-overlay` | `<div>` | Dark backdrop overlay for mobile drawer |
| `mobile-menu-btn` | `<button>` | Hamburger / menu trigger (`toggleMobileMenu()`) |
| `platforms-dropdown-btn` | `<button>` | Platforms menu trigger (`togglePlatformsDropdown()`) |
| `platforms-dropdown` | `<div>` | Floating platforms dropdown menu |

---

## 4. Desktop Release Links (`releases.js` & `download.html`)
| DOM ID | Target File / Download Link |
| :--- | :--- |
| `btn-download-android` | `/downloads/UnimaxDL-v2.1.0.apk` |
| `btn-download-win` | `/downloads/UnimaxDL-Setup-v1.0.0.exe` |
| `btn-download-mac` | `/downloads/UnimaxDL-v1.0.0-macos.dmg` |
| `btn-download-linux` | `/downloads/UnimaxDL-v1.0.0-linux.AppImage` |
| `qr-modal` | QR code modal drawer (`toggleQrModal()`) |
| `deep-link-input` | App deep link test input (`testDeepLink()`) |
| `deep-link-output` | App deep link display box |
| `deep-link-text` | Text container for deep link URL |
