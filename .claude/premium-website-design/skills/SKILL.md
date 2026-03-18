---
name: premium-website-design
description: Build Stripe/Apple-quality public-facing Blazor websites and pages for P4 Software products. Use when creating landing pages, pricing pages, documentation sites, login/onboarding screens, blog/content pages, or client portal dashboards. Triggers on "website", "landing page", "marketing page", "pricing page", "public site", "login page", "onboarding", "blog", "portal dashboard", or any request for a polished, public-facing web page. Also triggers when output looks generic, Bootstrap-ish, or "like every other AI website". Complements p4-blazor-app-base (internal apps) and syncfusion-blazor-expert (data components). This skill is for public-facing and client-facing pages that must look premium.
---

# Premium Website Design — P4 Software

Build public-facing Blazor pages that match the visual quality of stripe.com and apple.com. Every page must feel intentionally designed, typographically precise, and unmistakably premium.

## Design Philosophy

**Stripe inspiration**: Typography-driven layouts. Generous whitespace. Content does the selling — not decoration. Subtle depth through layered shadows and soft gradients. Every pixel is intentional.

**Apple inspiration**: Hero sections that breathe. One idea per viewport. Photography and typography as equals. Confidence through restraint.

**The rule**: If you can remove an element and the page still works, remove it.

---

## P4 Brand System (Embedded)

### Colors

```css
:root {
    /* Brand */
    --p4-blue: #0A5FAD;
    --p4-blue-dark: #084A8A;
    --p4-blue-deeper: #063668;
    --p4-blue-light: #E8F1FA;
    --p4-blue-subtle: #F4F8FC;
    --p4-orange: #FBAD48;
    --p4-orange-dark: #E89A2E;
    --p4-orange-light: #FFF4E5;
    --p4-grey: #939598;

    /* Neutrals — derived from blue hue, NOT pure gray */
    --neutral-950: #0B1929;
    --neutral-800: #1E3A5F;
    --neutral-700: #2D4A6F;
    --neutral-600: #475B73;
    --neutral-500: #64748B;
    --neutral-400: #94A3B8;
    --neutral-300: #CBD5E1;
    --neutral-200: #E2E8F0;
    --neutral-100: #F1F5F9;
    --neutral-50: #F8FAFC;

    /* Semantic */
    --success: #2E7D32;
    --warning: #F9A825;
    --error: #C62828;

    /* Surfaces */
    --surface-primary: #FFFFFF;
    --surface-secondary: var(--neutral-50);
    --surface-tertiary: var(--p4-blue-subtle);
    --surface-elevated: #FFFFFF;

    /* Text */
    --text-primary: var(--neutral-950);
    --text-secondary: var(--neutral-600);
    --text-tertiary: var(--neutral-500);
    --text-inverse: #FFFFFF;
    --text-link: var(--p4-blue);
    --text-link-hover: var(--p4-blue-dark);
}
```

### Color Usage Rules

- **P4 Blue** (`#0A5FAD`): Primary buttons, active nav, links, section accents
- **P4 Orange** (`#FBAD48`): CTAs that need to pop, pricing "recommended" badges, notification dots — use SPARINGLY (max 2 elements per viewport)
- **Neutrals**: All text, borders, backgrounds — always use the blue-hued neutrals above, NEVER raw `#gray` values
- **White + neutral-50**: Alternate section backgrounds to create rhythm
- Maximum **3 colors visible** in any viewport at any time (blue + orange + neutral)

### Typography

```css
:root {
    /* Font stack — Segoe UI is the P4 standard */
    --font-display: 'Segoe UI', system-ui, -apple-system, sans-serif;
    --font-body: 'Segoe UI', system-ui, -apple-system, sans-serif;
    --font-mono: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;

    /* Type scale — based on 1.25 ratio */
    --text-xs: 0.75rem;     /* 12px — captions, labels */
    --text-sm: 0.875rem;    /* 14px — secondary text */
    --text-base: 1rem;      /* 16px — body */
    --text-lg: 1.125rem;    /* 18px — lead paragraphs */
    --text-xl: 1.25rem;     /* 20px — card titles */
    --text-2xl: 1.5rem;     /* 24px — section subtitles */
    --text-3xl: 2rem;       /* 32px — section headings */
    --text-4xl: 2.5rem;     /* 40px — page titles */
    --text-5xl: 3rem;       /* 48px — hero headlines */
    --text-6xl: 3.75rem;    /* 60px — hero display (desktop only) */

    /* Line heights */
    --leading-tight: 1.1;   /* headings */
    --leading-snug: 1.3;    /* subheadings */
    --leading-normal: 1.6;  /* body text */
    --leading-relaxed: 1.8; /* long-form reading */

    /* Font weights */
    --weight-regular: 400;
    --weight-medium: 500;
    --weight-semibold: 600;
    --weight-bold: 700;
}
```

