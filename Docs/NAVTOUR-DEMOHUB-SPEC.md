# NavTour.cloud — Demo Hub Feature Specification

## For Claude Code: Build an in-app Demo Hub that beats Supademo's implementation.

---

## 1. WHAT IT IS

A **Demo Hub** is an embeddable, searchable, categorized collection of interactive demos that lives inside your product, website, or documentation. Think of it as a "knowledge base" but instead of articles, it contains interactive product demos.

**Use cases:**
- **In-app onboarding**: Embed inside your product so new users can explore features at their own pace
- **Support deflection**: Replace support tickets with self-serve demo tutorials
- **Feature adoption**: Highlight new features and updates in a discoverable hub
- **Sales enablement**: Give prospects a curated gallery of demos organized by use case
- **Learning academy**: Build a training center for customers or employees
- **Documentation companion**: Embed alongside docs so users can see features in action

**How it appears to end users:**
- A **floating launcher button** in the bottom corner of a website/app (like Intercom's chat widget)
- When clicked, a **slide-out drawer** opens showing a searchable, categorized gallery of demos
- Users can search, browse by category, and launch any demo inline

---

## 2. COMPETITIVE REFERENCE (Supademo)

### What Supademo Has (Documented from Live Testing)

**3-tab editor:**

| Tab | Purpose |
|-----|---------|
| **Appearance** | Header, content theme, footer customization |
| **Content** | Categories with demos inside each |
| **Install** | SDK script, framework code, domain restrictions |

**Appearance options:**
- Display Type: Title text or Logo image
- Header Logo: Upload custom
- Alignment: Left or Center
- Background: Solid or Gradient (2 color pickers)
- Text Color: Color picker
- Close Button: Show / Hide
- Content Theme: Light / Dark
- Footer Menu Label: Custom text (default "Help")
- Custom Links: Up to 6 links in footer dropdown

**Content management:**
- Categories (default 3) — collapsible accordion, rename inline
- Add Content button per category (adds demos/showcases)
- Add new category button
- Drag to reorder

**Install options:**
- Display Mode: Launcher (floating button) or Custom Trigger (your own element)
- Launcher Logo: Upload custom (defaults to Supademo logo)
- Position: Bottom Right (dropdown)
- SDK: Single script tag + init code
- Framework tabs: HTML, React, Angular, Vue.js, Svelte
- Allowed Domains: Optional whitelist

**Live preview:** Right-side panel showing the actual widget with logo, search bar, category tabs, demo cards, footer

---

## 3. NavTour Demo Hub — FULL SPECIFICATION

### 3.1 Editor Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back    P4 Warehouse Knowledge Hub ✏️           [Cancel] [Save]  │
├──────────────────────────────────────┬──────────────────────────────┤
│                                      │                              │
│  [Appearance] [Content] [Behavior]   │    LIVE PREVIEW              │
│  [Install] [Analytics]               │                              │
│                                      │  ┌────────────────────────┐  │
│  ┌────────────────────────────────┐  │  │ [Logo]            [✕]  │  │
│  │                                │  │  │                        │  │
│  │  Current tab settings          │  │  │ 🔍 Search demos...     │  │
│  │  (see sections below)          │  │  │                        │  │
│  │                                │  │  │ [All] [Getting Started]│  │
│  │                                │  │  │ [Features] [Admin]     │  │
│  │                                │  │  │                        │  │
│  │                                │  │  │ ┌──────┐ ┌──────┐     │  │
│  │                                │  │  │ │ Demo │ │ Demo │     │  │
│  │                                │  │  │ │  1   │ │  2   │     │  │
│  │                                │  │  │ └──────┘ └──────┘     │  │
│  │                                │  │  │                        │  │
│  │                                │  │  │ ┌──────┐ ┌──────┐     │  │
│  │                                │  │  │ │ Demo │ │ Demo │     │  │
│  │                                │  │  │ │  3   │ │  4   │     │  │
│  │                                │  │  │ └──────┘ └──────┘     │  │
│  │                                │  │  │                        │  │
│  │                                │  │  │ [Resources ▾]  [Help] │  │
│  └────────────────────────────────┘  │  └────────────────────────┘  │
│                                      │                              │
│                                      │         [Launcher Icon]      │
└──────────────────────────────────────┴──────────────────────────────┘
```

### 3.2 Tab 1: Appearance

#### Header Section

| Setting | Options | Description |
|---------|---------|-------------|
| **Display Type** | Title / Logo | Choose text heading or uploaded logo |
| **Header Title** | Text input | Shown when Display Type = Title (e.g., "P4 Warehouse Help Center") |
| **Header Logo** | Image upload (PNG, SVG, JPG) | Shown when Display Type = Logo. Drag-drop or click to upload. Remove button. |
| **Header Subtitle** | Text input | Optional subtitle below title/logo (NavTour exclusive — Supademo doesn't have this) |
| **Alignment** | Left / Center / Right | Align header content (NavTour adds Right — Supademo only has Left/Center) |
| **Background** | Solid / Gradient / Image | Background style for header area |
| **Background Color 1** | Color picker + hex input | Primary background color |
| **Background Color 2** | Color picker + hex input | Secondary color (for gradient) |
| **Background Image** | Image upload | Custom header background image (NavTour exclusive) |
| **Background Overlay** | Opacity slider (0-100) | Darken/lighten background image (NavTour exclusive) |
| **Text Color** | Color picker + hex input | Header text color |
| **Close Button** | Show / Hide | Show X button (users can always close with Esc) |

#### Content Section

| Setting | Options | Description |
|---------|---------|-------------|
| **Content Theme** | Light / Dark / Auto | Light mode, dark mode, or match system preference (Auto is NavTour exclusive) |
| **Card Style** | Grid / List | Demo cards in grid (2 columns) or list (full width) — NavTour exclusive |
| **Show Thumbnails** | On / Off | Show demo preview images on cards — NavTour exclusive |
| **Show Descriptions** | On / Off | Show demo description text on cards — NavTour exclusive |
| **Show Duration** | On / Off | Show estimated completion time on cards — NavTour exclusive |
| **Show Step Count** | On / Off | Show number of steps per demo — NavTour exclusive |

#### Footer Section

| Setting | Options | Description |
|---------|---------|-------------|
| **Menu Label** | Text input (default: "Resources") | Label for footer dropdown menu |
| **Custom Links** | Up to 10 links (text + URL) | Footer menu links (Supademo allows 6, NavTour allows 10) |
| **CTA Button** | Text + URL + Color | Optional CTA button in footer (NavTour exclusive — e.g., "Book a Demo") |
| **Powered By** | Show / Hide / Custom | "Powered by NavTour" / hidden / custom text (white-label on Growth+) |

#### Branding Section (NavTour Exclusive)

| Setting | Options | Description |
|---------|---------|-------------|
| **Font Family** | Dropdown + custom upload | Match your product's typography |
| **Border Radius** | Slider (0-24px) | Roundness of the hub drawer and cards |
| **Accent Color** | Color picker | Color for active tabs, buttons, highlights |

### 3.3 Tab 2: Content

#### Categories

```
┌─────────────────────────────────────────────────────┐
│ ▼ Getting Started                          [⋯] [+] │
│   ┌─────────────────────────────────────────────┐   │
│   │ 📦 Create Your First Demo      [↕] [✕]     │   │
│   │ 📦 Add Team Members            [↕] [✕]     │   │
│   │ 📦 Publish & Share             [↕] [✕]     │   │
│   └─────────────────────────────────────────────┘   │
│                     [+ Add Content]                  │
├─────────────────────────────────────────────────────┤
│ ▶ Features                                 [⋯] [+] │
├─────────────────────────────────────────────────────┤
│ ▶ Admin Settings                           [⋯] [+] │
├─────────────────────────────────────────────────────┤
│ ▶ Integrations                             [⋯] [+] │
└─────────────────────────────────────────────────────┘
              [+ Add New Category]
```

| Feature | Description |
|---------|-------------|
| **Categories** | Collapsible accordion sections. Editable name (inline). Drag to reorder. |
| **Add Content** | Click to add demos from your library. Opens a picker showing all published demos with search and filter. |
| **Content Types** | Demos, Showcases (multi-demo bundles), Videos, External Links (NavTour exclusive) |
| **Per-item Settings** | Custom title override, custom description override, custom thumbnail override |
| **Drag to Reorder** | Reorder both categories and items within categories |
| **Category Icon** | Optional emoji or icon per category (NavTour exclusive) |
| **Category Description** | Optional description text shown under category tab (NavTour exclusive) |
| **"All" Tab** | Auto-generated tab showing all content across categories (NavTour exclusive) |
| **Default Category** | Set which category is selected by default when hub opens |
| **Empty State** | Custom message for categories with no content |

### 3.4 Tab 3: Behavior (NavTour Exclusive — Supademo doesn't have this)

| Setting | Options | Description |
|---------|---------|-------------|
| **Open Trigger** | Launcher / Custom Trigger / URL Hash / JS API | How the hub opens |
| **Auto-Open** | Off / First Visit / Always | Automatically open hub on page load |
| **Auto-Open Delay** | Number input (ms) | Delay before auto-opening (default 3000ms) |
| **Remember State** | On / Off | Remember which category the user was browsing (localStorage) |
| **Search** | On / Off | Enable/disable the search bar |
| **Search Placeholder** | Text input | Custom placeholder text (default: "Search demos...") |
| **Keyboard Shortcut** | Key combination input | Custom keyboard shortcut to open hub (e.g., Ctrl+Shift+H) |
| **Mobile Behavior** | Drawer / Fullscreen / Redirect | How hub appears on mobile devices |
| **Notification Badge** | Off / Count / Dot | Show badge on launcher for new/unread content |
| **New Content Indicator** | On / Off | Show "New" badge on recently added demos |
| **Completion Tracking** | On / Off | Track which demos users have completed and show checkmarks |
| **Contextual Targeting** | URL rules | Show/hide specific categories or demos based on current URL |

### 3.5 Tab 4: Install

#### Launcher Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Display Mode** | Launcher / Custom Trigger | Floating button or your own trigger element |
| **Launcher Style** | Icon / Icon + Text / Text Only | How the launcher button looks (NavTour exclusive) |
| **Launcher Icon** | Upload custom / Choose from library | Custom launcher icon |
| **Launcher Text** | Text input | Text shown on launcher (e.g., "Explore", "Help") — NavTour exclusive |
| **Launcher Color** | Color picker | Background color of launcher button |
| **Position** | Bottom Right / Bottom Left / Top Right / Top Left | Where the launcher appears (Supademo only has Bottom Right) |
| **Offset X** | Number input (px) | Horizontal offset from corner |
| **Offset Y** | Number input (px) | Vertical offset from corner |
| **Z-Index** | Number input | Stack order (for apps with existing floating elements) — NavTour exclusive |
| **Hide on Pages** | URL pattern input | Pages where the launcher should be hidden |

#### SDK Installation

```
Install SDK
Add this code inside the <head> or <body> tags:

┌──────────────────────────────────────────────────────┐
│ <script src="https://cdn.navtour.cloud/hub.js">     │
│ </script>                                      [📋] │
└──────────────────────────────────────────────────────┘

Initialize the Demo Hub:
[HTML] [React] [Vue] [Angular] [Svelte] [Next.js]

┌──────────────────────────────────────────────────────┐
│ <script>                                             │
│   NavTour.hub.init("hub_abc123", {                   │
│     position: "bottom-right",                        │
│     theme: "light",                                  │
│     locale: "en"                                     │
│   });                                          [📋] │
│ </script>                                            │
└──────────────────────────────────────────────────────┘
```

| Feature | Description |
|---------|-------------|
| **Framework tabs** | HTML, React, Vue, Angular, Svelte, **Next.js** (NavTour adds Next.js) |
| **Copy button** | One-click copy code to clipboard |
| **Allowed Domains** | Optional domain whitelist for security |
| **CSP Support** | Nonce attribute guidance for Content Security Policy |
| **npm Package** | `npm install @navtour/hub` — NavTour exclusive (Supademo is script-tag only) |

### 3.6 Tab 5: Analytics (NavTour Exclusive — Supademo has no per-hub analytics)

| Metric | Description |
|--------|-------------|
| **Hub Opens** | How many times the hub was opened |
| **Unique Users** | Distinct users who opened the hub |
| **Search Queries** | What users searched for (with frequency) |
| **Top Categories** | Most-visited categories |
| **Top Demos** | Most-viewed demos within the hub |
| **Completion Rate** | % of users who finish a demo after opening it from the hub |
| **Search Miss Rate** | % of searches with no results (tells you what content is missing) |
| **Time in Hub** | Average time spent browsing the hub |
| **Bounce Rate** | % of users who open hub but don't click a demo |
| **Funnel** | Hub Open → Category Click → Demo Click → Demo Complete |

---

## 4. THE HUB WIDGET (End-User View)

### 4.1 Launcher Button

```
                                              ┌─────┐
                                              │ [?] │  ← Floating button
                                              │     │     with icon/logo
                                              └─────┘
```

- Circular or rounded-rect button, 56x56px default
- Custom logo or icon inside
- Optional text label next to it
- Optional notification badge (dot or count)
- Hover: subtle scale + shadow increase
- Click: opens the hub drawer with spring animation

### 4.2 Hub Drawer (Open State)

```
┌──────────────────────────────────────────┐
│  [Logo/Title]                       [✕]  │  ← Header (customizable bg)
│                                          │
│  🔍 Search demos...                     │  ← Search bar
│                                          │
│  [All] [Getting Started] [Features]      │  ← Category tabs (scrollable)
│  [Admin] [Integrations]                  │
│                                          │
│  ┌────────────────┐ ┌────────────────┐   │  ← Demo cards grid
│  │ [thumbnail]    │ │ [thumbnail]    │   │
│  │ Demo Title     │ │ Demo Title     │   │
│  │ 3 min • 8 steps│ │ 5 min • 12 stp │   │
│  │ ✓ Completed    │ │                │   │
│  └────────────────┘ └────────────────┘   │
│                                          │
│  ┌────────────────┐ ┌────────────────┐   │
│  │ [thumbnail]    │ │ [thumbnail]    │   │
│  │ Demo Title     │ │ Demo Title     │   │
│  │ 2 min • 5 steps│ │ 4 min • 10 stp │   │
│  │ 🆕 New         │ │                │   │
│  └────────────────┘ └────────────────┘   │
│                                          │
│  [Resources ▾]  [Book Demo]  [Help]      │  ← Footer
└──────────────────────────────────────────┘
```

### 4.3 Demo Card Interactions

- **Hover**: Card lifts with shadow, play button overlay appears on thumbnail
- **Click**: Demo launches inline within the hub drawer (no page navigation)
- **Back button**: Returns to the hub grid from within a demo
- **Completion badge**: Green checkmark after finishing a demo
- **"New" badge**: Shown for demos added in the last 7 days (configurable)
- **Duration badge**: "3 min" estimated time (auto-calculated from step count)
- **Step count**: "8 steps" shown below title

### 4.4 Search Behavior

- **Instant search** — filters demos as you type (no submit button)
- Searches: demo titles, descriptions, category names, tags
- **Empty state**: "No demos found for '[query]'" with suggestion to browse categories
- **Recent searches**: Shows last 3 searches on focus (NavTour exclusive)

### 4.5 Mobile Behavior

| Mode | How It Works |
|------|-------------|
| **Drawer** (default) | Slides up from bottom, 90% viewport height |
| **Fullscreen** | Takes over the entire screen |
| **Redirect** | Opens hub in a new browser tab |

---

## 5. NavTour ADVANTAGES OVER SUPADEMO'S DEMO HUB

| Feature | Supademo | NavTour |
|---------|----------|---------|
| Tabs in editor | 3 (Appearance, Content, Install) | **5** (+ Behavior, Analytics) |
| Header subtitle | No | **Yes** |
| Header alignment | Left / Center | **Left / Center / Right** |
| Background image | No | **Yes** |
| Content theme | Light / Dark | **Light / Dark / Auto** |
| Card style | Grid only | **Grid / List** |
| Show duration/steps | No | **Yes** |
| Completion tracking | No | **Yes (checkmarks)** |
| New content badge | No | **Yes** |
| Custom links | 6 max | **10 max** |
| Footer CTA button | No | **Yes** |
| White-label | "Powered by Supademo" | **Removable on Growth+** |
| Custom font | No | **Yes** |
| Custom border radius | No | **Yes** |
| Auto-open | No | **Yes (first visit / always)** |
| Keyboard shortcut | No | **Yes** |
| Search placeholder | Fixed | **Customizable** |
| Notification badge | No | **Yes (dot / count)** |
| Contextual targeting | No | **Yes (URL rules)** |
| Mobile behavior | Not documented | **Drawer / Fullscreen / Redirect** |
| Launcher position | Bottom Right only | **4 corners** |
| Launcher text | No | **Yes** |
| Launcher offset | No | **Yes (X/Y pixel control)** |
| Z-index control | No | **Yes** |
| npm package | No (script tag only) | **Yes** |
| Next.js support | No | **Yes** |
| Per-hub analytics | No | **Yes (10 metrics)** |
| Search miss tracking | No | **Yes** |
| Category icons | No | **Yes** |
| Category descriptions | No | **Yes** |
| "All" tab | No | **Yes (auto-generated)** |
| External links in hub | No | **Yes** |
| Remember browse state | No | **Yes (localStorage)** |

---

## 6. IMPLEMENTATION NOTES

### Data Model

```
DemoHub
├── id
├── name
├── workspaceId
├── appearance
│   ├── displayType (title | logo)
│   ├── title
│   ├── subtitle
│   ├── logoUrl
│   ├── alignment (left | center | right)
│   ├── background { type, color1, color2, imageUrl, overlay }
│   ├── textColor
│   ├── closeButton (show | hide)
│   ├── contentTheme (light | dark | auto)
│   ├── cardStyle (grid | list)
│   ├── showThumbnails
│   ├── showDescriptions
│   ├── showDuration
│   ├── showStepCount
│   ├── font
│   ├── borderRadius
│   ├── accentColor
│   ├── footerMenuLabel
│   ├── footerLinks[]
│   ├── footerCTA { text, url, color }
│   └── poweredBy (show | hide | custom)
├── categories[]
│   ├── id
│   ├── name
│   ├── icon
│   ├── description
│   ├── order
│   └── items[]
│       ├── id
│       ├── type (demo | showcase | video | link)
│       ├── referenceId
│       ├── titleOverride
│       ├── descriptionOverride
│       ├── thumbnailOverride
│       └── order
├── behavior
│   ├── openTrigger (launcher | custom | hash | api)
│   ├── autoOpen (off | firstVisit | always)
│   ├── autoOpenDelay
│   ├── rememberState
│   ├── searchEnabled
│   ├── searchPlaceholder
│   ├── keyboardShortcut
│   ├── mobileBehavior (drawer | fullscreen | redirect)
│   ├── notificationBadge (off | count | dot)
│   ├── newContentIndicator
│   ├── completionTracking
│   └── contextualRules[]
├── install
│   ├── displayMode (launcher | customTrigger)
│   ├── launcherStyle (icon | iconText | text)
│   ├── launcherIcon
│   ├── launcherText
│   ├── launcherColor
│   ├── position (bottomRight | bottomLeft | topRight | topLeft)
│   ├── offsetX
│   ├── offsetY
│   ├── zIndex
│   ├── hideOnPages[]
│   └── allowedDomains[]
└── analytics
    ├── hubOpens
    ├── uniqueUsers
    ├── searchQueries[]
    ├── topCategories[]
    ├── topDemos[]
    └── ...
```

### JS SDK API

```javascript
// Initialize
NavTour.hub.init("hub_abc123", options);

// Open/close programmatically
NavTour.hub.open();
NavTour.hub.close();
NavTour.hub.toggle();

// Open to specific category
NavTour.hub.open({ category: "getting-started" });

// Open to specific demo
NavTour.hub.open({ demo: "demo_xyz" });

// Update badge
NavTour.hub.setBadge(3);       // Number badge
NavTour.hub.setBadge("dot");   // Dot indicator
NavTour.hub.clearBadge();

// Events
NavTour.hub.on("open", callback);
NavTour.hub.on("close", callback);
NavTour.hub.on("search", callback);
NavTour.hub.on("demoStart", callback);
NavTour.hub.on("demoComplete", callback);

// Destroy
NavTour.hub.destroy();
```

---

## 7. DESIGN REQUIREMENTS

- **Drawer animation**: Slide from right, 300ms, spring easing
- **Drawer width**: 420px on desktop, 100% on mobile
- **Drawer height**: 100vh (full height)
- **Shadow**: Large shadow on the left edge of the drawer
- **Backdrop**: Optional semi-transparent overlay behind drawer
- **Card grid**: 2 columns, 12px gap
- **Card thumbnail**: 16:9 aspect ratio
- **Search**: Debounced 200ms, instant filter
- **Category tabs**: Horizontal scroll with fade indicators, no wrapping
- **Launcher button**: 56x56px, circular, shadow-lg, hover scale 1.05
- **Transitions**: All state changes animated (tab switch, search filter, card hover)
- **Keyboard**: Escape to close, Tab to navigate cards, Enter to open demo
- **Accessibility**: Full ARIA labels, focus management, screen reader support

---

*This specification covers the complete Demo Hub feature for NavTour.cloud. It matches everything Supademo offers and adds 25+ additional capabilities for a market-leading implementation.*
