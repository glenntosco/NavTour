# Supademo Deep Review - Competitive Research
**Date:** 2026-03-28
**Plan:** Scale (14-day trial)
**Workspace:** My Company

---

## 1. Platform Overview

Supademo is an interactive product demo platform that lets users create step-by-step guided demos from screenshots. The app is organized around a sidebar navigation with 10 main sections, plus a full-featured demo editor with 8 toolbar options.

**Top Bar (Global):**
- Quick Search (Cmd+K shortcut)
- Chrome Extension download prompt
- Notifications bell
- User profile menu

**Sidebar Footer:**
- In-App Demo Hubs promotional card (Learn More / Skip)
- Invite team member button

---

## 2. Sidebar Navigation Pages

### 2.1 Home (/home)
- Dashboard landing page (previously captured)

### 2.2 Supademos (/demos)
**Screenshot:** `supademo-demos-page.png`

**Page Title:** "Team Supademos"

**Key UI Elements:**
- **Create Button** (green, primary CTA with dropdown arrow) - positioned top-right
- **Content Type Toggle:** Radio group with "Supademos" and "Screenshots" options
- **Tabs:** Shared with Team | Personal | Archived
- **Toolbar Controls:**
  - Filters button
  - List order dropdown ("Recently updated")
  - New folder button
  - View toggle (grid view / list view)
- **Demo Cards** (grid view): Shows preview thumbnail, demo title, author name, date, and options menu
  - Hover actions: Change tag, Edit demo, Copy shareable demo link
  - Options menu (three dots)

### 2.3 Showcases (/showcases)
**Screenshot:** `supademo-showcases-page.png`

**Page Title:** "Team Showcases"

**Key UI Elements:**
- **Create showcase** button (green, top-right) with "+" icon
- **Tabs:** Shared with Team | Personal (no Archived tab)
- **Toolbar:** Filters, Recently updated sort, New folder, Grid view toggle
- **Welcome Banner:** "Welcome to Showcases!" with description and 3 example links:
  - Customer Onboarding (Supademo)
  - Sales Showcase (Strava)
  - Feature Overview (Freshline)
- **Table View** with columns: Name, Owner, Updated, Insights, Edit
- **Empty state CTA:** "Share multiple Supademos in one Showcase" with Create showcase and Explore an example buttons

**Key Insight:** Showcases bundle multiple Supademos into a single shareable URL or embed. This is similar to Navattic's "Collections" concept.

### 2.4 Videos (/videos) - Beta
**Screenshot:** `supademo-videos-page.png`

**Page Title:** "Videos"

**Key UI Elements:**
- **Tabs:** Shared with Team | Personal | Archived
- **Toolbar:** Filters, Recently updated sort
- **Empty State:** "No videos yet" with description about uploading and managing video content
- No create button visible - appears to be upload-only

**Key Insight:** Beta feature for video-based demos/tutorials. Separate from the screenshot-based Supademos.

### 2.5 AI Agents (/agents) - Beta
**Screenshot:** `supademo-ai-agents-page.png`

**Page Title:** "AI Agents"

**Key UI Elements:**
- **Create Agent** button (purple, top-right)
- **Description:** "Build and deploy AI chat agents powered by your demos and content."
- **Empty State:** "No agents yet. Create your first AI agent to get started." with Create Agent button

**Key Insight:** This is a unique feature - AI-powered chat agents that can use demo content to answer questions. Not seen in Navattic.

### 2.6 Demo Hub (/hubs)
**Screenshot:** `supademo-demo-hub-page.png`

**Page Title:** "Demo Hub"

**Key UI Elements:**
- **Create Demo Hub** button (purple, top-right)
- **Description:** Groups Supademos and Showcases into a contextual, searchable hub inside applications, websites, or documents
- **Help link** to documentation
- **Tutorial Section:** "Try live examples" with Dismiss and Watch Tutorial buttons
- **Example Cards (3):**
  - Strava: "Drive adoption by highlighting new features and updates"
  - Freshworks: "Consolidate common support tickets into self-paced tutorials"
  - Typeform: "Build an engaging learning academy for first-time users"

**Key Insight:** In-app demo hub feature - embeddable searchable hub. This is a significant differentiator for in-product education use cases.