### Typography Rules

- **Headings**: Semibold or Bold, `--leading-tight`, color `--neutral-950`
- **Body text**: Regular weight, `--leading-normal`, color `--neutral-600`
- **Max 2 font weights per page** — typically Semibold + Regular
- **Max line width**: 680px for body text. NEVER let paragraphs stretch full-width
- H1 on marketing pages: `--text-5xl` on desktop, `--text-4xl` on mobile
- Subheadings directly under H1: `--text-lg` or `--text-xl`, color `--neutral-500`, Regular weight
- **NEVER** center text blocks wider than 600px

### Logo

- Full color: `svg/p4-logo-full-color.svg` or `png/p4-logo-full-color.png`
- Icon only: `png/p4-logo-icon-only.png` (favicons, small spaces)
- Login: `svg/p4-login-logo.svg`
- App header: `svg/p4-logo-inside.svg`
- Min size: 150px digital
- Clear space: half logo height on all sides
- NEVER rotate, distort, recolor, or add effects to the logo

---

## Layout System

### Spacing Scale (4px base grid)

```css
:root {
    --space-1: 0.25rem;   /* 4px */
    --space-2: 0.5rem;    /* 8px */
    --space-3: 0.75rem;   /* 12px */
    --space-4: 1rem;      /* 16px */
    --space-5: 1.25rem;   /* 20px */
    --space-6: 1.5rem;    /* 24px */
    --space-8: 2rem;      /* 32px */
    --space-10: 2.5rem;   /* 40px */
    --space-12: 3rem;     /* 48px */
    --space-16: 4rem;     /* 64px */
    --space-20: 5rem;     /* 80px */
    --space-24: 6rem;     /* 96px */
    --space-32: 8rem;     /* 128px */
    --space-40: 10rem;    /* 160px */
}
```

### Layout Rules

- **Max content width**: 1120px, centered with `margin: 0 auto`
- **Section vertical padding**: `--space-32` (128px) desktop, `--space-20` (80px) mobile
- **Horizontal page padding**: `--space-6` (24px) minimum on mobile
- **Section backgrounds**: Alternate between `--surface-primary` and `--surface-secondary` to create visual rhythm — NEVER stack 3+ same-background sections
- **Grid**: CSS Grid or Flexbox. 12-column conceptual grid. Common splits: 50/50, 60/40, 1/3+1/3+1/3
- **Hero sections**: min-height 80vh or 600px, whichever is larger
- **Content sections**: Always have a clear single focal point per viewport

### Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* sm — tablets */ }
@media (min-width: 1024px) { /* lg — desktop */ }
@media (min-width: 1280px) { /* xl — wide desktop */ }
```

---

## Elevation & Depth

### Shadow Ramp

```css
:root {
    --shadow-xs: 0 1px 2px rgba(11, 25, 41, 0.05);
    --shadow-sm: 0 1px 3px rgba(11, 25, 41, 0.08), 0 1px 2px rgba(11, 25, 41, 0.04);
    --shadow-md: 0 4px 6px rgba(11, 25, 41, 0.06), 0 2px 4px rgba(11, 25, 41, 0.04);
    --shadow-lg: 0 10px 24px rgba(11, 25, 41, 0.08), 0 4px 8px rgba(11, 25, 41, 0.04);
    --shadow-xl: 0 20px 48px rgba(11, 25, 41, 0.10), 0 8px 16px rgba(11, 25, 41, 0.04);
    --shadow-glow: 0 0 0 1px rgba(10, 95, 173, 0.08), 0 4px 16px rgba(10, 95, 173, 0.12);
}
```

### Shadow Rules

- **Cards at rest**: `--shadow-sm`. On hover: transition to `--shadow-lg`
- **Elevated surfaces** (sticky nav, modals): `--shadow-lg` or `--shadow-xl`
- **NEVER** use shadows darker than `rgba(0,0,0,0.15)` — it looks cheap
- **Stripe-style glow**: Use `--shadow-glow` on primary cards or CTAs for a subtle blue glow effect
- Corner radius: 8px for cards, 6px for buttons, 4px for inputs, 12px for modals/panels — NEVER exceed 12px on any element

---

## Animation & Motion

### Principles

- Every animation serves a PURPOSE: guiding attention, confirming interaction, or creating spatial orientation
- Maximum ONE animation effect per viewport scroll
- All durations under 400ms for interactions, under 800ms for reveals
- Always respect `prefers-reduced-motion`

### Scroll Reveal System

```css
/* Base reveal class — apply to sections and cards */
.reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 600ms cubic-bezier(0.1, 0.9, 0.2, 1),
                transform 600ms cubic-bezier(0.1, 0.9, 0.2, 1);
}

