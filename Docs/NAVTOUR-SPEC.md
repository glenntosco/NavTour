# NavTour.cloud — Product & Design Specification

## For Claude Code: Build the absolute best interactive demo platform in the market.

---

## 1. PRODUCT IDENTITY

**Name:** NavTour.cloud
**Tagline:** "The only demo platform you'll ever need."
**What it is:** A no-code platform for creating interactive product demos that capture, edit, and share clickable replicas of any web application. It serves marketing, sales, pre-sales, customer success, and product teams — every team, not just one.

**The mission:** Be better than Navattic, Supademo, Storylane, and Reprise combined. More features, better design, easier to use, faster to deploy, and more affordable.

---

## 2. DESIGN PHILOSOPHY

### 2.1 Visual Identity

NavTour should look like a **Stripe/Linear/Vercel-class product** — not like a typical B2B SaaS tool. Every screen should feel intentional, premium, and fast.

**Design principles:**
- **Clarity over cleverness** — Every element earns its place. No decorative noise.
- **Speed is a feature** — Every interaction feels instant. Optimistic UI, skeleton loading, smooth transitions.
- **Progressive disclosure** — Show what's needed now, reveal complexity on demand. Never overwhelm.
- **Consistency is trust** — Same patterns everywhere. Once you learn one thing, you know how everything works.
- **Delight in details** — Micro-interactions, spring animations, thoughtful empty states, smart defaults.

### 2.2 Color System

```
Primary Brand:     #0A0A0A (near-black) — headers, primary buttons, key UI
Accent:            #6366F1 (indigo-500) — interactive elements, links, focus rings
Success:           #10B981 (emerald-500) — published, connected, positive
Warning:           #F59E0B (amber-500) — draft, attention needed
Danger:            #EF4444 (red-500) — delete, errors, destructive actions
Surface:           #FFFFFF — cards, panels, modals
Background:        #FAFAFA — page background
Subtle Background: #F5F5F5 — secondary surfaces, sidebars
Border:            #E5E5E5 — default borders
Border Hover:      #D4D4D4 — borders on hover
Text Primary:      #0A0A0A — headings, body text
Text Secondary:    #737373 — descriptions, helper text
Text Muted:        #A3A3A3 — placeholders, disabled text
```

**Dark mode:** Full dark mode support from day one. Not an afterthought.
```
Surface:           #0A0A0A
Background:        #000000
Subtle Background: #171717
Border:            #262626
Text Primary:      #FAFAFA
Text Secondary:    #A3A3A3
```

### 2.3 Typography

```
Headings:          Inter (or Geist Sans) — weight 600-700
Body:              Inter (or Geist Sans) — weight 400-500
Mono:              JetBrains Mono (or Geist Mono) — code, IDs, technical values
```

**Scale:**
```
Display:     36px / 40px line-height — hero sections, onboarding
H1:          30px / 36px — page titles
H2:          24px / 32px — section headers
H3:          20px / 28px — card titles
H4:          16px / 24px — sub-headers
Body:        14px / 20px — default text (NOT 16px — denser, more professional)
Small:       13px / 18px — table cells, metadata
Caption:     12px / 16px — badges, timestamps, labels
Micro:       11px / 14px — keyboard shortcuts, status indicators
```

### 2.4 Spacing & Layout

```
Base unit:         4px
Content max-width: 1280px (centered)
Sidebar width:     260px (collapsible to 60px icon-only)
Panel width:       360px (right-side panels)
Card padding:      20px
Section gap:       32px
Element gap:       12px
Border radius:     8px (cards), 6px (buttons/inputs), 12px (modals), 9999px (pills/badges)
```

### 2.5 Shadows & Elevation

```
Shadow-xs:    0 1px 2px rgba(0,0,0,0.05)                          — subtle cards
Shadow-sm:    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)  — cards, dropdowns
Shadow-md:    0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)  — elevated cards
Shadow-lg:    0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04) — modals, popovers
Shadow-xl:    0 20px 25px rgba(0,0,0,0.1), 0 8px 10px rgba(0,0,0,0.04) — floating toolbar
Shadow-ring:  0 0 0 2px #6366F1                                    — focus state
```

### 2.6 Animation & Motion

```
Duration-fast:     100ms  — hover states, color changes
Duration-normal:   200ms  — panel open/close, dropdowns
Duration-slow:     300ms  — page transitions, modals
Duration-spring:   400ms  — floating elements, drag-drop
Easing-default:    cubic-bezier(0.4, 0, 0.2, 1)    — standard
Easing-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275)  — bouncy (for floating toolbar)
Easing-enter:      cubic-bezier(0, 0, 0.2, 1)      — elements entering
Easing-exit:       cubic-bezier(0.4, 0, 1, 1)      — elements leaving
```

**Rules:**
- Never animate more than 2 properties at once (usually transform + opacity)
- Skeleton loading on all data fetches > 100ms
- Optimistic updates for all user actions (update UI immediately, sync in background)
- No layout shift — reserve space for content before it loads
- Disable animations if user has `prefers-reduced-motion`

