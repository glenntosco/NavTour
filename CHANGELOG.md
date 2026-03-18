# Changelog

All notable changes to NavTour are documented in this file.

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