.reveal.visible {
    opacity: 1;
    transform: translateY(0);
}

/* Staggered children — for card grids, feature lists */
.reveal-stagger > * {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 400ms cubic-bezier(0.1, 0.9, 0.2, 1),
                transform 400ms cubic-bezier(0.1, 0.9, 0.2, 1);
}

.reveal-stagger.visible > *:nth-child(1) { transition-delay: 0ms; }
.reveal-stagger.visible > *:nth-child(2) { transition-delay: 80ms; }
.reveal-stagger.visible > *:nth-child(3) { transition-delay: 160ms; }
.reveal-stagger.visible > *:nth-child(4) { transition-delay: 240ms; }

.reveal-stagger.visible > * {
    opacity: 1;
    transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
    .reveal, .reveal-stagger > * {
        opacity: 1;
        transform: none;
        transition: none;
    }
}
```

### Intersection Observer (Blazor)

```csharp
// Use JSInterop to trigger reveal animations
@inject IJSRuntime JS

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        await JS.InvokeVoidAsync("initScrollReveal");
    }
}
```

```javascript
// wwwroot/js/scroll-reveal.js
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
        observer.observe(el);
    });
}
```

### Hover & Micro-Interactions

```css
/* Button press — subtle scale down */
.btn-primary {
    transition: background-color 150ms ease, transform 100ms ease, box-shadow 200ms ease;
}
.btn-primary:hover {
    background-color: var(--p4-blue-dark);
    box-shadow: var(--shadow-md);
}
.btn-primary:active {
    transform: scale(0.98);
}

/* Card hover lift */
.card-interactive {
    transition: transform 250ms cubic-bezier(0.1, 0.9, 0.2, 1),
                box-shadow 250ms cubic-bezier(0.1, 0.9, 0.2, 1);
}
.card-interactive:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

/* Link underline reveal */
.link-reveal {
    text-decoration: none;
    background-image: linear-gradient(var(--p4-blue), var(--p4-blue));
    background-size: 0% 2px;
    background-position: left bottom;
    background-repeat: no-repeat;
    transition: background-size 300ms ease;
    padding-bottom: 2px;
}
.link-reveal:hover {
    background-size: 100% 2px;
}