### 2.7 Component Library

Use **shadcn/ui** as the base, heavily customized:

**Buttons:**
```
Primary:     Dark bg (#0A0A0A), white text, subtle shadow, hover: lighten 10%
Secondary:   White bg, gray border, dark text, hover: light gray bg
Ghost:       Transparent, dark text, hover: subtle gray bg
Danger:      Red bg, white text (only for destructive confirmed actions)
Sizes:       xs (28px), sm (32px), md (36px), lg (40px)
```
- All buttons have a 1px border (even primary — use a slightly lighter shade)
- Loading state: spinner replaces text, button stays same width
- Disabled: 50% opacity, no pointer

**Inputs:**
```
Height:      36px (md), 32px (sm)
Border:      1px solid #E5E5E5, focus: 2px ring #6366F1
Padding:     0 12px
Font:        14px
Placeholder: #A3A3A3
Error:       Red border + red text below
```

**Cards:**
```
Background:  White
Border:      1px solid #E5E5E5
Radius:      8px
Padding:     20px
Hover:       Border darkens to #D4D4D4, subtle shadow-sm
Selected:    Border becomes accent color, light accent background
```

**Tables:**
```
Header:      Sticky, uppercase 12px text, gray-100 bg, font-weight 500
Rows:        Hover: gray-50 bg
Cells:       14px, padding 12px 16px
Borders:     Bottom border on rows only (no vertical lines)
Sorting:     Click header to sort, subtle arrow indicator
Selection:   Checkbox left column, blue highlight on selected rows
```

**Modals/Dialogs:**
```
Overlay:     rgba(0,0,0,0.4) + backdrop-blur(4px)
Width:       480px (sm), 640px (md), 800px (lg), 960px (xl)
Radius:      12px
Shadow:      shadow-xl
Animation:   Scale 0.95→1.0 + fade, 200ms
Close:       X button top-right + Escape key
```

**Toasts/Notifications:**
```
Position:    Bottom-right
Width:       360px
Duration:    5s (auto-dismiss), permanent for errors
Types:       Success (green left border), Error (red), Info (blue), Warning (amber)
Animation:   Slide in from right, slide out on dismiss
Stack:       Max 3 visible, newest on top
```

---

## 3. INFORMATION ARCHITECTURE

### 3.1 Navigation Structure

**Top Bar (always visible, 56px height):**
```
[NavTour Logo] [Workspace Name ▾] .............. [Search ⌘K] [Notifications 🔔] [Help ?] [Avatar ▾]
```

**Left Sidebar (260px, collapsible):**
```
MAIN
├── 🏠 Home (dashboard)
├── 📦 Demos
│   ├── All Demos
│   ├── Boards
│   └── Templates
├── 🎯 Demo Hub
└── 🤖 AI Agent

ANALYZE
├── 📊 Analytics
├── 💰 Pipeline Impact
└── 🔬 A/B Tests

LEADS
├── 👤 Visitors
├── 🏢 Accounts
└── 📝 Forms

AUTOMATE
├── ⚡ Playbooks
└── 🔗 Integrations

MANAGE
├── 🎨 Themes
├── 👥 Team
└── ⚙️ Settings
```

**Context: Inside a Demo (switches to demo-level nav):**
```
[← Back to Demos] [Demo Name ✏️] ........ [Build] [Manage] [Analyze] ........ [Preview ▶️] [Share] [Publish]
```

### 3.2 Key Pages

1. **Home Dashboard** — Activity feed, recent demos, quick stats, getting started guide
2. **Demos List** — Card/list view of all demos with search, filters, sort, bulk actions
3. **Demo Builder** — The WYSIWYG capture editor (the core product)
4. **Demo Hub** — Public-facing showcase of demos organized by category
5. **Analytics** — Charts, metrics, visitor tracking, funnel visualization
6. **Pipeline Impact** — CRM-connected revenue attribution
7. **Visitors/Accounts** — Lead management with engagement scoring
8. **Forms Builder** — Drag-and-drop form creation
9. **Playbooks** — Automation rule builder (triggers → actions)
10. **Themes** — Visual theme editor with live preview
11. **Settings** — Workspace, integrations, security, billing

---

## 4. THE DEMO BUILDER (Core Product)

This is the heart of NavTour. It must be **the smoothest, most intuitive demo editor** on the market. Think Figma-level polish for demo building.

### 4.1 Builder Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Demos] [Demo Name]     [Build] [Manage] [Analyze]    [▶ Preview] [Share] [Publish] │
├────────────┬────────────────────────────────────────┬───────────────┤
│            │                                        │               │
│  FLOWS     │                                        │  PROPERTIES   │
│  PANEL     │         CANVAS                         │  PANEL        │
│  (240px)   │         (captures + overlays)           │  (320px)      │
│            │                                        │               │
│  Flow 1    │    ┌──────────────────────────────┐    │  Step Settings │
│    Step 1  │    │                              │    │  Appearance    │
│    Step 2  │    │    Captured HTML/CSS page     │    │  Content       │
│    Step 3  │    │    with tooltip overlay       │    │  Actions       │
│  Flow 2    │    │         positioned            │    │  Triggers      │
│    Step 1  │    │                              │    │  Animations    │
│            │    └──────────────────────────────┘    │               │
│            │                                        │               │
│  [+ Flow]  │  [Select ▾] [+ Element] [Capture ▾]  │               │
├────────────┴────────────────────────────────────────┴───────────────┤
│  Step 1 ● ─── Step 2 ● ─── Step 3 ● ─── Step 4 ●    [+ Step]     │
│  (step filmstrip / timeline at bottom)                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Canvas Behavior