### 2.7 Analytics (/analytics)
**Screenshot:** `supademo-analytics-page.png`

**Page Title:** "Analytics"

**Key UI Elements:**
- **Tabs:** Supademo Analytics | Showcase Analytics
- **Controls:** More actions (three dots), Filters, Date range picker (Feb 27 - Mar 28, 26)
- **Supademo Views Section:**
  - Total Viewers count with info tooltip
  - Average Engagement percentage with info tooltip
  - Line chart with Viewers (purple) and Engagement (green) legends
  - Time-series X-axis
- **Most Viewed Table:**
  - Columns: SUPADEMO, VIEWS, UNIQUE VIEWERS, ENGAGEMENT, Actions
  - Each row shows demo name, author, view count, unique viewer count, engagement (N/A if no data), arrow link
  - "View all" button
- **Device & Location Section:**
  - OS data (empty state with placeholder)
  - Browser data (empty state with placeholder)
  - Location/Geographic data (empty state with placeholder - map visualization implied)

### 2.8 Theme / Global Customization (/customization)
**Screenshots:** `supademo-theme-branding-page.png`, `supademo-theme-supademo-tab.png`, `supademo-theme-custom-domain-tab.png`, `supademo-theme-seo-tab.png`

**Page Title:** "Global Customization"

**Sub-tabs: Branding | Supademo | Custom Domain | SEO**