/* Focus ring — high visibility */
:focus-visible {
    outline: 2px solid var(--p4-blue);
    outline-offset: 2px;
}
```

### Easing Reference

```css
:root {
    --ease-out-expo: cubic-bezier(0.1, 0.9, 0.2, 1);    /* enter/reveal */
    --ease-in-expo: cubic-bezier(0.7, 0, 1, 0.5);        /* exit/dismiss */
    --ease-standard: cubic-bezier(0.33, 0, 0.67, 1);     /* repositioning */
}
```

---

## Page Templates

### 1. Landing Page / Product Marketing

```
┌─────────────────────────────────────────┐
│  Nav: Logo (left) · Links · CTA button  │  sticky, bg blur, shadow-sm on scroll
├─────────────────────────────────────────┤
│                                         │
│  HERO — 80vh min                        │
│  Headline (text-5xl, max 12 words)      │
│  Subhead (text-xl, neutral-500, 2 lines)│
│  [Primary CTA]  [Secondary ghost btn]   │
│                                         │
│  Optional: product screenshot/mockup    │
│  with subtle shadow-xl and perspective  │
│                                         │
├─────────────────────────────────────────┤
│  SOCIAL PROOF BAR — bg: neutral-50      │
│  "Trusted by" + client logos (grayscale)│
│  opacity 0.5, 40px height max           │
├─────────────────────────────────────────┤
│  FEATURES — 3-col grid                  │
│  Icon (24px, p4-blue) + title + desc    │
│  NO colored circles behind icons        │
├─────────────────────────────────────────┤
│  DEEP FEATURE — alternating layout      │
│  Left: text stack  |  Right: visual     │
│  (swap sides each section)              │
├─────────────────────────────────────────┤
│  TESTIMONIAL — single quote, big text   │
│  text-2xl italic, person + role below   │
│  NO carousels. Pick the best one.       │
├─────────────────────────────────────────┤
│  CTA SECTION — bg: p4-blue-light        │
│  Headline + subtext + button            │
├─────────────────────────────────────────┤
│  FOOTER — 4 columns + bottom bar        │
│  Logo, nav groups, contact, legal       │
└─────────────────────────────────────────┘
```

### 2. Pricing Page

```
┌─────────────────────────────────────────┐
│  Headline: "Simple, transparent pricing"│
│  Subhead explains the model             │
│  [Monthly] [Annual — Save 20%] toggle   │
├─────────────────────────────────────────┤
│  PRICING CARDS — 3 columns max          │
│  ┌──────┐  ┌──────────┐  ┌──────┐      │
│  │ Tier │  │RECOMMENDED│  │ Tier │      │
│  │      │  │ (orange   │  │      │      │
│  │      │  │  badge)   │  │      │      │
│  └──────┘  └──────────┘  └──────┘      │
│  Recommended card: 4px top border orange│
│  Others: border 1px neutral-200         │
├─────────────────────────────────────────┤
│  COMPARISON TABLE — full feature matrix │
│  Sticky header row, zebra striping      │
│  Checkmarks in p4-blue, dashes for no   │
├─────────────────────────────────────────┤
│  FAQ — accordion style, no borders      │
│  Clean expand/collapse with + / − icon  │
└─────────────────────────────────────────┘
```

### 3. Documentation / Help Site

```
┌───────────┬─────────────────────────────┐
│  Sidebar  │  Content area               │
│  240px    │  max-width 760px            │
│           │                             │
│  Grouped  │  Breadcrumb                 │
│  nav with │  Title (text-3xl)           │
│  sections │  Body (text-base, leading-  │
│           │    relaxed)                 │
│  Search   │  Code blocks (mono font,   │
│  at top   │    neutral-50 bg, shadow-xs)│
│           │  Tables, images, callouts   │
│           │                             │
│           │  ← Previous  |  Next →      │
└───────────┴─────────────────────────────┘
```

### 4. Login / Onboarding

```
┌─────────────────────────────────────────┐
│  Centered card, max-width 420px         │
│  bg: white, shadow-xl, radius 12px     │
│                                         │
│  Logo (p4-login-logo.svg, centered)     │
│  "Welcome back" or "Get started"        │
│                                         │
│  [Email input]                          │
│  [Password input]                       │
│  [Forgot password? link]                │
│                                         │
│  [Sign in — full width primary btn]     │
│                                         │
│  Divider: "or"                          │
│  [SSO / Microsoft / Google buttons]     │
│                                         │
│  Footer: "Don't have an account? →"     │
│                                         │
│  Background: subtle gradient or         │
│  p4-blue-subtle with soft pattern       │
└─────────────────────────────────────────┘
```

### 5. Blog / Content Page

```
┌─────────────────────────────────────────┐
│  Nav (same as marketing pages)          │
├─────────────────────────────────────────┤
│  Article header — centered, 720px max   │
│  Category label (text-sm, p4-blue)      │
│  Title (text-4xl)                       │
│  Meta: author · date · read time        │
├─────────────────────────────────────────┤
│  Featured image — full bleed or 900px   │
│  border-radius 8px, shadow-md           │
├─────────────────────────────────────────┤
│  Article body — 680px max, centered     │
│  text-lg, leading-relaxed               │
│  Rich typography: pull quotes, code     │
│  blocks, callout boxes, images          │
├─────────────────────────────────────────┤
│  Author bio card                        │
│  Related articles — 3-col grid          │
└─────────────────────────────────────────┘
```

### 6. Client Portal Dashboard

```
┌────────────┬────────────────────────────┐
│  Sidebar   │  Top bar: breadcrumb +     │
│  56px      │  user avatar + lang toggle │
│  collapsed │                            │
│            ├────────────────────────────┤
│  Logo icon │  Page title + subtitle     │
│  Nav icons │                            │
│  with      │  KPI cards row (4 cards)   │
│  tooltips  │  ┌────┐┌────┐┌────┐┌────┐ │
│            │  │ ## ││ ## ││ ## ││ ## │ │
│  Expand    │  └────┘└────┘└────┘└────┘ │
│  on hover  │                            │
│            │  Main content: grid/table  │
│            │  or chart + detail panel   │
│            │                            │
│            │  Use Syncfusion components │
│            │  with fluent2.css theme    │
└────────────┴────────────────────────────┘
```

---

## Bilingual Support (EN/ES)

### Implementation Pattern

```csharp
// Use resource files or a simple dictionary service
@inject IStringLocalizer<SharedResources> L