- Captured HTML/CSS renders at actual scale inside a container
- Container is zoomable (scroll wheel or pinch) and pannable (space+drag or two-finger)
- Zoom level indicator in bottom-left (25% → 200%)
- "Fit to screen" button
- Responsive preview toggle: Desktop / Tablet / Mobile viewports
- Grid/snap guides when positioning elements

### 4.3 Flows Panel (Left)

- Drag-and-drop reorder flows
- Rename flows inline (double-click)
- Expand/collapse to see steps
- Each step shows: thumbnail, step number, element type icon
- Right-click context menu: Duplicate, Move, Delete, Add step before/after
- Multi-select with Shift+Click
- "Create with AI" button — AI generates a complete flow from captures

### 4.4 Properties Panel (Right)

When a step or element is selected, shows:

**Step Settings:**
```
Capture:          [Dropdown: Select capture screen]
Appearance:       [Tooltip | Modal | Beacon | Trigger | Button | Checklist]
Position:         [Anchor selector — click element in canvas]
```

**Content (for tooltips/modals):**
```
Title:            [Rich text field with formatting toolbar]
Body:             [Rich text: bold, italic, links, lists, images]
Media:            [Image/video upload or embed]
AI Generate:      [✨ Write with AI — tone selector]
```

**Actions:**
```
Primary Button:   [Label] [Action: Next step | Go to flow | Open URL | Submit form | Run JS]
Secondary Button: [Label] [Action]
Beacon Click:     [Action on click]
Trigger Area:     [Draw region on canvas]
```

**Style:**
```
Theme Override:   [Use step-level theme or flow theme]
Backdrop:         [None | Light | Medium | Heavy | Custom color]
Animation:        [Fade | Slide | Scale | Spring]
Position:         [Auto | Top | Bottom | Left | Right | Center]
Offset X/Y:      [Pixel adjustment]
```

### 4.5 Cover Slide (First Step — Auto-Generated)

**CRITICAL PATTERN (inspired by Supademo):** Every demo should auto-generate a "cover slide" as Step 1. This is NOT a captured screen — it's a branded welcome screen that sets context before the viewer enters the product.

