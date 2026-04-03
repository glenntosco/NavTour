# Supademo Deep Competitive Review - Part 2
## Exhaustive Feature-by-Feature Documentation
### Date: March 28, 2026 | Plan: Scale

---

## 1. DEMO EDITOR - Complete Feature Inventory

### Editor Top Toolbar
- **Back** button (returns to dashboard)
- **Demo Title** (editable inline with pencil icon)
- **Demo Utility Menu** (three dots) - see Section 1E
- **Analytics** button (chart icon)
- **Enhance with AI** button - see Section 1C
- **Preview** link (opens demo preview in new tab)
- **Share** button - see Section 1D

### Editor Center Toolbar (above canvas)
8 toolbar buttons for the currently selected step:
1. **Hotspot** - Add/edit hotspot on image steps
2. **Blur & Annotate** - Add blur/annotation overlays
3. **Voiceover** - Add AI or manual voiceover
4. **Animation** - Add animations to steps
5. **Chapter** - Convert step to chapter
6. **Personalize** - Add personalization
7. **Upload** - Upload replacement image
8. **Settings** - Open Settings dialog (gear icon)

### Bottom Bar
- **Backgrounds** - Background color/gradient/image picker
- **Resize & Crop** - Resize and crop images (only on image steps)
- **Comments** - Internal/external commenting system

### Step Navigation Panel (left sidebar)
- Steps shown as thumbnails with step numbers
- Chapter steps shown with distinct styling (no image thumbnail)
- "Zoom Enabled" badge on applicable steps
- **+ Add Step** buttons between every step
- **More options** (three dots) on each step thumbnail

---

## 1A. HOTSPOT PANEL - Every Option

### Content Section
- **Text** - Rich text editor with toolbar:
  - Bold, Italic, Link
  - Ordered list, Bullet list
  - Clear text button
  - **Set dynamic variable** button: inserts variables
    - `{{name}}` - viewer's name
    - `{{company}}` - viewer's company
    - `{{custom_variable}}` - custom variable pulled from share modal or UTM parameters
  - Visit URL field (with Edit/Remove)
- **Text Alignment**: Left | Center | Right

### Appearance Section
- **Hotspot Style** (radio buttons):
  - **Pointer** - circular dot with tooltip
  - **Callout** - inline callout box
  - **Area** - rectangular highlight area