<h1>@L["hero_headline"]</h1>
<p>@L["hero_subhead"]</p>
```

### Content Rules

- Primary language follows user's browser locale or explicit toggle
- Language toggle in nav: "EN | ES" — simple text toggle, not a dropdown
- ALL user-facing text must have both EN and ES translations
- Marketing copy should be ADAPTED, not literally translated — Spanish marketing tone differs from English
- Keep URL slugs in English for SEO; use `lang` attribute on `<html>` tag
- Date/number formatting: respect locale (`CultureInfo`)

---

## Navigation Component

### Sticky Nav Pattern

```css
.nav-sticky {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid transparent;
    transition: border-color 200ms ease, box-shadow 200ms ease;
}

.nav-sticky.scrolled {
    border-bottom-color: var(--neutral-200);
    box-shadow: var(--shadow-sm);
}
```

### Nav Structure

- Logo: left-aligned, links to home
- Nav links: centered or right-aligned, `--text-sm`, `--weight-medium`
- CTA button: right-most, primary style
- Mobile: hamburger menu, full-screen overlay with staggered link animation
- Language toggle: compact "EN | ES" near CTA

---

## Button System

```css
/* Primary — solid P4 Blue */
.btn-primary {
    background: var(--p4-blue);
    color: white;
    font-weight: var(--weight-semibold);
    font-size: var(--text-sm);
    padding: 10px 24px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: background 150ms, transform 100ms, box-shadow 200ms;
}
.btn-primary:hover { background: var(--p4-blue-dark); box-shadow: var(--shadow-md); }
.btn-primary:active { transform: scale(0.98); }

/* Secondary — ghost with border */
.btn-secondary {
    background: transparent;
    color: var(--p4-blue);
    font-weight: var(--weight-semibold);
    font-size: var(--text-sm);
    padding: 10px 24px;
    border-radius: 6px;
    border: 1px solid var(--neutral-300);
    cursor: pointer;
    transition: background 150ms, border-color 150ms;
}
.btn-secondary:hover { background: var(--neutral-50); border-color: var(--neutral-400); }

/* CTA — Orange accent (use sparingly) */
.btn-cta {
    background: var(--p4-orange);
    color: var(--neutral-950);
    font-weight: var(--weight-semibold);
    font-size: var(--text-sm);
    padding: 10px 24px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: background 150ms, transform 100ms;
}
.btn-cta:hover { background: var(--p4-orange-dark); }
.btn-cta:active { transform: scale(0.98); }

/* Size variants */
.btn-lg { padding: 14px 32px; font-size: var(--text-base); }
.btn-sm { padding: 6px 16px; font-size: var(--text-xs); }
```

---

## Component Patterns

### Cards

```css
.card {
    background: var(--surface-elevated);
    border: 1px solid var(--neutral-200);
    border-radius: 8px;
    padding: var(--space-8);
    box-shadow: var(--shadow-sm);
}