```
┌─ Browser Chrome Frame ─────────────────────────────────────┐
│ ● ● ●              Create Pick Tickets in P4Warehouse      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│       ┌──────────────────────────────────────┐             │
│       │                                      │             │
│       │     [Company Logo]                   │   ┌───────┐│
│       │                                      │   │ Dimmed││
│       │     Demo Title Goes Here             │   │product││
│       │                                      │   │screen ││
│       │     A 1-2 line description of what   │   │preview││
│       │     the viewer will learn in this     │   │       ││
│       │     interactive walkthrough.          │   │       ││
│       │                                      │   └───────┘│
│       │     ⏱ 3 min  |  [■ Get Started]     │             │
│       │                                      │             │
│       └──────────────────────────────────────┘             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**How it works:**

1. **Auto-generated on demo creation** — Pre-filled with demo name as title, AI-generated description from the captured URL/content. Fully editable.

2. **Background options:**
   - Dimmed/blurred product screenshot (default — shows first capture behind text card)
   - Gradient background (from theme brand colors)
   - Solid color
   - Custom image upload
   - None (clean white/dark)

3. **Text card contents:**
   - Company logo (from theme or upload)
   - Title (H2, bold)
   - Description (1-3 lines)
   - Estimated completion time badge ("3 min walkthrough")
   - CTA button ("Get Started" default, customizable text + action)

4. **Browser chrome frame:** Optional macOS-style window frame (traffic light dots + title bar). Toggleable.

5. **AI enhancement:** "Enhance with AI" button rewrites title/description for the selected tone.

6. **Skip option:** "Skip intro" link for return visitors.

### Cover Slide Settings Panel (Properties — Left Panel)

When a cover slide (chapter step) is selected, the left panel shows "Chapter settings" with these controls:

**Chapter Type** (segmented button group — pick one):
| Type | What It Does |
|------|-------------|
| **Default** | Standard cover slide with logo, title, description, CTA button |
| **Form** | Replaces the cover content with a lead capture form (email, name, etc.) |
| **Embed** | Embeds external content (Calendly scheduling, iframe, video, etc.) |
| **Password** | Gates the demo behind a password — viewer must enter password to proceed |

**Layout** (segmented button group):
| Layout | Effect |
|--------|--------|
| **Left** | Text card on the left, product preview on the right |
| **Center** | Text card centered over the dimmed background |
| **Right** | Text card on the right, product preview on the left |

**Theme** (segmented button group):
| Theme | Effect |
|-------|--------|
| **Dark** | Dark background/overlay with light text (best for light product UIs) |
| **Light** | Light background/overlay with dark text (best for dark product UIs) |
| **Custom** | Custom colors — pick your own overlay and text colors |

**Opacity and Blur** (slider, 0-100):
Controls how visible the background product screenshot is. Low values (e.g., 24) = product clearly visible behind the text card. High values = fully blurred/dimmed.

**Logo** (toggle):
| Option | Effect |
|--------|--------|
| **Hide** | No logo on the cover slide |
| **Show** | Displays company logo (uploadable, removable) |

**Cover Image** (segmented button group):
| Source | Effect |
|--------|--------|
| **None** | Plain background — no product preview behind the text |
| **Step** | Uses a screenshot from another demo step as the background (dropdown to pick which step, e.g., "Step 2") |
| **Custom** | Upload your own custom background image |

Note: Cover image is hidden on mobile views.

**Editable Elements on the Canvas:**
- Logo — click to edit/replace, X to remove
- Title (H1) — inline editable rich text
- Description — inline editable rich text
- CTA Button — editable text + style, drag to reorder
- "Add Button" — add additional CTA buttons (dashed placeholder)

**Footer Actions:** Delete chapter, Close, Save

### Closing Slide (Last Step — Also a Chapter)

Same Chapter settings panel applies. Default content:
- Title: "Enjoyed the guided demo?"
- Description: "Learn more about our features and benefits on our website!"
- CTA: "Learn More" (links to website)

NavTour should auto-generate BOTH an opening chapter and a closing chapter.

### NavTour Improvements Over Supademo's Cover Slide:
- AI auto-generates BOTH title and description (Supademo requires manual entry)
- **Chapter type: "Video Intro"** — AI avatar or webcam recording instead of static text (Supademo doesn't have this)
- **Chapter type: "Social Proof"** — Shows G2 rating, customer logos, testimonial quote
- **Animated entrance** — text fades/slides in, preview reveals (Supademo is static)
- **Estimated completion time badge** ("3 min walkthrough" — calculated from step count)
- Multiple layout presets: Left, Center, Right, **Full-bleed, Split-screen** (Supademo only has 3)
- **Gradient overlay** option in addition to solid opacity/blur
- **Custom fonts** on cover slide (match brand typography)
- "Powered by [Customer Brand]" — not "Powered by NavTour" (white-label from day one)
- **Mobile-optimized cover image** — Supademo hides it on mobile; NavTour should show a responsive version

### 4.6 Element Types

| Element | Icon | Description | When to Use |
|---------|------|-------------|-------------|
| **Tooltip** | 💬 | Anchored popup pointing to a UI element | Explain a specific feature or button |
| **Modal** | ⬜ | Centered overlay dialog | Welcome screens, summaries, forms |
| **Beacon** | ● | Pulsing dot on a UI element | Draw attention, "click here" |
| **Trigger** | 👆 | Invisible click zone | Make demo feel like real product |
| **Button** | 🔘 | Floating CTA button | "Try free", "Book demo" |
| **Checklist** | ☑️ | Sidebar progress tracker | Multi-section demos |
| **Hotspot** | 🎯 | Hover-activated popup | Additional context on hover |
| **Video** | ▶️ | Embedded video step | Explain complex flows |
| **Form** | 📋 | Interactive form overlay | Lead capture mid-demo |
| **AI Chat** | 🤖 | Conversational agent popup | Answer questions in real-time |

### 4.6 Capture Editor (No-Code HTML Editing)

When clicking an element in the captured HTML, the properties panel shows:

```
ELEMENT EDITOR
├── Text:       [Edit text content inline — click to edit]
├── Visibility: [Show | Hide | Blur (intensity slider)]
├── Image:      [Replace image — upload or AI generate]
├── Style:      [Background color | Text color | Border | Opacity]
├── Copy:       [Duplicate this element]
├── Delete:     [Remove from capture]
├── Personalize:[Insert variable: {{visitor.name}}, {{visitor.company}}, etc.]
├── Scroll:     [Lock scroll position | Sync with other elements]
├── Tether:     [Lock position relative to parent]
└── AI Edit:    [✨ Describe change in natural language]
```

**Element traversal:** Arrow up/down to navigate parent/child elements in the DOM tree. Breadcrumb shows: `body > main > div.dashboard > table > tr:nth-child(2) > td.name`

### 4.7 Toolbar

```
[Select ▾]  [🔗 Anchor]  [✋ Pan]  [🔍 Zoom]  |  [+ Element ▾]  [✨ AI ▾]  |  [Capture ▾]  [↩ Undo]  [↪ Redo]
```

**Select modes:**
- Select (default) — click elements in canvas
- Anchor — click to set anchor point for tooltip/beacon
- Pan — hand tool for moving canvas
- Zoom — zoom into area

**AI menu:**
- Generate flow from captures
- Write step content
- Review demo quality
- Translate all steps
- Generate voiceover

**Capture menu:**
- Switch capture (select from collection)
- Add new capture (opens extension)
- Recapture (replace current)
- Upload media

### 4.8 Step Timeline (Bottom)

A horizontal filmstrip showing all steps in order:
- Thumbnail of each step's capture
- Step number and type icon
- Current step highlighted with accent border
- Drag to reorder
- Click to navigate
- Right-click: Insert before, Insert after, Duplicate, Delete
- Keyboard: Left/Right arrows to navigate, Delete to remove

---

## 5. THE CHROME EXTENSION (Capture Tool)

### 5.1 Extension Design

The floating capture bar should look like a **premium, minimal control center** — not a cheap browser toolbar.

```
┌──────────────────────────────────────────────────────────┐
│  [NavTour ●3]  Capturing r3pldemo.p4warehouse.com        │
│                                           [⚙] [✕] [▬]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ pg1 │ │ pg2 │ │ pg3 │ │     │ │     │  View X more  │
│  │     │ │     │ │     │ │  +  │ │     │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                          │
│  [📷 Capture]  [🔄 Recapture]  [🏁 Finish]              │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Extension First Screen — The Mode Selector