- **Background** color picker (hex input, default #4f46e5)
- **Text** color picker (hex input, default #fff)

- **Backdrop** dropdown:
  - Off
  - Light
  - Dark

- **Border Radius** dropdown:
  - Sharp
  - Soft
  - Round
  - Pill

- **Animation** dropdown:
  - Ping
  - Pulse
  - None

- **Visibility** dropdown:
  - On Hover
  - Always

- **Width** toggle:
  - Small | Medium | Large

- **Position** toggle:
  - Auto | Top | Right | Bottom | Left

### Navigation Section
- **Navigation Buttons**: Hidden | Show
- **Next button**:
  - Display: Yes | No
  - Button Text (placeholder: "E.g. Continue")
  - Background color picker
  - Text color picker
  - Action: **Go to Slide** | **External URL**
  - Go to Step dropdown: "Next step (default)" or select any specific step (enables branching)
- **Back button**:
  - Display: Yes | No
  - Button Text (placeholder: "E.g. Back")
  - Background color picker
  - Text color picker
  - Action: **Go to Slide** | **External URL**
  - Go to Step dropdown: "Previous step (default)" or select any specific step

### Hotspot Footer
- **Delete** button
- **Close** button
- **Save** button

---

## 1B. SETTINGS DIALOG - All 9 Sub-tabs

### Tab 1: Supademo
- **Browser Bar** dropdown:
  - Light Browser Bar
  - Dark Browser Bar
  - None
- **Video play bar** toggle (ON/OFF) - shows video-styled play bar at bottom
- **Progress Bar** toggle (ON/OFF) - shows progress bar at bottom
- **Font** dropdown (14 built-in fonts + custom upload):
  - Default, Roboto, Open Sans, Poppins, Montserrat, Lato, Nunito, Merriweather, IBM Plex Sans Condensed, IBM Plex Serif, Source Sans 3, Outfit, Public Sans, Work Sans
  - Link to "Upload your font here" at /customization#supademo
- **Border around the demo** toggle (ON/OFF) - 1px border
- **Option to open in new tab** toggle (ON/OFF) - shows expand icon on embeds

### Tab 2: Hotspots
- **Show text annotations by default** toggle (ON/OFF) - if OFF, shown only on hover
- **Next button** toggle (ON/OFF) - shows Next arrow under hotspot text
- **Show step count** toggle (ON/OFF) - shows current/total step count
- **Hotspot transparency** buttons: 50% | 60% | 70% | 80% | 90% | 100%
- **Mobile hotspot view** toggle (ON/OFF) - mobile-friendly hotspot layout
- **Show hotspot animation** toggle (ON/OFF) - enables/disables ping/pulse animations

### Tab 3: Branding
- **Watermark CTA**:
  - Watermark Settings dropdown: "Workspace default" or custom
  - Preview of watermark in bottom-right corner
- **Share Page Logo**:
  - Upload/replace logo
  - Preview of logo on demo brand page
- **Share Page Button**:
  - Button Text (e.g., "Create Supademo")
  - Link URL
  - Background Color picker
  - Text Color picker
  - Live preview

### Tab 4: Autoplay
- **Autoplay** toggle (ON/OFF) - auto-play without user interaction
- **Autoplay interaction options**:
  - Uniform across slides | Custom per slide
- **Step Duration (ms)** - number input (recommended 2000ms+)
- **Transition Delay (ms)** - number input (recommended 500ms+)
- **Loop content** toggle (ON/OFF) - repeat in continuous loop
- Note: "If a voiceover is present, the longer of the step or voiceover duration is used"

### Tab 5: Background Music
- **Background Music** dropdown (10 built-in tracks + custom upload):
  - Upbeat Elevator (product tours and education)
  - Ambient Jazz (explainer and product launches)
  - Groovy Funk (product tours and launches)
  - Motivational Background (training and onboarding)
  - Calm Soul (training and onboarding)
  - Groovy Instrumental (training and onboarding)
  - Playful Pop (explainer and product launches)
  - Upbeat Pop (training and onboarding)
  - Emotional Piano (product launches)
  - Energetic Rock (explainer and product launches)
  - Upload your own track
- **Volume** slider (0-100, default 50)
- Each track has a play/preview button

### Tab 6: Share
- **Full Width Share Page** toggle (disabled on current plan)
- **Allow Others to Duplicate** toggle (ON/OFF)
- **Show Author on Share Page** toggle (ON/OFF)
- **Descriptions and Steps on Share Page** toggle (ON/OFF)
- **External Comments** toggle (ON/OFF) - allow viewers to comment
- **Email notifications for comments and replies** toggle (ON/OFF)

### Tab 7: Accessibility
- **Show CC Button** toggle (ON/OFF) - displays closed captions button

### Tab 8: Translations
- **Set Default Based on Browser** toggle (ON/OFF) - auto-detect viewer language
- Tip about adding translations via Translations Hub
- **Translations Hub** section:
  - "Open Translations Hub" button
  - Description: "Let viewers toggle between multiple languages seamlessly, all from a single Supademo link or embed"

### Tab 9: SEO
- Opens a side panel "SEO Settings" with:
  - **Title** text field
  - **Meta Description** textarea
  - **Meta Image** upload area (recommended 1200x630px, up to 5MB, PNG/JPG/SVG/GIF)
  - **Show description and steps on share page** toggle
  - **Show author in demo page** toggle
  - **Allow search engines to index your Supademo** toggle
  - **Custom domain** section:
    - Text field showing: `https://subdomain.your-domain.com/demo/*`
    - "Connect domain" button

---

## 1C. ENHANCE WITH AI - 4 Sub-Features

### AI Audit
- "Audit your demo" - Get AI-powered insights on performance
- Fields:
  - "What is this demo about?" textarea (optional)
  - **Use case** dropdown: Marketing | Instructional
    - Marketing: "Benefit-led messaging to showcase value and outcomes"
    - Instructional: "Step-by-step guidance to help someone complete a workflow"
  - **Desired outcome** dropdown: Completion-focused | Reach-focused
    - Completion-focused: "Maximize end-to-end demo completion rate"
    - Reach-focused: "Maximize distribution and viewer reach"
- "Run audit with AI" button

### AI Text
- "Generate text with AI" - Personalize demo text steps
- Fields:
  - Demo title (pre-filled)
  - **Output language** dropdown (e.g., English US)
  - "What is this demo about?" textarea (optional)
  - Use case dropdown (same as AI Audit)
  - Desired outcome dropdown (same as AI Audit)
- "Generate text" button

### AI Voice
- Opens **Voiceover settings** side panel
- **Voiceover mode**: AI Voiceover | Manual Voiceover
- **Voice** dropdown (e.g., "Bria")
- **Clone your voice** button
- **Advanced Settings** button
- **Steps list** with per-step voiceover text:
  - Each step expandable/collapsible
  - "Sync with hotspots" button (auto-fills voiceover text from hotspot text)
  - "Insert hotspot text" button per step
  - Text area for voiceover text per step
  - Play button (green circle) to preview voiceover

### AI Translate
- "AI Translate" - Translate demo into another language
- **Translation type** radio:
  - "Add a translation to this demo" - adds language toggle for viewers
  - "Create a translated copy" - creates new translated demo copy
- "Open translations hub" button

---

## 1D. SHARE BUTTON - 5 Sub-tabs

### Links
- **Visibility**: Public dropdown (Anyone with the link can view)
- **Copy link** button
- **Share URL** displayed with utm_source parameter
- **Include trackable variables in URL** toggle
  - Supported platforms: Intercom, MixMax, Outreach, ZoomInfo, CustomerIO, Apollo, Close, HubSpot, +more
- **Create personalized link**: "Create Link" button
  - Generate trackable links with optional variables and notifications
- **Social sharing**: X (Twitter), LinkedIn, Facebook, Email buttons at bottom

### Embeds
- **Inline Embed**: Copy Code button
  - Supported platforms: Intercom, Notion, Gitbook, HubSpot, Webflow, HelpScout, HTML, +more
- **Popup Embed**:
  - Step 1: Add SDK script tag
  - Step 2: Add clickable button with framework-specific code
  - Framework tabs: HTML | React | Angular | Vue.js | Svelte
  - "Preview" button to test popup

### Download
- **Download as Video or GIF**:
  - Export type: GIF | Video
  - Frame rate: 30 FPS | 60 FPS
  - Resolution: 480p | 720p | 1080p | 4K
  - Slide Duration: 3s | 5s | 7s
  - Transition Delay: None | 1s | 2s | 3s | 5s
- **Copy as SOP Guide**: Copies step text as structured document
- **Download as PDF**: Exports demo as PDF document
- **Download as PNG**: Exports steps as PNG images

### Branding
(Same as Settings > Branding tab)

### Settings
(Same as Settings > Share tab)

---

## 1E. DEMO UTILITY MENU (Three-dot menu)
- Preview
- Manage tags
- Duplicate
- Archive
- Move to..
- Add to Supademo
- Add to Showcase

---

## 1F. STEP MORE OPTIONS MENU (Three dots on step thumbnail)
- Replace Image
- Duplicate (Cmd+C / Ctrl+C)
- Delete (Del)
- Checkboxes appear on all steps for multi-select

---

## 1G. ADD STEP BUTTON (+ between steps)
- Record More Steps
- Upload Images
- Upload Video
- Record Cam & Screen
- Media Library
- Add Chapter

---

## 1H. BOTTOM BAR OPTIONS

### Backgrounds
- **Colors & Gradients**:
  - 8 solid color presets
  - Custom color picker
  - 8 gradient presets
- **From Your Workspace**: workspace-level background colors
- **Custom Images**: upload custom background images

### Comments
- Side panel with:
  - Comment input field with user profile
  - "Visible to team only" note
  - Post button
  - **Internal** tab (private, team-only comments)
  - **External** tab (public viewer comments)

### Resize & Crop
- Available only on image steps (not chapter steps)

---

## 2. THEME PAGE (Global Customization) - /customization

### 4 Sub-tabs:

### Branding Tab
- **Watermark CTA** (Read only on Scale plan):
  - Enable Watermark toggle
  - Watermark Logo upload
  - Watermark Text field (default: "Created on Supademo")
  - Watermark Link field (default: https://supademo.com)
- **Share Page Logo**: Upload custom logo for share pages
- **Demo Share page - Favicon**: Upload PNG favicon (32x32 to 256x256)
- **Share Page Button**:
  - Button Text, Link URL
  - Background Color, Text Color pickers

### Supademo Tab
- Hotspot settings, font uploads, browser bar settings

### Custom Domain Tab
- Connect custom domain for branded demo URLs

### SEO Tab
- Global SEO settings

---

## 3. ANALYTICS PAGE - /analytics

### Supademo Analytics Tab (default)
- **Top metrics**: Total Viewers, Average Engagement
- **Time series chart**: Viewers and Engagement over time
- **Date range picker**: e.g., "Feb 27 - Mar 28, 26"
- **Filters** button
- **More actions** button (three dots)
- **Most Viewed table** with columns:
  - SUPADEMO (name + author)
  - VIEWS
  - UNIQUE VIEWERS
  - ENGAGEMENT (N/A if insufficient data)
  - Actions (arrow to drill into detail)
- **"View all" button** on Most Viewed section
- **Device & Location section**:
  - OS data chart
  - Browser data chart
  - Geographic location data

### Showcase Analytics Tab
- Separate analytics for showcases

---

## 4. INTEGRATIONS PAGE - /integrations

### 7 Available Integrations:

1. **HubSpot** (CRM)
   - "Collect, send and sync engagement and lead data from Supademo to HubSpot"

2. **Salesforce** (CRM)
   - "Automatically collect and sync lead and engagement data from Supademo to Salesforce"

3. **Slack** (Communication)
   - "Surface engaged Supademo viewers and high-intent leads directly on your Slack channel"

4. **Google Analytics** (Analytics)
   - "Track conversions, engagement and Supademo performance directly within Google Analytics"

5. **Zapier** (Automation)
   - "Use our Zapier integration to effortlessly push Supademo lead data into your existing workflows and tools"

6. **Google Tag Manager** (Analytics)
   - "Track conversions and events through Google Tag Manager for comprehensive analytics and marketing pixel management"

7. **Marketo** (Marketing Automation)
   - "Send leads and their Supademo engagement data directly onto Marketo"

Each integration has: Connect button, category tag, "Learn more" link

---

## 5. SETTINGS PAGE - /settings/workspace

### 7 Sub-tabs:

### General Tab
- **Workspace Name** field
- **Name & Photos**: Profile photo upload, display name
- **Contact Info**: Email (read-only, cannot be changed)

### API Key Tab
- API key display (masked/shown)
- "Copy API key to clipboard" button
- Description: "Generate an API key to access Supademo's API"

### Tags Tab
- **Create Tag** button
- Tags table with columns: Tag, Demos, Showcases, Actions (Edit/Delete)
- Default tags: Getting Started, New Hire, Onboarding

### Emails Tab
- **User Emails**:
  - Comments toggle (ON/OFF)
  - Mentions toggle (ON/OFF)
- **Workspace Emails**:
  - Trackable Links toggle (ON/OFF)
  - Monthly Recap Emails toggle (ON/OFF) - Pro, Scale, Enterprise only
  - Invoice Emails toggle (ON/OFF) + "Update who receives this invoice email" link

### Billing Tab
- Plan management and upgrade flow

### Members Tab
- **Total Members** count
- **Transfer License** button
- Role counts: Admins, Billing Admins, Creators, Viewers (with tooltips)
- Members table: Name, Email, Role (with dropdown to change), Edit actions
- 4 roles available:
  - **Admin** - full access
  - **Billing Admin** - billing management
  - **Creator** - can create/edit demos
  - **Viewer** - can only view (up to 5 on Scale plan)

### Security Tab
- **Enhancement with AI**:
  - "Allow hotspot enhancement in extension" toggle - AI enhances hotspot text during capture
- **GDPR**:
  - "Enable tracking on Supademos" toggle - controls all tracking/analytics
  - Note about cookie consent and GDPR compliance
  - Link to help center for GDPR setup
- **Account Deletion**: "Request account deletion" link (sends email to support)

---

## 6. SHOWCASES - /showcases

### Page Layout
- **Create showcase** button (top right)
- Tabs: **Shared with Team** | **Personal**
- Filters button, List order dropdown ("Recently updated"), New folder button
- Welcome banner with example showcases:
  - Customer Onboarding (Supademo)
  - Sales Showcase (Strava)
  - Feature Overview (Freshline)
- Empty state: "Share multiple Supademos in one Showcase" with Create and Explore buttons

---

## 7. AI AGENTS - /agents (Beta)

### Page
- "Build and deploy AI chat agents powered by your demos and content"
- **Create Agent** button

### Create Agent Dialog
- **Name** field (placeholder: "e.g., Product Demo Assistant")
- **Goal** selection (3 options):
  1. **Qualify + book meeting** - "Qualify leads and book meetings"
  2. **Drive self-serve signup** - "Guide users to sign up or start a trial"
  3. **Drive purchase** - "Help visitors make a purchase"
- **Cancel** and **Next** buttons
- Note: "You can change these settings later in the agent editor"

---

## 8. DEMO HUB - /hubs

### Page
- "Demo Hubs allow you to group Supademos and Showcases into a contextual, searchable hub inside of your application, website, or document"
- **Create Demo Hub** button
- **Learn more** link to documentation
- **Watch Tutorial** button
- **Live examples** from real companies:
  - Strava: "Drive adoption by highlighting new features and updates"
  - Freshworks: "Consolidate common support tickets into self-paced tutorials"
  - Typeform: "Build an engaging learning academy for first-time users"

---

## 9. SIDEBAR NAVIGATION (Full Menu)

1. **Home** - /home
2. **Supademos** - /demos
3. **Showcases** - /showcases
4. **Videos** (Beta) - /videos
5. **AI Agents** (Beta) - /agents
6. **Demo Hub** - /hubs
7. **Analytics** - /analytics
8. **Theme** - /customization
9. **Integrations** - /integrations
10. **Settings** - /settings/workspace

Additional sidebar elements:
- Workspace switcher (shows plan level: "Scale")
- "Invite team member" button at bottom
- Promotional cards (rotating tips, e.g., "In-App Demo Hubs", "Workspace Demo Tags")
- Quick search (Cmd+K)
- Chrome extension download button
- Notifications bell
- User profile menu

---

## 10. VOICEOVER SETTINGS (Detailed)

### AI Voiceover Mode
- **Voice** dropdown (e.g., Bria) - multiple AI voice options
- **Clone your voice** button - create custom voice clone
- **Advanced Settings** button
- Per-step voiceover text editing
- **Sync with hotspots** button - auto-populate from hotspot text
- **Insert hotspot text** button per step
- Play/preview button per step
- Save/Close buttons

### Manual Voiceover Mode
- Record or upload audio per step

---

## SCREENSHOTS CAPTURED

All screenshots saved to `D:/V3/NavatticResearch/screenshots/`:
- supademo-editor-overview.png
- supademo-editor-step2-hotspots.png
- supademo-hotspot-navigation.png
- supademo-settings-supademo-tab.png
- supademo-settings-hotspots-tab.png
- supademo-settings-branding-tab.png
- supademo-settings-share-tab.png
- supademo-settings-seo-tab.png
- supademo-enhance-ai-audit.png
- supademo-voiceover-settings.png
- supademo-share-links.png
- supademo-share-embeds.png
- supademo-backgrounds-panel.png
- supademo-analytics.png
- supademo-integrations.png
- supademo-settings-general.png
- supademo-create-agent.png
- supademo-demo-hub.png
- supademo-theme-branding.png

---

## KEY COMPETITIVE INSIGHTS

### Strengths to Match or Beat
1. **AI Suite is comprehensive**: Audit, Text generation, Voice (with cloning), Translation - all in one dialog
2. **Hotspot branching**: Next/Back buttons can go to any step or external URL, enabling non-linear demos
3. **Dynamic variables**: {{name}}, {{company}}, {{custom_variable}} for personalization
4. **10 built-in background music tracks** with volume control
5. **Export versatility**: Video/GIF (up to 4K/60fps), PDF, PNG, SOP guide copy
6. **Popup embed** with framework-specific code (HTML, React, Angular, Vue.js, Svelte)
7. **Trackable share links** with integration to 8+ sales tools
8. **Demo Hub** concept - group demos into searchable in-app experiences
9. **AI Agents** (Beta) - deploy AI chat agents powered by demos
10. **Translation Hub** - multi-language support with browser auto-detection
11. **GDPR compliance** controls built into Security settings
12. **Voice cloning** for AI voiceovers

### Gaps / Weaknesses to Exploit
1. Watermark CTA is **read-only on Scale plan** (can't customize without Enterprise)
2. "Full Width Share Page" is **disabled** on Scale plan
3. Only **7 integrations** (no Pipedrive, Intercom CRM, Monday, Jira, etc.)
4. Accessibility tab has **only 1 option** (Show CC Button) - minimal
5. **No A/B testing** of demos visible
6. **No conditional branching** based on viewer behavior (only manual step selection)
7. **No form/input** capture within demos (email gating not visible in Share tab)
8. Only 4 member roles - no custom roles
9. No visible **webhooks** configuration
10. **Videos feature is Beta** - still maturing
