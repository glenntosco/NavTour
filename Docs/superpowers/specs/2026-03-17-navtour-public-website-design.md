# NavTour Public-Facing Website — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Approach:** Blazor SSR pages with custom CSS in the existing NavTour.Server project

---

## 1. Overview

NavTour needs a public-facing marketing website to start acquiring users. The site will live within the existing Blazor project as SSR pages, sharing the same deployment. Visitors get fast server-rendered HTML without downloading the WASM bundle.

### Goals
- Communicate NavTour's value proposition clearly to B2B SaaS buyers
- Drive free signups and demo requests
- Position NavTour as the affordable, developer-friendly alternative to Navattic/Walnut/Storylane
- Provide SEO-friendly, fast-loading pages

### Competitive Context

| Competitor | Entry Price | Free Tier | Design Style |
|---|---|---|---|
| Navattic | ~$500/mo (Base) | Yes, 1 demo | Clean, minimal, blue accents |
| Storylane | $40/mo (Starter) | Yes, 1 demo | Playful, magenta/pink/yellow |
| Walnut | $750/mo | No | Purple/pink, motion-heavy |
| Demoboost | Undisclosed | No | Deep purple, enterprise-focused |
| Reprise | Enterprise-only | No | Professional blue/teal |
| **NavTour** | **$99/mo (Pro)** | **Yes, 1 demo** | **Blue (#4361ee), clean, professional** |

**NavTour's positioning:** 5x cheaper than Navattic Base, full API access, true multi-tenancy, native multi-language. Blue brand stands out against the purple/pink competitor landscape.

---

## 2. Site Architecture & Routing

### New Public Pages (SSR, AllowAnonymous)

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing | Hero, value prop, social proof, CTAs |
| `/features` | Features | Feature showcase with screenshots |
| `/use-cases` | Use Cases | By persona: Sales, Marketing, CS |
| `/pricing` | Pricing | 4 tiers: Starter (Free), Pro, Business, Enterprise |
| `/about` | About | Company story, mission, trust signals |
| `/blog` | Blog | Placeholder — "Coming Soon" |
| `/docs` | Docs | Placeholder — "Coming Soon" |
| `/contact` | Contact | Contact form / email CTA |

### Layout Switching

- **MarketingLayout.razor** — new layout for all public pages. Marketing header (logo, nav links, Login + "Start Free" CTAs) and marketing footer (nav links, legal, social placeholders).
- **MainLayout.razor** — unchanged, continues serving the authenticated app (`/dashboard`, `/demos/{id}/edit`, etc.).
- Each public page declares `@layout MarketingLayout`.
- If the user is authenticated, the header "Login" link becomes "Dashboard".

### Existing App Pages (Unchanged)

All existing authenticated pages (`/dashboard`, `/demos/{id}/edit`, `/demos/{id}/settings`, `/demos/{id}/analytics`, `/leads`, `/login`, `/register`) remain on `MainLayout` behind auth.

---

## 3. Landing Page Structure

### Section Flow

1. **Hero**
   - Bold headline: benefit-driven (e.g., "Interactive demos that close deals faster")
   - Subheadline: one sentence explaining what NavTour does
   - Two CTAs: "Start Free" (primary button) + "Book a Demo" (outline button)
   - Hero visual: product screenshot or animated demo preview placeholder

2. **Social Proof Bar**
   - Logo strip of customers/partners (Grupo Barrdega ecosystem initially)
   - Fallback: metric bar — "Built on infrastructure serving 5,000+ clients"

3. **Problem → Solution**
   - Three pain points: expensive demos, technical dependency, no analytics
   - How NavTour solves each — short copy with icons

4. **Feature Highlights**
   - 3-4 card grid: Capture, Annotate, Personalize, Analyze
   - Each card: icon, title, one-liner, subtle screenshot placeholder

5. **How It Works**
   - 3-step visual: Capture → Customize → Share
   - Numbered steps with illustrations

6. **Use Case Previews**
   - Three persona cards (Sales, Marketing, CS) linking to `/use-cases`
   - Each with headline and one-sentence value prop

7. **Testimonial / Metrics**
   - Quote carousel if testimonials exist
   - Fallback: platform metrics — "Powered by P4 Software's proven multi-tenant infrastructure"

8. **Pricing Preview**
   - Compact tier comparison (Free → Enterprise)
   - Competitive callout: "5x cheaper than the industry standard" (tiers: Starter/Pro/Business/Enterprise)
   - "See full pricing" link to `/pricing`

9. **Final CTA**
   - "Ready to transform your demos?" + "Start Free" button
   - "No credit card required"

10. **Footer**
    - Nav links: Features, Use Cases, Pricing, About, Blog, Docs, Contact
    - Legal: Privacy, Terms
    - Social links placeholder
    - "© 2026 P4 Software | Grupo Barrdega"

---

## 4. Features Page

Full-width sections alternating left/right layout (text + screenshot placeholder).

### Feature Sections

1. **Chrome Extension Capture** — "Capture your product in clicks, not code." One-click DOM capture, HTML/CSS snapshots, works on any web app.

2. **Visual Demo Builder** — "Build interactive walkthroughs with drag-and-drop." Frame editor, inline HTML/CSS editing, frame strip for reordering.

3. **Annotations & Overlays** — "Guide prospects step-by-step." Tooltips, modals, hotspots, blur overlays. Click-to-place, drag-to-reposition.

4. **Personalization** — "Tailor every demo to every prospect." `{{company}}`, `{{name}}` tokens resolved via URL params. Dynamic content without duplicating demos.

5. **Lead Capture** — "Turn viewers into pipeline." Configurable lead gate forms, CRM-ready data collection.

6. **Analytics Dashboard** — "See exactly how prospects engage." Session tracking, step completion rates, drop-off analysis, engagement metrics.

7. **API-First Architecture** — "Automate everything." Full REST API, webhook-ready, integrate with your existing stack.

8. **Multi-Language Support** — "Demos in every language your buyers speak." English/Spanish native, extensible framework.

Each section: headline, 2-3 sentence description, screenshot/illustration placeholder. Final CTA at bottom.

---

## 5. Use Cases Page

Three persona sections, each as a full-width card with anchor links.

### For Sales Teams
- **Pain:** Prospects go cold waiting for live demos
- **Solution:** Share interactive demos instantly after discovery calls
- **Key features:** Personalization, lead capture, analytics
- **CTA:** Links to signup

### For Marketing Teams
- **Pain:** Website visitors leave without experiencing the product
- **Solution:** Embed interactive demos on landing pages and in campaigns
- **Key features:** Chrome capture, embeddable player, engagement tracking
- **CTA:** Links to signup

### For Customer Success
- **Pain:** Onboarding takes too long, support tickets pile up
- **Solution:** Self-serve product tours for onboarding and feature adoption
- **Key features:** Step-by-step walkthroughs, annotations, analytics
- **CTA:** Links to signup

---

## 6. Pricing Page

### Tier Comparison (4-column)

| | Starter | Pro | Business | Enterprise |
|---|---|---|---|---|
| **Price** | Free | $99/mo | $299/mo | Custom |
| **Seats** | 1 | 5 | 15 | Unlimited |
| **Demos** | 1 | 25 | Unlimited | Unlimited |
| **Views** | 100/mo | 10K/mo | 50K/mo | Unlimited |

### Feature Checklist Rows
- Analytics: -, check, check, check
- API Access: -, check, check, check
- Custom Branding: -, -, check, check
- SSO: -, -, check, check
- Self-Host: -, -, -, check
- SLA: -, -, -, check

### Competitive Callout
"5x cheaper than Navattic. More features than Storylane." or similar positioning line at the top.

### FAQ Section
Billing questions, plan changes, what counts as a "view", etc.

---

## 7. About & Contact Pages

### About
- Company story: P4 Software / Grupo Barrdega
- Mission statement
- Trust signal: "serving 5,000+ clients"
- Team section placeholder

### Contact
- Email address
- Optional contact form (reuse lead capture pattern)
- "Book a Demo" link (Calendly or similar placeholder)

### Blog & Docs (Placeholders)
- "Coming Soon — subscribe for updates"
- Email input for newsletter signup

---

## 8. Styling Approach

### Brand Colors
- **Primary:** `#4361ee` (NavTour blue)
- **Primary dark:** `#2d3db8` (hover states, headers)
- **Primary light:** `#e8ebfd` (backgrounds, card tints)
- **Text:** `#1a1a2e` (near-black)
- **Secondary text:** `#64748b` (muted descriptions)
- **White backgrounds** with subtle blue tints for alternating sections
- **Success green:** `#10b981` (checkmarks, positive indicators)

### Typography
System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Clean, fast-loading, no external font dependency.

### CSS Architecture
- **Scoped CSS:** `.razor.css` files per page/component for isolation
- **Shared marketing CSS:** `marketing.css` for common elements (header, footer, buttons, section spacing, grid utilities)
- **Complete separation** from Radzen's `rz-*` styles — no conflicts
- **CSS custom properties** for theme values (colors, spacing, border-radius)

### Responsive Design
- Mobile-first approach
- Hero stacks vertically on mobile
- Feature grids collapse to single column
- Pricing cards scroll horizontally on mobile
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

---

## 9. File Structure

```
src/NavTour.Server/
├── Pages/
│   └── Marketing/
│       ├── Index.razor              # Landing page (route: /)
│       ├── Features.razor           # Features page
│       ├── UseCases.razor           # Use cases page
│       ├── Pricing.razor            # Pricing page
│       ├── About.razor              # About page
│       ├── Blog.razor               # Blog placeholder
│       ├── Docs.razor               # Docs placeholder
│       └── Contact.razor            # Contact page
├── Layout/
│   └── MarketingLayout.razor        # Public site layout
│   └── MarketingLayout.razor.css    # Layout scoped styles
├── Components/
│   └── Marketing/
│       ├── MarketingHeader.razor    # Header with nav + CTAs
│       ├── MarketingFooter.razor    # Footer with links
│       ├── HeroSection.razor        # Reusable hero component
│       ├── FeatureCard.razor        # Feature card component
│       ├── PricingCard.razor        # Pricing tier card
│       ├── TestimonialCard.razor    # Testimonial component
│       └── CtaSection.razor         # Reusable CTA block
└── wwwroot/
    └── css/
        └── marketing.css            # Shared marketing styles
```

---

## 10. Technical Considerations

### SSR-Only Render Mode for Marketing Pages
- All marketing pages must render as **static SSR** — no SignalR circuit, no WASM download
- Currently `App.razor` applies `@rendermode="InteractiveServer"` globally. Marketing pages must opt out:
  - In `App.razor`, conditionally apply render mode: marketing routes get `null` (static SSR), app routes get `InteractiveServer`
  - Alternatively, use per-page `@rendermode` override: marketing pages explicitly declare no render mode
  - The chosen approach: **remove the global render mode from `Routes` in `App.razor`** and let each page/layout declare its own render mode. `MainLayout` gets `@rendermode InteractiveServer`, `MarketingLayout` gets no render mode (pure SSR).
- Interactive elements on marketing pages (mobile menu toggle) use vanilla JS via `<script>` tag in `MarketingLayout`, not Blazor interactivity

### Route Conflict Resolution
- **Problem:** `Dashboard.razor` in NavTour.Client currently uses `@page "/"`. The new marketing `Index.razor` in NavTour.Server also needs `@page "/"`. Two components claiming the same route causes a runtime ambiguity error.
- **Solution:** Change `Dashboard.razor` to `@page "/dashboard"` only (remove the `"/"` route). The marketing `Index.razor` owns `@page "/"`. Inside `Index.razor`, check auth state:
  ```csharp
  @if (isAuthenticated)
  {
      NavigationManager.NavigateTo("/dashboard", replace: true);
      return;
  }
  // else render marketing landing page
  ```
- Update all internal links that point to `/` to use `/dashboard` instead (sidebar, logo click, etc.)

### Server vs Client Page Split
- Marketing pages live in `NavTour.Server/Pages/Marketing/` — this is intentional, not accidental
- App pages remain in `NavTour.Client/Pages/` — these are interactive Blazor WASM/Server pages
- `Routes.razor` already discovers both assemblies via `AppAssembly` (Server) and `AdditionalAssemblies` (Client), so both sets of pages route correctly without changes

### SEO & Head Management
- Use Blazor's `<PageTitle>` component in each marketing page for per-page `<title>` tags
- Use `<HeadContent>` component for per-page `<meta name="description">` and Open Graph tags
- Since marketing pages are static SSR, head content renders server-side into the initial HTML response — fully crawlable
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>` in `MarketingLayout`
- Heading hierarchy: single `<h1>` per page, proper `<h2>`/`<h3>` nesting

### CSS Loading Strategy
- `marketing.css` is loaded via a `<link>` tag in `MarketingLayout.razor` (not in `App.razor`) — ensures it only loads on marketing pages, not in the app
- Scoped `.razor.css` files are bundled automatically into `NavTour.Server.styles.css`
- No conflict with Radzen styles since marketing pages don't reference any `rz-*` classes

### Contact Form & Newsletter
- **Contact form:** Submits to a new `ContactController` endpoint. Fields: Name, Email, Company (optional), Message. Stored in a `ContactSubmission` table. No CAPTCHA for MVP — add honeypot field for basic bot prevention.
- **Newsletter signup:** Email stored in same `ContactSubmission` table with a `Type` discriminator (Contact vs Newsletter). No third-party email service for MVP — manual export.
- **"Book a Demo" CTA:** Links to `/contact` page for MVP. When a Calendly or scheduling tool is set up later, update the href.

### Mobile Navigation
- Hamburger icon (☰) triggers a slide-down menu panel via vanilla JS `classList.toggle`
- Mobile menu shows: Features, Use Cases, Pricing, About, Login, Start Free
- Menu auto-closes on link click or outside tap

### Image Placeholders
- Use CSS gradient backgrounds (`linear-gradient`) as placeholder "screenshots" — same brand blue tones
- Target dimensions: hero image 1200x600, feature screenshots 600x400, logos 120x40
- Real screenshots replace placeholders incrementally as the product matures
- All `<img>` tags include `width`/`height` attributes to prevent CLS (Cumulative Layout Shift)

### Accessibility
- Color contrast: primary text `#1a1a2e` on white = 16.75:1 (AAA). Secondary text `#64748b` on white = 4.6:1 (AA pass). Acceptable for body copy; use primary text color for critical content.
- Keyboard navigation: all interactive elements (links, buttons, mobile menu) focusable and operable via keyboard
- ARIA: `aria-label` on icon-only buttons (hamburger menu), `aria-expanded` on mobile menu toggle
- `alt` text on all images; decorative images use `alt=""`
- Skip-to-content link at top of `MarketingLayout`

### Performance
- No external font downloads — system fonts only
- Image placeholders (CSS gradients) initially — zero image requests
- Minimal CSS — scoped styles + one shared `marketing.css`
- No JavaScript frameworks on marketing pages — only a small inline script for mobile menu toggle
- Static SSR = no SignalR connection, no WASM download for marketing visitors