**CRITICAL UX DECISION:** When the user clicks the NavTour extension icon, the FIRST thing they see is a mode selector. This is the most consequential choice in the entire flow. Present it as clear visual cards, not a dropdown.

```
┌──────────────────────────────────────────────────────┐
│  NavTour Capture                                  ✕  │
│                                                      │
│  What kind of demo are you building?                 │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  🧩  HTML Capture              RECOMMENDED     │  │
│  │  Clone your app as editable HTML/CSS.          │  │
│  │  Edit text, blur data, personalize per viewer. │  │
│  │  Best for: sales demos, marketing pages        │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  📸  Screenshot                                │  │
│  │  Capture flat images of each screen.           │  │
│  │  Fast, reliable, works everywhere.             │  │
│  │  Best for: tutorials, help docs, onboarding    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  🎬  Video Recording                           │  │
│  │  Record your screen with webcam + audio.       │  │
│  │  Best for: walkthroughs, email follow-ups      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  🔗  Sandbox (Interactive Clone)     GROWTH    │  │
│  │  Free-roam environment visitors click through. │  │
│  │  Best for: live sales calls, hands-on trials   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  💡 Not sure? Start with HTML Capture — you can     │
│     always add screenshots or video later.           │
└──────────────────────────────────────────────────────┘
```

**Why this matters:** Screenshot vs HTML is the most consequential choice. Screenshots are flat images (fast, reliable, works everywhere). HTML captures are live DOM clones (editable, personalizable, but slower and can break on complex SPAs). Users who pick the wrong mode waste time and have to start over. Supademo gets this right by asking upfront in the extension. Navattic buries it in a web app dropdown. NavTour shows all options with "Best for:" guidance so users always pick the right mode.

**Design rules for this screen:**
- Show in the extension popup itself, not the web app
- "RECOMMENDED" badge on HTML Capture (guides new users to the most powerful option)
- "Best for:" line on each card (users know their use case, not technical jargon)
- "Not sure?" helper text at bottom (reduces decision paralysis)
- Plan badge on Sandbox (transparent about upgrades)
- All options visible on one screen — no dropdowns, no multi-step wizard
- One decision, one click, start capturing

### 5.3 Capture Sub-Modes (After Mode Selection)

Once a mode is selected, the capture bar offers sub-modes:

**HTML Capture sub-modes:**
| Mode | Icon | Label | Description |
|------|------|-------|-------------|
| **Auto-Navigate** | 🧭 | "Navigate & Capture" | Captures every page automatically as you browse |
| **Click to Capture** | 📷 | "Click to Capture" | You click a button to capture each page manually |
| **Manual Select** | ✋ | "Manual Select" | Choose specific pages from a list |

**Screenshot sub-modes:**
| Mode | Icon | Label | Description |
|------|------|-------|-------------|
| **Click to Screenshot** | 📸 | "Click to Screenshot" | Takes a screenshot each time you click |
| **Full Page** | 📄 | "Full Page Screenshot" | Captures the entire scrollable page |
| **Visible Area** | 🖥️ | "Visible Area" | Captures only what's currently visible |

**Video sub-modes:**
| Mode | Icon | Label | Description |
|------|------|-------|-------------|
| **Screen Only** | 🖥️ | "Screen Recording" | Records the browser tab |
| **Screen + Webcam** | 🎥 | "Screen + Camera" | PIP webcam overlay in corner |
| **Screen + Audio** | 🎙️ | "Screen + Narration" | Records with microphone audio |
| **Full** | 🎬 | "Full Recording" | Screen + webcam + mic |

### 5.3 Capture Settings (In Extension)

