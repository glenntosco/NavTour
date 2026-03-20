# Changelog

All notable changes to NavTour are documented in this file.

---

## [1.2.0] - 2026-03-20

### Added
- **Support page** (`/support`) — Email support (support@navtour.cloud), FAQ links, and general inquiry card. Linked from footer only.
- **Privacy Policy page** (`/privacy`) — Full privacy policy covering data collection, browser extension, cookies, data retention, and user rights. Required for Chrome Web Store submission.
- **Chrome Web Store promo tiles** — Small (440x280) and marquee (1400x560) promotional images for the extension listing.
- **Onboarding tour** — Syncfusion tooltips guiding new users through the demo builder.
- **Persistent bottom navigation bar** in the demo player.
- **Analytics and Settings pages** — Global analytics dashboard and app settings.
- **Embed code & share section** in demo settings.
- **Frame reorder and rename** with improved frame strip UI.
- **Team member management** with Azure Communication Email invites.
- **Lead email templates** for captured lead notifications.

### Changed
- **Extension version** bumped to 1.2.0.
- **Extension permissions** — Removed all `host_permissions` (including localhost). Moved `<all_urls>` and `https://navtour.cloud/*` to `optional_host_permissions` to avoid Chrome Web Store in-depth review. Permissions are requested on-demand when the user starts a capture session.
- **Login session** extended to 24 hours.
- **Extension auto-login** — Retry on token expiry with fresh cookie before showing login form. Removed localhost from candidate URLs.
- **Annotation editor** — Added `@onclick:stopPropagation` on edit form to prevent parent click from resetting field values (fixes save, opacity, and position bugs).
- **Player overlay** — Beacon annotations now use `transform:translate(-50%,-50%)` and `width:auto;height:auto` for correct centering, matching editor positioning.
- **Tooltips** — Switched to Syncfusion light-style tooltips across the builder.
- **Premium dashboard redesign** with refined cards and typography.
- **Login page** — Split layout with large brand logo, stats panel, and WebGL gradient animation.

### Fixed
- Annotation editor fields (name, description, opacity) resetting on every click inside the edit form.
- Beacon position mismatch between editor and player preview.
- Player navigation and step creation bugs.
- Frame deletion, nav collapse, editor width, and toolbar branding issues.
- Step deletion confirmation dialog not functioning.
- Confirmation dialogs clipped by `overflow:hidden` parents.
- Header contrast — white background with dark text.
- Favicons and extension dist packaging.

---

## [Unreleased] - 2026-03-18

### Added
- **Extension login form** — Email/password login directly in the extension popup, replacing the unreliable "go log in at the web app" flow. Users no longer need to visit the web app first; they sign in with credentials and the JWT is stored in `chrome.storage.local`.
- **Login API method** — `NavTourApi.login(email, password)` calls `/api/v1/auth/login` and returns `{ accessToken, refreshToken, expiresAt, tenantId }`.
- **Enter-key support** — Pressing Enter in the password field submits the login form; Enter in email moves focus to password.

### Changed
- **Capture toolbar redesign** — Replaced the full-width bar anchored to the bottom edge with a Navattic-style floating pill bar: centered, rounded corners (`border-radius: 20px`), 16px margin from bottom, backdrop blur, and subtle shadow. The bar no longer pushes page content.
- **Recording indicator** — Added a pulsing red dot to indicate active recording state.
- **Toolbar buttons** — "Capture" and "Done" buttons are now pill-shaped with hover effects. "Finish" renamed to "Done" for brevity.
- **Frame counter** — Shows count as `N screens` instead of `N frames` for clarity.
- **Auth flow priority** — Init sequence is now: (1) check stored session, (2) silent cookie auto-login, (3) show login form. Cookie auto-login is now a silent bonus, not the primary path.
- **Logout destination** — Logout now returns to the login form instead of the old "not logged in" screen.

### Removed
- **"Not Logged In" screen** — The old screen with "Log in at navtour.cloud" link and retry button has been replaced by the login form.
- **Diagnostic auto-login logging** — Removed verbose `console.log` cookie discovery diagnostics from popup.ts. The `tryAutoLogin` function is now a simple silent boolean check.

---

## [0.1.0] - 2026-03-17

### Added
- Click-to-capture mode with CSS selector recording and element highlight feedback.
- Manual capture mode with Ctrl+Shift+C keyboard shortcut.
- Step triggers and escape view in the demo builder.
- Backdrop/blur annotation effects.
- Extension auto-login via `navtour_auth` cookie with domain discovery.
- Annotation styling improvements and step deletion in the builder.

### Fixed
- Extension cookie auto-login with diagnostic logging and domain discovery.
- Replaced extension text logo with icon128 image.
- Removed `HttpOnly` cookie flag to allow extension cookie access.
- Added status codes to auth login endpoint for proper error differentiation.