/* Stripe-style glowing card for featured content */
.card-featured {
    background: var(--surface-elevated);
    border: 1px solid rgba(10, 95, 173, 0.15);
    border-radius: 8px;
    padding: var(--space-8);
    box-shadow: var(--shadow-glow);
}
```

### Form Inputs

```css
.input {
    width: 100%;
    padding: 10px 14px;
    font-size: var(--text-base);
    font-family: var(--font-body);
    color: var(--text-primary);
    background: var(--surface-primary);
    border: 1px solid var(--neutral-300);
    border-radius: 4px;
    transition: border-color 150ms, box-shadow 150ms;
}
.input:hover { border-color: var(--neutral-400); }
.input:focus {
    border-color: var(--p4-blue);
    box-shadow: 0 0 0 3px rgba(10, 95, 173, 0.12);
    outline: none;
}
.input::placeholder { color: var(--neutral-400); }
```

### Code Blocks (for docs/blog)

```css
.code-block {
    background: var(--neutral-50);
    border: 1px solid var(--neutral-200);
    border-radius: 6px;
    padding: var(--space-4) var(--space-5);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.7;
    overflow-x: auto;
    box-shadow: var(--shadow-xs);
}
```

### Callout / Alert Box

```css
.callout {
    border-left: 3px solid var(--p4-blue);
    background: var(--p4-blue-subtle);
    padding: var(--space-4) var(--space-5);
    border-radius: 0 6px 6px 0;
    font-size: var(--text-sm);
    color: var(--neutral-700);
}
```

---

## Anti-Patterns — NEVER Do These

### Layout
- ❌ Hero section with left-text / right-stock-illustration split
- ❌ Three-column icon grids with colored circles behind each icon
- ❌ Centered text blocks wider than 600px
- ❌ More than 3 same-background sections stacked
- ❌ Testimonial carousels or auto-rotating sliders
- ❌ Padding less than 16px on any clickable element
- ❌ Sections with less than 80px vertical padding

### Visual
- ❌ Gradient buttons
- ❌ Box shadows darker than rgba(0,0,0,0.15)
- ❌ Border radius greater than 12px on any element
- ❌ More than 4 colors visible in any viewport
- ❌ Pure gray (#808080, #ccc, etc.) — always use blue-hued neutrals
- ❌ Stock photography as hero backgrounds
- ❌ Decorative SVG blobs or abstract shapes

### Typography
- ❌ More than 2 font weights on a page
- ❌ Body text smaller than 16px on desktop
- ❌ ALL CAPS for anything longer than 3 words
- ❌ Paragraph line lengths exceeding 75 characters
- ❌ Comic Sans, Papyrus, decorative fonts
- ❌ Using Inter, Roboto, or Arial as display/heading fonts

### Interaction
- ❌ More than one animation per viewport on scroll
- ❌ Animation durations over 400ms for interactions
- ❌ Animations without prefers-reduced-motion fallback
- ❌ Generic button text: "Learn More", "Click Here", "Get Started" without context

### Code
- ❌ Bootstrap CSS framework
- ❌ jQuery or legacy JS libraries
- ❌ Inline styles (use CSS variables)
- ❌ !important overrides (fix specificity instead)

---

## Quality Checklist — Apply Before Delivering

Before any page is considered done, verify:

- [ ] **The Stripe Test**: Can I remove any element and the page still works? If not, it's overdesigned
- [ ] **Visual hierarchy**: One element clearly dominates each section
- [ ] **Color count**: Fewer than 4 colors in any viewport
- [ ] **Typography**: Max 2 font weights. Body text ≥ 16px. Lines ≤ 75 chars wide
- [ ] **Spacing**: All spacing aligns to 4px grid. Section padding ≥ 80px
- [ ] **Shadows**: None darker than rgba(0,0,0,0.15)
- [ ] **Radius**: Nothing exceeds 12px
- [ ] **Animation**: Every animation has prefers-reduced-motion fallback
- [ ] **Mobile**: Tested at 375px width. Touch targets ≥ 44px
- [ ] **Bilingual**: All user-facing strings in both EN and ES
- [ ] **Accessibility**: Focus-visible on all interactive elements. 4.5:1 contrast ratio
- [ ] **Performance**: No render-blocking JS. Images lazy-loaded. CSS variables for theming
- [ ] **Logo**: Correct logo variant used. Clear space maintained. Not distorted
- [ ] **Would I be embarrassed to show this to a designer?** If yes, simplify