```
CAPTURE SETTINGS
├── Mode:           [Auto-Navigate | Click to Capture | Screenshot | Video | Manual]
├── Window Size:    [Desktop FHD | Desktop | Laptop | Tablet | Mobile | Custom WxH]
├── Collection:     [Select or create new]
├── Demo:           [Select existing or create new]
│
├── ADVANCED
│   ├── HTML Patch:           [On/Off — cleanup captured HTML]
│   ├── Download Restrictions:[On/Off — block page downloads during capture]
│   ├── CORS Compatibility:   [On/Off — fix cross-origin issues]
│   ├── Service Workers:      [On/Off — allow SW during capture]
│   └── Popup Compatibility:  [On/Off — fix popup window issues]
│
├── SANDBOX
│   ├── Single Flow Mode:     [On/Off — all captures in one flow]
│   ├── Show Link Anchors:    [On/Off — show detected navigation links]
│   └── Show Overlays:        [On/Off — show sandbox indicators]
│
└── DISPLAY
    ├── Hotkey Hints:         [On/Off]
    └── Info Hints:           [On/Off]
```

---

## 6. KEY SCREENS — Design Specifications

### 6.1 Home Dashboard

**Purpose:** Give users a quick overview and fast access to recent work.

```
┌─────────────────────────────────────────────────────────────┐
│  Good morning, Glenn 👋                                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 12       │  │ 847      │  │ 3.2K     │  │ $45K     │   │
│  │ Demos    │  │ Views    │  │ Engaged  │  │ Pipeline │   │
│  │ this mo  │  │ 7 days   │  │ visitors │  │ sourced  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Recent Demos                                    [View all] │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [thumb] Product Overview  ●Published  847 views  2h  │   │
│  │ [thumb] Sales Follow-up   ○Draft      —          1d  │   │
│  │ [thumb] Onboarding Flow   ●Published  234 views  3d  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Quick Actions                                              │
│  [+ Create Demo]  [📷 Start Capture]  [📤 Upload Media]    │
│                                                             │
│  Getting Started                               [Dismiss]    │
│  ○ Create your first demo                                   │
│  ● Install Chrome extension                                 │
│  ○ Publish and share                                        │
│  ○ Connect integrations                                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Demos List Page

```
┌─────────────────────────────────────────────────────────────┐
│  Demos (47)                         [+ Create Demo]         │
│                                                             │
│  [Search...] [Filters ▾] [Sort: Last edited ▾] [☰ ⊞]     │
│                                                             │
│  Board: All ▾  |  Status: All ▾  |  Labels: All ▾         │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ [thumbnail]│ │ [thumbnail]│ │ [thumbnail]│             │
│  │            │ │            │ │            │             │
│  │ Product    │ │ Sales      │ │ Onboarding │             │
│  │ Overview   │ │ Follow-up  │ │ Flow       │             │
│  │ ●Published │ │ ○Draft     │ │ ●Published │             │
│  │ 847 views  │ │ —          │ │ 234 views  │             │
│  │ 2h ago     │ │ 1d ago     │ │ 3d ago     │             │
│  │ [···]      │ │ [···]      │ │ [···]      │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │   [+ ]     │ │            │ │            │             │
│  │  Create    │ │   ...      │ │   ...      │             │
│  │  new demo  │ │            │ │            │             │
│  └────────────┘ └────────────┘ └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

**Card hover:** Subtle border darken, shadow elevation, play button overlay on thumbnail.
**Context menu (···):** Edit, Duplicate, Move to board, Add label, Share, Analytics, Archive, Delete.
**Bulk actions:** Select multiple → Publish all, Archive, Move, Delete.

### 6.3 Create Demo Modal

```
┌──────────────────────────────────────────────────────┐
│  Create a demo                                    ✕  │
│                                                      │
│  Demo name                                           │
│  ┌──────────────────────────────────────────────┐    │
│  │ Untitled demo                                │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  How do you want to start?                           │
│                                                      │
│  ┌─────────────────────────────────────┐             │
│  │ 🧭  Capture from browser            │ ← selected │
│  │     Navigate your app and capture   │             │
│  │     pages as HTML/CSS               │             │
│  ├─────────────────────────────────────┤             │
│  │ 📤  Upload media                    │             │
│  │     Screenshots, videos, or images  │             │
│  ├─────────────────────────────────────┤             │
│  │ ✨  Generate with AI                │             │
│  │     AI creates a demo from your URL │             │
│  ├─────────────────────────────────────┤             │
│  │ 📥  Import from competitor          │             │
│  │     Storylane, Navattic, or Saleo   │             │
│  └─────────────────────────────────────┘             │
│                                                      │
│  App URL                                             │
│  ┌──────────────────────────────────────────────┐    │
│  │ https://                                     │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ ✨ Use AI Copilot to write content            │    │
│  │    Tone: [Marketing ▾]              [On/Off] │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Board: [Default ▾]                                  │
│                                                      │
│              [Cancel]  [■ Start Capturing]            │
└──────────────────────────────────────────────────────┘
```