#### 2.8.1 Branding Tab
- **Watermark CTA** (Read only on this plan):
  - Enable/Disable toggle (locked on Scale trial)
  - Watermark Logo upload
  - Watermark Text field (default: "Created on Supademo")
  - Watermark Link field (default: https://supademo.com)
  - Preview of watermark appearance
- **Share Page Logo:**
  - Upload custom logo for shared demo pages (top-left position)
  - Preview of share page
- **Demo Share page - Favicon:**
  - Upload PNG favicon (32x32 to 256x256)
  - Preview of browser tab appearance
- **Share Page Button:**
  - Button Text field (e.g., "Create Supademo")
  - Link URL field
  - Background color picker (#4f46e5 default)
  - Text color picker (#fff default)
  - Live preview of button

#### 2.8.2 Supademo Tab
- **Default Hotspot Settings:** "Edit Hotspot Settings" button with live preview
- **Chapter Settings:**
  - Introduction Chapter (shown at start) - Edit button
  - Call-to-Action Chapter (shown at end) - Edit button
- **Font Settings:**
  - Font selector dropdown (Default)
  - "Upload font" button for custom fonts
  - Live preview of font on hotspot
- **Background Music Settings:**
  - Music selector dropdown ("No background music")
  - Upload custom music button
- **General Settings:**
  - Browser Bar: Dropdown (Light Browser Bar / Dark / Off) with preview
  - Progress Bar: Toggle switch (on) with preview
  - Option to open in new tab: Toggle switch (on) - shows external link icon on embeds

#### 2.8.3 Custom Domain Tab
- **Custom Domain:** Connect your own domain for brand consistency
- "Connect domain" button
- Preview showing: https://subdomain.your-domain.com/demo/*

#### 2.8.4 SEO Tab
- **Default SEO Settings:**
  - Show description and steps on share page: Toggle (on)
  - Show author in demo page: Toggle (on)
  - Allow search engines to index your Supademo: Toggle (on)

### 2.9 Integrations (/integrations)
**Screenshot:** `supademo-integrations-page.png`

**Page Title:** "Integrations"

**Available Integrations (7 total):**

| Integration | Category | Description |
|---|---|---|
| **HubSpot** | CRM | Collect, send and sync engagement and lead data |
| **Salesforce** | CRM | Automatically collect and sync lead and engagement data |
| **Slack** | Communication | Surface engaged viewers and high-intent leads |
| **Google Analytics** | Analytics | Track conversions, engagement and performance |
| **Zapier** | Automation | Push lead data into existing workflows |
| **Google Tag Manager** | Analytics | Track conversions and events, marketing pixel management |
| **Marketo** | Marketing Automation | Send leads and engagement data |

Each integration card has: Logo, name, Connect button (green), description, category tag, and "Learn more" link.

### 2.10 Settings (/settings/workspace)
**Screenshots:** `supademo-settings-workspace.png`, `supademo-settings-billing.png`

**Page Title:** "Workspace Settings"

**Sub-tabs: General | API Key | Tags | Emails | Billing | Members (1) | Security**

#### 2.10.1 General Tab
- **Workspace Name:** Text input
- **Name & Photos:** Profile photo upload/remove, name field
- **Contact Info:** Email (read-only, cannot be changed)

#### 2.10.2 Billing Tab
- **Current Plan:** Supademo Scale Trial
  - 14 days left in trial
  - Billed Monthly
  - $50/creator/month
  - Total members: 1
  - Trial ends: 10 April 2026
- **Actions:** Billing info & invoices, Cancel trial, Upgrade now
- **Plan Comparison:**
  - Monthly/Yearly toggle ("Save up to 33% with annual billing")

**Scale ($50/mo):**
- Unlimited Supademos
- Showcases & collections
- Team workspace with 5 free viewers
- Zoom & autoplay
- Custom branding & domain
- Advanced demo analytics
- Supademo AI
- Dynamic variables
- Trackable share links
- Limited integrations
- Per creator/admin billing, 5 free workspace viewers

**Growth ($450/mo) - "Highest ROI":**
- Everything in Scale plus:
- 5 creators pre-bundled
- Unlimited HTML interactive demos
- Edit text, images and HTML elements
- Invisible hotspots
- AI Voice Cloning
- Unlimited view-only team members
- Advanced data integrations
- 5 creators bundled, additional at $50/mo, unlimited workspace viewers

**Enterprise (Custom Pricing):**
- Everything in Growth plus:
- Custom billing and pricing
- Single sign-on (SSO & SAML)
- Analytics exports
- Custom data retention policies
- White-glove onboarding
- On-prem hosting
- Unlimited workspaces
- Unlimited free workspace viewers
- Starts at 10 Creators

---

## 3. Demo Editor

**Screenshot:** `supademo-editor-overview.png`

### 3.1 Editor Layout

**Top Bar:**
- Back button (returns to demos list)
- Demo title (editable, with pencil icon)
- Demo Utility Menu (three dots)
- Analytics button
- "Enhance with AI" button (sparkle icon, green outline)
- Preview link (opens in new tab)
- Share button (purple, primary CTA)

**Left Panel: Step Navigation**
- Vertical scrollable list of step thumbnails
- "+ Add Step" buttons between each step
- Step numbers shown on thumbnails
- Indicators for: Zoom Enabled, Chapter steps (different visual treatment)
- "More options" button per step
- Checkbox for multi-select (appears when step is active)

**Center: Canvas/Editor Area**
- Step name input field (top-left, e.g., "Step 1")
- Image dimensions display (e.g., "2424 x 884")
- Browser bar simulation (with traffic lights, URL, hide/dark mode toggles)
- Main screenshot/content area with hotspots overlaid
- Zoom out button

**Right Panel: Side Tools**
- Backgrounds button
- Resize & Crop button (only on image steps)
- Comments button

**Bottom Bar:**
- Same as right panel (Backgrounds, Resize & Crop, Comments)

### 3.2 Toolbar Options

The editor toolbar has 8 options displayed horizontally above the canvas:

#### 3.2.1 Hotspot
**Screenshot:** `supademo-editor-hotspot-panel.png`

Opens a full left-panel with "Hotspot settings" heading.

**Content Section (collapsible):**
- **Text Editor:** Rich text with toolbar
  - Bold, Italic, Link
  - Ordered list, Bullet list
  - Clear text button
  - Set dynamic variable button ({{}} icon)
- **Text Alignment:** Left | Center | Right radio buttons
- **Visit URL:** Edit / Remove options

**Appearance Section (collapsible):**
- **Hotspot Style:** Pointer | Callout | Area (radio with icons)
- **Background Color:** Color picker + hex input (#4f46e5)
- **Text Color:** Color picker + hex input (#fff)
- **Backdrop:** Dropdown (Off, and likely Dark/Blur options)
- **Border Radius:** Dropdown (Round, and likely Square/Custom)
- **Animation:** Dropdown (Ping, and likely other options)
- **Visibility:** Dropdown (Always, and likely On Hover/On Click)
- **Width:** Small | Medium | Large radio
- **Position:** Auto | Top | Right | Bottom | Left radio (with directional icons)

**Navigation Section (collapsible):**
- **Navigation Buttons:** Hidden | Show
- **Next Button:**
  - Display: Yes | No
  - Button Text field
  - Background/Text color pickers
  - Action: Go to Slide | External URL
  - Go to Step: Dropdown (Next step default, or specific step)
- **Back Button:**
  - Same options as Next button
  - Default action: Previous step

**Bottom Actions:** Delete | Close | Save

#### 3.2.2 Blur & Annotate
**Screenshot:** `supademo-editor-blur-annotate.png`

Dropdown menu with 3 options:
- **Add Blur:** "Quickly redact sensitive info"
- **Add Text or Shapes:** "Markup with text, arrows and more"
- **Crop Slide:** "Crop, rotate or flip instantly"

#### 3.2.3 Voiceover
**Screenshot:** `supademo-editor-voiceover-panel.png`

Opens left panel with "Voiceover settings" heading.

**Mode Toggle:** AI Voiceover | Manual Voiceover

**AI Voiceover Settings:**
- **Voice:** Dropdown selector (e.g., "Bria") with info tooltip
- **Clone your voice:** Button with sparkle icon (presumably custom voice cloning)
- **Advanced Settings:** Expandable section with gear icon
- **Sync with hotspots:** Button to auto-populate voiceover text from hotspot text

**Steps List:**
- Each step listed with expand/collapse
- Chapter steps marked (e.g., "Step 1 - Chapter")
- Active step shows:
  - "Voiceover text" label with voice tips tooltip
  - "Insert hotspot text" button
  - Multi-line text input with placeholder
  - Play button (green circle) to preview voiceover

**Bottom Actions:** Close | Save (green)

#### 3.2.4 Animation
**Screenshot:** `supademo-editor-animation.png`

Dropdown menu with 2 options:
- **Zoom and Pan:** "Narrow viewer focus with zoom effects"
- **Autoplay:** "Automatically play without user interaction"

#### 3.2.5 Chapter
**Screenshot:** `supademo-editor-chapter-panel.png`

Opens left panel with "Chapter settings" heading. Navigates to the nearest chapter step.

**Chapter Type:** Default | Form | Embed | Password (4 types with icons)

**Layout:** Left | Center | Right

**Theme:** Dark | Light | Custom

**Opacity and Blur:** Slider (0-100, default 24)

**Logo:** Hide | Show, with logo preview and remove button

**Cover Image:** None | Step (from demo step) | Custom (upload)

**On Canvas (editable):**
- Logo (clickable to edit)
- Heading (editable inline)
- Description (editable inline)
- CTA Buttons (e.g., "Learn More", "Get Started")
  - Drag to reorder
  - "Add Button" option
- Blurred background from adjacent step

**Bottom Actions:** Delete chapter (trash icon) | Close | Save

#### 3.2.6 Personalize
**Screenshot:** `supademo-editor-personalize.png`

Dropdown menu with 4 options:
- **Add Dynamic Variables:** "Personalize at scale for every viewer"
- **Custom Branding:** "Configure logos, buttons and URLs"
- **Generate Text with AI:** "Automagically generate text for each step"
- **Translate with AI:** "Translate this demo to a new language"

#### 3.2.7 Upload
**Screenshot:** `supademo-editor-upload.png`

Dropdown menu with 5 options:
- **Import Supademo:** "Add steps from another Supademo"
- **Media Library:** "Import steps from previous recordings"
- **Upload Image:** "Upload your own image steps"
- **Upload Video:** "Upload your own video step"
- **Record Cam & Screen:** "Record and add a video of your screen and/or camera"

#### 3.2.8 Settings (Demo-level)
**Screenshot:** `supademo-editor-settings-dialog.png`

Opens a modal dialog with "Settings" heading and 9 sub-tabs:

**Sub-tabs:** Supademo | Hotspots | Branding | Autoplay | Background Music | Share | Accessibility | Translations | SEO

**Supademo Tab (visible in screenshot):**
- **Browser Bar:** Dropdown (Light Browser Bar / Dark Browser Bar / Off) with visual preview
- **Video play bar:** Toggle (on) - video-styled play bar at bottom
- **Progress Bar:** Toggle (on) - progress indicator at bottom
- **Font:** Dropdown (Default) with "Upload your font here" link
- **Border around the demo:** Toggle (on)
- **Option to open in new tab:** Toggle (on)

---

## 4. Key Feature Summary

### Content Types
1. **Supademos** - Screenshot-based interactive demos (core product)
2. **Showcases** - Bundles of multiple Supademos
3. **Videos** (Beta) - Video-based demos
4. **AI Agents** (Beta) - AI chat agents powered by demo content
5. **Demo Hubs** - In-app searchable collections

### AI Features
- **Enhance with AI** - One-click AI enhancement of demos
- **AI Voiceover** - Text-to-speech with multiple voices
- **Voice Cloning** - Clone your own voice for voiceovers
- **Generate Text with AI** - Auto-generate hotspot text for each step
- **Translate with AI** - Translate demos to new languages
- **Supademo AI** - Listed as Scale plan feature

### Editor Capabilities
- Hotspot placement with 3 styles (Pointer, Callout, Area)
- Rich text editing in hotspots (bold, italic, links, lists)
- Dynamic variables for personalization
- Blur tool for redacting sensitive information
- Text and shape annotations
- Crop, rotate, flip tools
- Zoom and Pan effects
- Autoplay mode
- Chapter screens (intro/CTA) with 4 types (Default, Form, Embed, Password)
- Custom branding per demo
- Background music
- Browser bar simulation (Light/Dark/Off)
- Video play bar
- Progress bar
- Comments on steps
- Backgrounds customization
- Resize & Crop tool
- Multi-step navigation with branching (Go to specific step or External URL)
- Media library for reusing recordings

### Sharing & Embedding
- Custom domains
- Shareable links
- Embeds with open-in-new-tab option
- Share page customization (logo, button, favicon)
- SEO controls (indexing, description visibility, author display)

### Analytics
- View counts and unique viewers
- Engagement metrics
- Device/OS/Browser breakdown
- Geographic location data
- Per-demo and per-showcase analytics
- Date range filtering

### Integrations (7)
- HubSpot, Salesforce (CRM)
- Slack (Communication)
- Google Analytics, Google Tag Manager (Analytics)
- Zapier (Automation)
- Marketo (Marketing Automation)

### Pricing Tiers
| Feature | Scale ($50/mo) | Growth ($450/mo) | Enterprise (Custom) |
|---|---|---|---|
| Supademos | Unlimited | Unlimited | Unlimited |
| HTML Interactive Demos | No | Unlimited | Unlimited |
| Edit text/images/HTML | No | Yes | Yes |
| Invisible Hotspots | No | Yes | Yes |
| AI Voice Cloning | No | Yes | Yes |
| View-only Members | 5 free | Unlimited | Unlimited |
| Creators | Per seat ($50) | 5 bundled | 10+ |
| SSO/SAML | No | No | Yes |
| Analytics Exports | No | No | Yes |
| On-prem hosting | No | No | Yes |

---

## 5. Competitive Observations

### Strengths vs Navattic
1. **AI-first approach** - AI voiceover, text generation, translation, and voice cloning are deeply integrated
2. **Demo Hub / In-App embeds** - Searchable hub experience inside products
3. **AI Agents (Beta)** - Unique chat agent feature powered by demo content
4. **Video support** - Mixed media (screenshots + video) in single demos
5. **Chapter screens** with Form/Embed/Password types enable gating
6. **Rich annotation tools** - Blur, shapes, text markup built-in
7. **Background music** option
8. **Zoom and Pan** animation effects
9. **Generous free tier** concepts with trials

### Weaknesses / Gaps
1. **Limited integrations** - Only 7 vs broader ecosystem support
2. **No HTML capture** on Scale plan - Only screenshots
3. **Watermark locked** on Scale trial
4. **No Intercom/Zendesk** direct integration visible
5. **No A/B testing** features visible
6. **No revenue attribution** analytics visible
7. **Settings are spread** across global Theme page and per-demo Settings dialog, creating some UX friction

### Feature Parity Opportunities
- Dynamic variables / personalization
- Branching logic (go to specific step or URL)
- Multiple CTA buttons on chapter screens
- AI text generation for step descriptions
- Translation support
- Voice cloning
- In-app demo hubs
- Video play bar UI option
