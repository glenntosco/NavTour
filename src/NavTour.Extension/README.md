# NavTour Chrome Extension

Chrome Manifest V3 extension for capturing product screenshots as interactive HTML/CSS demo frames.

**Version:** 1.4.0
**Chrome Web Store:** [NavTour Capture](https://chrome.google.com/webstore/detail/navtour-capture)

## Setup

```bash
npm install
npm run build     # Bundle TypeScript with esbuild
npm run watch     # Watch mode for development
```

Load unpacked extension in Chrome from this directory (`src/NavTour.Extension/`).

## Permissions

| Permission | Type | Justification |
|------------|------|---------------|
| `activeTab` | Required | Capture the HTML/CSS content of the currently active tab when the user clicks the extension icon or initiates a capture. Only accesses the tab the user is actively interacting with. |
| `storage` | Required | Store the user's authentication session (JWT token) and capture state locally so they persist across popup opens. |
| `scripting` | Required | Inject the capture toolbar and DOM snapshot script into the active page during a capture session. |
| `tabs` | Required | Read the active tab's URL to detect page navigation during auto-capture mode and to display the current page title. |
| `cookies` | Required | Read the `navtour_auth` authentication cookie from navtour.cloud for silent auto-login when the user is already signed into the web app. |
| `https://navtour.cloud/*` | Optional host | Access the NavTour API and read authentication cookies. Requested on first use. |
| `<all_urls>` | Optional host | Inject capture scripts into any webpage the user chooses to capture. Requested when the user starts a capture session. |

## Authentication

The extension uses a **login form** as the primary auth method:

1. Open the extension popup
2. Enter your NavTour email and password
3. The extension calls `/api/v1/auth/login` and stores the JWT in `chrome.storage.local`
4. Subsequent popup opens skip login (stored session persists)

**Cookie auto-login** is a silent fallback: if you're already logged into the NavTour web app, the extension can pick up the `navtour_auth` cookie automatically. This is attempted silently before showing the login form.

## Capture Modes

| Mode | Trigger | Best For |
|------|---------|----------|
| **Auto** | Page navigation | Multi-page flows, onboarding walkthroughs |
| **Click-to-Capture** | Every click on the page | Capturing interactive states, dropdowns, modals |
| **Manual** | Capture button or Ctrl+Shift+C | Selective capture, specific UI states |

## Capture Toolbar

When capturing, a floating pill bar appears centered at the bottom of the page:

- Pulsing red dot indicates active recording
- Shows demo name and screen count
- **Capture** button for manual frame capture
- **Done** button to stop and open the demo builder

The toolbar floats above page content (does not push layout) and is excluded from captures.

## Project Structure

```
src/
  popup.ts        Popup UI: login form, demo selection, capture status
  background.ts   Service worker: capture lifecycle, toolbar injection, uploads
  content.ts      DOM capture logic (injected into pages)
  api.ts          HTTP client for NavTour REST API
  types.ts        Shared TypeScript interfaces
popup.html        Extension popup markup
popup.css         Popup styles
manifest.json     Manifest V3 configuration
```

## Keyboard Shortcuts

- **Ctrl+Shift+C** — Manual capture (works in all modes)