### 6.4 Analytics Page

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics                    [Date: Last 30 days ▾] [⬇]  │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 3,247  │ │ 1,891  │ │ 67%    │ │ 2m 34s │ │ 423    │  │
│  │ Views  │ │ Engaged│ │ Compl. │ │ Avg    │ │ CTA    │  │
│  │ ↑12%   │ │ ↑8%    │ │ ↑3%    │ │ Time   │ │ Clicks │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Line chart: Views & Engagement over time]          │   │
│  │ Shows trend with area fill, multiple series         │   │
│  │ Hover shows exact values in tooltip                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Top Demos by Engagement                             │   │
│  │ ┌──────────────────────────────────────────────┐    │   │
│  │ │ Product Overview    ████████████░░  847  67%  │    │   │
│  │ │ Sales Follow-up     ██████████░░░░  623  54%  │    │   │
│  │ │ Onboarding Flow     ████████░░░░░░  421  49%  │    │   │
│  │ └──────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐ ┌──────────────────────────┐     │
│  │ Step Drop-off Funnel │ │ Top Accounts            │     │
│  │ [Funnel visualization│ │ [Table with company     │     │
│  │  showing where users │ │  logos, engagement      │     │
│  │  leave the demo]     │ │  scores, visit count]   │     │
│  └──────────────────────┘ └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 Theme Editor

```
┌─────────────────────────────────────────────────────────────┐
│  [← Themes] Theme: Corporate Dark     [✨ Generate] [Save] │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │ DESIGN TOKENS    │  │                                  ││
│  │                  │  │     LIVE PREVIEW                  ││
│  │ Brand Color      │  │                                  ││
│  │ [■ #6366F1]      │  │  ┌──────────────────────────┐   ││
│  │                  │  │  │ Welcome to ProductName   │   ││
│  │ Text Color       │  │  │                          │   ││
│  │ [■ #0A0A0A]      │  │  │ This shows you how      │   ││
│  │                  │  │  │ the dashboard works.     │   ││
│  │ Background       │  │  │                          │   ││
│  │ [■ #FFFFFF]      │  │  │ [Get Started] [Skip]     │   ││
│  │                  │  │  └──────────────────────────┘   ││
│  │ Font Family      │  │                                  ││
│  │ [Inter ▾]        │  │  Preview: [Tooltip] [Modal]     ││
│  │                  │  │           [Beacon]  [Checklist]  ││
│  │ Border Radius    │  │                                  ││
│  │ [8px ─────○──]   │  │  Backdrop: [None ▾]             ││
│  │                  │  │                                  ││
│  │ Button Style     │  │                                  ││
│  │ [Filled ▾]       │  │                                  ││
│  │                  │  │                                  ││
│  │ Shadow           │  │                                  ││
│  │ [Medium ▾]       │  │                                  ││
│  └──────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. UX PATTERNS & INTERACTIONS

### 7.1 Command Palette (⌘K / Ctrl+K)

A Spotlight/Linear-style command palette that lets you do anything:

```
┌──────────────────────────────────────────────┐
│ 🔍 Type a command or search...               │
├──────────────────────────────────────────────┤
│ Recently Used                                │
│   📦 Product Overview demo                   │
│   📊 Analytics                               │
│                                              │
│ Actions                                      │
│   + Create new demo                          │
│   📷 Start capture session                   │
│   🎨 Open theme editor                       │
│   ⚙️ Settings                                │
│                                              │
│ Navigation                                   │
│   📦 Demos                                   │
│   📊 Analytics                               │
│   👤 Visitors                                │
└──────────────────────────────────────────────┘
```

### 7.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘N | New demo |
| ⌘S | Save (in editor) |
| ⌘Z | Undo |
| ⌘⇧Z | Redo |
| ⌘D | Duplicate selected |
| Delete | Delete selected |
| Space | Pan canvas (hold) |
| ⌘+ / ⌘- | Zoom in/out |
| ⌘0 | Fit to screen |
| ← → | Previous/Next step |
| Tab | Next element |
| Esc | Deselect / Close panel |
| ⌘P | Preview demo |
| ⌘⇧P | Publish demo |

### 7.3 Drag & Drop

- Reorder steps in timeline (horizontal)
- Reorder flows in panel (vertical)
- Reorder form fields
- Move demos between boards
- Upload files by dropping on designated areas
- Visual indicators: Blue insertion line, ghost element follows cursor, snap feedback

### 7.4 Empty States

Every empty state has:
1. An **illustration** (custom, on-brand — not generic stock)
2. A **headline** explaining what belongs here
3. A **description** (1 line) of value
4. A **primary CTA** button
5. An **optional secondary** link (docs, video tutorial)

Example:
```
        [illustration of demo flow]

      You haven't created any demos yet

   Capture your product and turn it into an
   interactive demo in minutes.

        [+ Create Your First Demo]

   or watch a 2-min tutorial →
