# NavTour Product Roadmap

**Last updated:** 2026-03-26
**Competitor benchmark:** Navattic (navattic.com)

Legend: `[x]` = Shipped | `[-]` = In Progress | `[ ]` = Planned

---

## Core Demo Features

- [x] HTML/CSS web capture (Chrome extension)
- [x] Unlimited HTML demos
- [x] AI-powered tour generation (Claude)
- [x] Custom AI prompts for generation
- [ ] Workspace knowledge base (AI context library)
- [ ] AI review/suggestions for existing tours
- [ ] Demo translation (multilingual auto-translate)
- [ ] Sandbox demos (live environment capture)
- [ ] Interest-level demos (personalized viewer paths)
- [ ] In-app demo suggestions (recommend next demo)
- [ ] A/B testing for demos (compare variants)

## Capture & Editing

- [x] Screenshot/page capture
- [x] Live web capture (Chrome extension)
- [ ] Media/video capture
- [ ] Element-level capture (capture single component)
- [ ] Recapture/version updates (update frame without rebuilding tour)
- [x] Annotations: tooltips, modals, hotspots, beacons, blur, click zones, numbered tooltips
- [x] Branching logic (GoToStep, StartFlow, OpenUrl)
- [x] Click-to-capture mode
- [x] Blur/redact sensitive data (Blur annotation type)
- [ ] Custom CSS/HTML editing (inline frame editor)
- [x] Drag-and-drop annotation positioning
- [x] Annotation resize handles

## Analytics & Leads

- [x] Demo view tracking
- [x] Step completion tracking
- [ ] Drop-off analysis (funnel visualization)
- [x] Lead capture forms
- [ ] Account-level engagement (company rollup)
- [ ] Advanced filters (by date, source, segment)
- [ ] CRM integration — HubSpot
- [ ] CRM integration — Salesforce
- [ ] Interest scoring (engagement-based lead score)
- [ ] Buyer circle discovery (identify stakeholders)
- [x] Session event tracking
- [x] Form submission tracking

## Distribution & Embedding

- [x] Website embed (iframe)
- [ ] Custom domains (white-label URLs)
- [x] Shareable demo links (/demo/{slug})
- [x] Email-friendly demo links
- [ ] Ad campaign CTA embeds (lightweight snippet)
- [ ] NavTour JS (programmatic embed API)
- [ ] Personal intro videos (per-rep video overlay)
- [x] Personalization variables ({{company}}, {{name}}, etc.)
- [x] Query param personalization

## Voiceover & Media

- [x] AI text-to-speech voiceover (ElevenLabs)
- [x] 24+ voice options (gender, accent, language)
- [x] Voice preview in editor
- [x] Audio mute controls in player
- [x] Multilingual voice support (29 languages)
- [ ] Custom voice cloning
- [ ] Video uploads/embeds in steps
- [ ] Screen recording capture

## Collaboration & Team

- [x] Multi-tenant architecture
- [x] User authentication (JWT + Cookie)
- [ ] Multi-seat access (team plans: 3/5/10+)
- [ ] In-app collaboration (comments, reviews)
- [ ] Multi-team onboarding workflows
- [ ] SSO integration (SAML, OIDC)
- [ ] Directory sync (Azure AD, Okta)
- [ ] Role-based permissions (admin, editor, viewer)
- [ ] Audit logs

## Sales Enablement

- [ ] Rep Chrome extension (personalized demo sharing)
- [ ] Email and Slack alerts (demo viewed notifications)
- [ ] Rep contact card (overlay in demo)
- [ ] Pre-call demo sharing (auto-send before meetings)
- [ ] Post-call follow-up assets (custom demo packages)
- [ ] Conference/booth demo mode (kiosk mode)
- [ ] Demo analytics per rep

## Integrations

- [ ] HubSpot (contacts + deals)
- [ ] Salesforce (leads + opportunities)
- [ ] Slack (notifications)
- [ ] Google Analytics 4 (event tracking)
- [ ] Intercom (in-app messaging)
- [ ] Gong (call intelligence)
- [ ] Webhooks API
- [ ] Zapier connector
- [x] REST API (v1)

## Platform & Infrastructure

- [x] Custom branding/themes
- [x] Form builder (standalone + embedded)
- [x] Lead routing (email notifications)
- [x] Session tracking
- [x] SOC 2 compliance posture
- [x] GDPR compliance
- [x] 99.9% uptime SLA (Azure)
- [x] Multi-tenant data isolation
- [ ] Dedicated CSM (enterprise tier)
- [x] Bilingual UI (EN/ES)
- [ ] Additional languages (PT, FR, DE)

## Chrome Extension

- [x] Manifest V3 architecture
- [x] Dual content scripts (ISOLATED + MAIN world)
- [x] DOM serialization with CSS inlining
- [x] Shadow DOM capture
- [x] Dynamic CSS/font tracking
- [x] CSP bypass (HTML rewrite)
- [x] Floating capture toolbar (Navattic-style pill)
- [x] 3-2-1 countdown overlay
- [x] Screen size warning + resize
- [-] Expand panel with thumbnails
- [x] Frame names from page title
- [x] Auto-capture on navigation
- [x] Click-to-capture mode
- [ ] Element-level capture
- [ ] Video recording mode

## Player Features

- [x] Interactive step-by-step navigation
- [x] Keyboard navigation (arrow keys, Escape)
- [x] Spotlight/backdrop overlays (4 intensity levels)
- [x] Welcome screen (customizable title, subtitle, button)
- [x] Exit confirmation with progress
- [x] Lead capture form at end
- [x] Voiceover audio playback
- [x] Trigger types: button click, element click, text input, timer
- [x] Navigation: next, previous, go-to-step, end demo, open URL, start flow
- [x] Personalization variable resolution
- [ ] Progress bar
- [ ] Keyboard shortcut hints
- [ ] Mobile-optimized player
- [ ] Offline mode

---

## Priority Tiers

### P0 — Ship This Quarter
- [ ] Drop-off analysis dashboard
- [ ] Custom domains
- [ ] HubSpot integration
- [ ] Role-based permissions
- [ ] Element-level capture

### P1 — Next Quarter
- [ ] Salesforce integration
- [ ] SSO (SAML/OIDC)
- [ ] A/B testing
- [ ] Demo translation
- [ ] Slack notifications
- [ ] NavTour JS embed API

### P2 — Future
- [ ] Sandbox demos
- [ ] Video capture/recording
- [ ] Custom voice cloning
- [ ] Buyer circle discovery
- [ ] Conference/kiosk mode
- [ ] Zapier connector
- [ ] Interest scoring
- [ ] Multi-team onboarding

---

*This roadmap is maintained alongside the codebase. Update as features ship.*