```

### 7.5 Onboarding

**First-time user flow:**
1. Welcome screen with workspace name input
2. Install Chrome extension prompt (with direct CWS link)
3. Create first demo (guided, with tooltip annotations on the UI itself)
4. Publish and share (show preview + share modal)
5. Confetti animation on first publish 🎉

**Progressive feature discovery:**
- Subtle pulsing dots on features not yet used
- "New" badge on recently released features (auto-dismisses after first view)
- In-app tips triggered by behavior (e.g., "Did you know you can use AI to write your tooltips?")

### 7.6 Loading States

- **Skeleton screens** for all data-heavy pages (cards, tables, charts)
- **Spinner** only for button actions and modal confirmations
- **Progress bar** for multi-step operations (capture, import, export)
- **Optimistic updates** — UI updates immediately, syncs in background
- **Stale-while-revalidate** — Show cached data instantly, refresh in background

### 7.7 Error Handling

- **Inline validation** on forms (validate on blur, show error below field)
- **Toast notifications** for async errors (API failures, save errors)
- **Retry mechanisms** — "Something went wrong. [Retry]" with exponential backoff
- **Graceful degradation** — If AI features fail, fall back to manual with message
- **Never show raw error messages** — Always human-readable

---

## 8. RESPONSIVE & MOBILE

### 8.1 Responsive Breakpoints
```
Mobile:    < 640px    — Single column, bottom nav, simplified UI
Tablet:    640-1024px — Collapsible sidebar, stacked panels
Desktop:   1024-1440px — Full layout with sidebar
Wide:      > 1440px   — Extra space for canvas, wider panels
```

### 8.2 Mobile Experience
- Dashboard and analytics are fully responsive
- Demo viewer is fully mobile-optimized (swipe navigation)
- Demo builder is desktop-only (show message on mobile: "Use desktop for the best building experience")
- Forms and lead capture work on all devices

---

## 9. PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 2.0s |
| Time to Interactive | < 2.5s |
| First Input Delay | < 50ms |
| Cumulative Layout Shift | < 0.05 |
| Demo load time (viewer) | < 1.5s |
| Capture processing | < 10s per page |
| API response time | < 200ms (p95) |
| Search results | < 100ms |
| Real-time updates | < 50ms (WebSocket) |

---

## 10. ACCESSIBILITY (WCAG 2.1 AA)

- All interactive elements are keyboard accessible
- Focus indicators are visible and use the accent color ring
- Color contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for large text
- All images have alt text
- All icons have aria-labels
- Screen reader announcements for dynamic content changes
- Reduced motion mode respects `prefers-reduced-motion`
- Demo viewer supports keyboard-only navigation
- Skip-to-content links
- ARIA landmarks on all major page sections

---

## 11. COMPETITIVE ADVANTAGES TO BUILD IN

### From Navattic (take these):
- HTML/CSS capture with full fidelity (scroll, hover, SVG, charts)
- Capture compare (before/after)
- Recapture workflow
- Pipeline impact dashboard
- Playbook automation templates
- Launchpad sales extension
- Form builder with custom properties
- Navattic JS-style embed widget

### From Supademo (take these):
- Screenshot + video first (not just HTML)
- Desktop app for non-browser capture
- Figma plugin
- Export as PDF/PNG (SOP format)
- Zoom and pan in demos
- Background music (ElevenLabs)
- Closed captions
- Autoplay/loop
- Showcase/multi-demo collections
- AI Demo Agents (conversational)

### From Storylane (take these):
- AI video avatars (presenter videos)
- AI tones (technical, conversational, executive)
- Demo Hub (buyer rooms)
- Deal Intelligence (engagement signals)
- Account reveal (de-anonymize visitors)
- HTML editing with AI prompts

### From Reprise (take these):
- AI data anonymization/PII detection
- Dedicated CDN for demo delivery
- Enterprise-grade access control


### NavTour Exclusives (build these first):
1. Real-time co-browsing (rep joins prospect's demo live)
2. Revenue attribution (actual $/demo, not just "influenced")
3. White-label reseller platform
4. Template marketplace
5. WCAG 2.1 AA accessibility
6. Embeddable web component (no iframe)
7. AI demo performance scoring
8. Multi-product demo journeys
9. QR code sharing
10. Figma two-way sync

---

## 12. QUALITY CHECKLIST — EVERY PAGE MUST HAVE

Before shipping any page, verify:

- [ ] Looks premium (compare against Linear, Stripe, Vercel — not Bootstrap templates)
- [ ] Works in light mode AND dark mode
- [ ] Has proper loading states (skeleton, not spinner)
- [ ] Has a thoughtful empty state (illustration + CTA)
- [ ] Has error states that are helpful, not cryptic
- [ ] Keyboard navigable (Tab, Enter, Escape, Arrow keys)
- [ ] Responsive down to 1024px (or shows desktop-only message)
- [ ] All text is translatable (no hardcoded strings)
- [ ] Animations are smooth and use GPU-accelerated properties
- [ ] No layout shift during loading
- [ ] All interactive elements have hover, focus, active, and disabled states
- [ ] Consistent spacing using 4px grid
- [ ] Page title is set for browser tab
- [ ] Breadcrumb navigation is correct
- [ ] Command palette (⌘K) can reach this page

---

*This specification is the source of truth for building NavTour.cloud. Every design decision, every interaction, every pixel should reference this document. When in doubt, look at Linear, Stripe Dashboard, and Vercel for inspiration — never settle for generic B2B SaaS aesthetics.*
