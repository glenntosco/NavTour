# NavTour Website Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the NavTour marketing website from P4 branding to NavTour's own indigo/violet brand, with AI-forward messaging, new pricing tiers, new pages (/product, /product/ai, /solutions/presales), and bilingual support (EN/ES).

**Architecture:** Iterative page-by-page rebuild on the existing Blazor SSR marketing infrastructure. Replace CSS design tokens first (NavTour indigo palette), update shared components (nav, footer), then rebuild pages in priority order. All marketing pages remain SSR-only (no @rendermode) using MarketingLayout.

**Tech Stack:** .NET 10, Blazor Server (SSR for marketing), CSS custom properties, vanilla JS via IJSRuntime, IStringLocalizer for i18n.

**Spec:** The full design spec is in the user's prompt from this session. Key brand values: `--nt-primary: #4F46E5` (indigo), `--nt-accent: #8B5CF6` (violet), Inter font, 4 pricing tiers (Free/$0, Starter/$99, Growth/$299, Enterprise/Custom), AI-forward messaging throughout.

---

## Phase 0: Foundation — CSS Design System + Shared Components

### Task 0.1: Replace CSS Design Tokens

**Files:**
- Modify: `src/NavTour.Server/wwwroot/css/marketing.css` (lines 1-99 — `:root` block)

The existing CSS is well-structured with CSS custom properties. We replace the P4 tokens with NavTour tokens while keeping the rest of the stylesheet functional.

- [ ] **Step 1: Replace the `:root` design tokens block**

Replace lines 1-99 of marketing.css. Change:
- `--p4-blue` → `--nt-primary: #4F46E5` (and all variants)
- `--p4-orange` → `--nt-accent: #8B5CF6` (and variants)
- Font stack: `'Inter', system-ui, -apple-system, sans-serif`
- Shadow glow: update rgba values from blue `(10,95,173)` to indigo `(79,70,229)`
- Add `--nt-success`, `--nt-warning`, `--nt-error` semantic colors
- Keep spacing, radius, easing, layout tokens unchanged

- [ ] **Step 2: Find-and-replace all `--p4-blue*` references in marketing.css**

The body of the CSS file references `--p4-blue`, `--p4-blue-dark`, etc. in button styles, card styles, links, etc. Replace all occurrences:
- `--p4-blue` → `--nt-primary`
- `--p4-blue-dark` → `--nt-primary-dark`
- `--p4-blue-deeper` → `--nt-primary-deeper`
- `--p4-blue-light` → `--nt-primary-light`
- `--p4-blue-subtle` → `--nt-primary-subtle`
- `--p4-orange` → `--nt-accent`
- `--p4-orange-dark` → `--nt-accent-dark` (add if missing: `#7C3AED`)
- `--p4-orange-light` → `--nt-accent-light`
- `--surface-tertiary` → reference `--nt-primary-subtle`

- [ ] **Step 3: Add Inter font to MarketingLayout**

Add Google Fonts `<link>` for Inter (weights 400, 500, 600, 700) in `MarketingLayout.razor` `<HeadContent>` or directly before the CSS link.

- [ ] **Step 4: Verify build compiles**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeded, 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/NavTour.Server/wwwroot/css/marketing.css src/NavTour.Server/Components/Layout/MarketingLayout.razor
git commit -m "refactor: replace P4 brand tokens with NavTour indigo/violet brand system"
```

---

### Task 0.2: Update Navigation Component

**Files:**
- Modify: `src/NavTour.Server/Components/Marketing/MarketingHeader.razor`

Update nav links to match spec's site architecture:
- Product dropdown: Features → /product, AI Platform → /product/ai (with "NEW" badge), Integrations → /integrations, Security → /security
- Solutions dropdown: For Marketing → /solutions/marketing, For Sales → /solutions/sales, For Presales → /solutions/presales
- Standalone: Customers → /customers, Pricing → /pricing
- CTAs: "Sign In" (secondary) + "Start Free →" (primary)

- [ ] **Step 1: Rewrite MarketingHeader.razor nav links**

Update the dropdown structure and links per spec. Add "NEW" badge next to AI Platform link using a `<span>` with accent-colored styling.

- [ ] **Step 2: Verify build + visual check**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Components/Marketing/MarketingHeader.razor
git commit -m "feat: update nav links — add Product/AI, Presales, restructure dropdowns"
```

---

### Task 0.3: Update Footer Component

**Files:**
- Modify: `src/NavTour.Server/Components/Marketing/MarketingFooter.razor`

Restructure to 4-column layout per spec:
- Col 1: NavTour logo + tagline + social icons
- Col 2: Product — Features, AI Platform, Integrations, Changelog, API Docs
- Col 3: Resources — Blog, Help Center, Templates, Webinars
- Col 4: Company — About, Careers, Contact, Security, Legal
- Bottom bar: © 2026 NavTour · Privacy · Terms · Status

- [ ] **Step 1: Rewrite footer markup**

Replace the 5-column P4 footer with 4-column NavTour footer. Remove "P4 Software | Grupo Barrdega" branding. Add placeholder social SVG icons (Twitter/X, LinkedIn, GitHub).

- [ ] **Step 2: Commit**

```bash
git add src/NavTour.Server/Components/Marketing/MarketingFooter.razor
git commit -m "feat: redesign footer — 4-column NavTour layout with social links"
```

---

### Task 0.4: Update HeroSection Component

**Files:**
- Modify: `src/NavTour.Server/Components/Marketing/HeroSection.razor`

The current HeroSection is minimal (title, subtitle, 2 CTAs). Extend it to support:
- Eyebrow text (small uppercase text above title, accent color)
- Larger visual hierarchy per spec (text-6xl → text-5xl → text-xl)
- Max-width constraints on title and subtitle
- Optional CSS class parameter for per-page customization

- [ ] **Step 1: Add Eyebrow parameter and styling**

Add `[Parameter] public string? Eyebrow { get; set; }` and render it above the title as `<p class="mkt-eyebrow">`.

- [ ] **Step 2: Commit**

```bash
git add src/NavTour.Server/Components/Marketing/HeroSection.razor
git commit -m "feat: add eyebrow text support to HeroSection component"
```

---

### Task 0.5: Update CtaSection Component

**Files:**
- Modify: `src/NavTour.Server/Components/Marketing/CtaSection.razor`

Add support for:
- Dark background variant (bg: nt-primary-deeper, text: white)
- Secondary CTA button alongside primary
- Subtext below subtitle

- [ ] **Step 1: Add Dark parameter and SecondaryCtaText/Url parameters**

- [ ] **Step 2: Commit**

```bash
git add src/NavTour.Server/Components/Marketing/CtaSection.razor
git commit -m "feat: add dark variant and secondary CTA to CtaSection"
```

---

## Phase 1: Homepage Rebuild

### Task 1.1: Rewrite Homepage Hero

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Index.razor` (lines 1-19)

Replace current hero with spec's AI-forward hero:
- Eyebrow: "AI-Powered Demo Platform"
- H1: "AI builds your demos. AI personalizes your demos. AI closes your deals."
- Subhead: "Capture your product. AI creates interactive demos..."
- CTAs: "Start Building Free" + "See It In Action"
- Product screenshot placeholder with perspective transform + shadow-xl
- Update PageTitle and meta description

- [ ] **Step 1: Rewrite hero section markup**
- [ ] **Step 2: Add CSS for perspective product screenshot**

Add `.mkt-hero-screenshot` class in marketing.css with subtle `perspective` and `rotateX`/`rotateY` transforms, shadow-xl, border, radius.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Index.razor src/NavTour.Server/wwwroot/css/marketing.css
git commit -m "feat: rebuild homepage hero — AI-forward messaging, product screenshot"
```

---

### Task 1.2: Rewrite Homepage Body Sections

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Index.razor` (lines 20-308)

Replace all body sections to match spec:
1. Logo bar — "Trusted by product-led teams", 6-8 placeholder logos
2. Use cases — "Demos for every stage of the buyer journey" — 6 horizontal cards (Website Embeds, Outbound Sales, Ad Campaigns, Pre-Call Discovery, Post-Call Follow-Up, Help Docs)
3. How It Works — 3-step alternating left/right layout (NOT centered 3-col): Capture → AI Builds Your Demo → Launch & Measure
4. Features Deep Dive — tabbed or scrolling, AI features FIRST: AI Copilot, Smart Editor, AI Personalization Engine, AI Analytics & Intent, No-Code Editor, Integrations, Team Workspace
5. Metrics/Social Proof — "Results that speak for themselves" — 4 stats: 10x, 47%, <5 min, 2.4x
6. Testimonial — single powerful quote
7. Bottom CTA — dark bg (nt-primary-deeper), white text

- [ ] **Step 1: Rewrite logo bar section**
- [ ] **Step 2: Rewrite use cases section with horizontal cards**
- [ ] **Step 3: Rewrite How It Works with alternating left/right layout**

Add `.mkt-alternating` CSS for left/right layout with even children reversed.

- [ ] **Step 4: Rewrite features deep dive section**

Create feature blocks with alternating layout. AI Copilot, Smart Editor, AI Personalization, AI Analytics get top placement. Each block: title + 2-3 sentence description + placeholder screenshot.

- [ ] **Step 5: Rewrite metrics section**

Update to 4 stat cards: "10x" (Faster demo creation with AI), "47%" (Increase in qualified leads), "< 5 min" (First AI demo, no training), "2.4x" (Faster sales cycle).

- [ ] **Step 6: Rewrite testimonial section**

Single quote: "NavTour replaced our entire demo environment..." with name, title, company.

- [ ] **Step 7: Replace bottom CTA with dark variant**

Use `<CtaSection>` with Dark=true, AI-forward copy per spec.

- [ ] **Step 8: Remove sections that no longer exist**

Remove: "NavTour vs. The Rest" comparison table, old pricing preview, old trust badges section, "no credit card note" div.

- [ ] **Step 9: Add any new CSS needed**

Add to marketing.css:
- `.mkt-alternating` layout for how-it-works
- `.mkt-use-case-card` horizontal scroll cards
- Updated `.mkt-metrics` with 4 columns
- Dark CTA section variant

- [ ] **Step 10: Verify build**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`

- [ ] **Step 11: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Index.razor src/NavTour.Server/wwwroot/css/marketing.css
git commit -m "feat: rebuild homepage — AI-forward content, alternating layouts, dark CTA"
```

---

## Phase 2: Pricing Page Rebuild

### Task 2.1: Rewrite Pricing Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Pricing.razor`
- Modify: `src/NavTour.Server/Components/Marketing/PricingCard.razor`

New pricing tiers (spec):
- Free: $0, 1 demo, 10 frames, AI Copilot (basic), no credit card
- Starter: $99/mo, 5 demos, 1 user, AI copy editing + smart editor + demo review
- Growth: $299/mo (RECOMMENDED), 25 demos, 5 users, AI personalization + intent + branching + API
- Enterprise: Custom, SSO, unlimited, custom AI training

Changes:
- Add Monthly/Annual toggle (annual saves 20%)
- Growth card gets accent border + "Most Popular" badge
- All paid CTAs say "Start Free →"
- Full feature comparison table with categories (Core, Analytics, Collaboration, Integrations, Support, Security)
- FAQ accordion (8-10 questions including "Is the free plan really free?")

- [ ] **Step 1: Update PricingCard component**

Add parameters: `Period` (string), `Badge` (string, for "Most Popular"), `AnnualPrice` (string). Update styling for accent top border on highlighted card.

- [ ] **Step 2: Rewrite Pricing.razor hero + cards**

New H1: "Simple pricing. Powerful demos." Subhead: "Start free. Scale as you grow." Monthly/Annual toggle. 4 pricing cards with new tier data.

- [ ] **Step 3: Add feature comparison table**

Full matrix table with checkmarks (nt-primary SVG) and dashes. Categories: Core Features, AI Features, Analytics, Collaboration, Integrations, Support, Security. Sticky header, zebra striping.

- [ ] **Step 4: Add FAQ accordion**

8-10 questions. Include "Is the free plan really free?" → "Yes. No credit card, no trial period..." Clean expand/collapse with +/- icons. Add JS for accordion toggle or use CSS-only `<details>`/`<summary>`.

- [ ] **Step 5: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Pricing.razor src/NavTour.Server/Components/Marketing/PricingCard.razor src/NavTour.Server/wwwroot/css/marketing.css
git commit -m "feat: rebuild pricing — Free/Starter/Growth/Enterprise, comparison table, FAQ"
```

---

## Phase 3: Product Pages

### Task 3.1: Create Product Features Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/Product.razor` (route: `/product`)
- Modify or retire: `src/NavTour.Server/Pages/Marketing/Features.razor` (currently at `/features`)

Deep dive into each feature with alternating left/right layout. AI features get TOP placement (first 4 sections):

1. AI Copilot
2. AI Smart Editor
3. AI Personalization Engine
4. AI Analytics & Intent Scoring
5. Chrome Extension Capture
6. No-Code Editor
7. Embed Options
8. AI Demo Review & Optimization
9. AI Branching & Flow Logic
10. Team Collaboration & Brand Kit
11. Integrations & API
12. Multi-Language Support

Each section: title + 2-3 sentence description + LARGE placeholder screenshot (gray box with descriptive label).

- [ ] **Step 1: Create Product.razor with hero + 12 feature sections**

Route: `@page "/product"`. Hero: product positioning statement. Alternating layout feature sections.

- [ ] **Step 2: Update /features route**

Either redirect `/features` to `/product` or update Features.razor to `@page "/product"` and remove the old route. Update all internal links.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Product.razor
git commit -m "feat: add Product page — 12 features, AI-first, alternating layouts"
```

---

### Task 3.2: Create AI Features Deep Dive Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/ProductAI.razor` (route: `/product/ai`)

Dedicated AI page per spec:
- Hero: "AI that builds, edits, and optimizes your demos — so you don't have to"
- 7 AI capabilities with large mockup visuals:
  1. AI Copilot
  2. AI Smart Editor
  3. AI Personalization
  4. AI Analytics & Intent
  5. AI Demo Review
  6. AI Branching Logic
  7. AI Brand Voice Memory
- Competitor comparison table: NavTour vs Navattic vs Storylane vs Walnut vs Supademo
- CTA: "See AI in action — build your first demo free"

- [ ] **Step 1: Create ProductAI.razor with hero + 7 AI capability sections**
- [ ] **Step 2: Add competitor comparison table**
- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/ProductAI.razor
git commit -m "feat: add AI Features deep dive page with competitor comparison"
```

---

## Phase 4: Solution Pages

### Task 4.1: Rebuild Marketing Solutions Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/SolutionMarketing.razor`

Rebuild with spec content:
- Pain: "Your product is amazing, but prospects can't see it until after a sales call"
- Solution: Website embeds, ad campaign CTAs, content marketing
- Metrics: engagement, pipeline influenced, conversion rates
- Structure: Hero → 3 pain-point cards → 3 features → metrics → CTA

- [ ] **Step 1: Rewrite SolutionMarketing.razor**
- [ ] **Step 2: Commit**

### Task 4.2: Rebuild Sales Solutions Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/SolutionSales.razor`

- Pain: "Generic slide decks don't close deals"
- Solution: Personalized demo links, pre-call discovery, follow-up assets
- Metrics: deal velocity, win rate, demo-to-close ratio

- [ ] **Step 1: Rewrite SolutionSales.razor**
- [ ] **Step 2: Commit**

### Task 4.3: Create Presales Solutions Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/SolutionPresales.razor` (route: `/solutions/presales`)

- Pain: "Your SEs spend 80% of their time on repetitive discovery demos"
- Solution: Self-serve demos, template libraries, team analytics
- Metrics: demos per SE, time saved, SE satisfaction

- [ ] **Step 1: Create SolutionPresales.razor**
- [ ] **Step 2: Update nav and footer links to include presales**
- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/SolutionMarketing.razor src/NavTour.Server/Pages/Marketing/SolutionSales.razor src/NavTour.Server/Pages/Marketing/SolutionPresales.razor
git commit -m "feat: rebuild solution pages — Marketing, Sales, new Presales page"
```

---

## Phase 5: Remaining Pages

### Task 5.1: Rebuild Customers Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Customers.razor`

Per spec:
- Hero: "See how teams use NavTour to close more deals"
- Logo wall: 12-16 placeholder logos
- 3 featured case studies: Challenge / Solution / Result format with key metric callout
- Testimonial quotes interspersed

- [ ] **Step 1: Rewrite Customers.razor**
- [ ] **Step 2: Commit**

### Task 5.2: Rebuild Blog Index

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Blog.razor`

Currently a "coming soon" page. Build the real index per spec:
- Clean grid layout (2-3 columns)
- Category filter bar
- Cards: placeholder image + category tag + title + excerpt + author + date
- Pagination placeholder
- Sidebar: newsletter signup, popular posts, categories
- Use placeholder blog post data (hardcoded list of 6-8 fake posts)

- [ ] **Step 1: Rewrite Blog.razor with grid layout**
- [ ] **Step 2: Add blog card CSS to marketing.css**
- [ ] **Step 3: Commit**

### Task 5.3: Rebuild Contact Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Contact.razor`

Per spec:
- Split layout: left = form, right = value props
- Form: Name, Email, Company, Company Size (dropdown), Message
- Right: "What happens next?" — 3 steps
- Social proof below form

- [ ] **Step 1: Rewrite Contact.razor with split layout**
- [ ] **Step 2: Commit**

### Task 5.4: Rebuild Security Page

**Files:**
- Modify: `src/NavTour.Server/Pages/Marketing/Security.razor`

Per spec:
- Trust & compliance page
- Sections: Data Security, Infrastructure, Compliance (SOC 2), Privacy, Responsible Disclosure
- Clean, professional, text-heavy layout

- [ ] **Step 1: Rewrite Security.razor**
- [ ] **Step 2: Commit**

---

## Phase 6: Polish Passes

### Task 6.1: Mobile Responsive Pass

**Files:**
- Modify: `src/NavTour.Server/wwwroot/css/marketing.css` (responsive sections)

Test every page at 375px width. Fix:
- Grid layouts collapsing to 1 column
- Touch targets ≥ 44px
- Section padding: 80px vertical on mobile
- Font size: H1 → text-4xl, body stays ≥ 16px
- Hamburger menu working on all pages
- Tables: horizontal scroll on mobile

- [ ] **Step 1: Review and fix responsive breakpoints**
- [ ] **Step 2: Commit**

### Task 6.2: Animation Pass

**Files:**
- Modify: `src/NavTour.Server/wwwroot/css/marketing.css`
- Verify: `src/NavTour.Server/Components/Layout/MarketingLayout.razor` (scroll observer)

Ensure all new sections have `.reveal` or `.reveal-stagger` classes. Add hover states to all cards and buttons. Verify `prefers-reduced-motion` fallback is working.

- [ ] **Step 1: Add reveal classes to any sections missing them**
- [ ] **Step 2: Verify animation CSS and reduced-motion media query**
- [ ] **Step 3: Commit**

### Task 6.3: Bilingual Pass (EN/ES)

**Files:**
- Create: `src/NavTour.Server/Resources/SharedResources.en.resx`
- Create: `src/NavTour.Server/Resources/SharedResources.es.resx`
- Create: `src/NavTour.Server/Resources/SharedResources.cs` (empty marker class)
- Modify: `src/NavTour.Server/Program.cs` (add localization services)
- Modify: All marketing page .razor files (replace hardcoded strings with `@L["key"]`)
- Modify: `src/NavTour.Server/Components/Marketing/MarketingHeader.razor` (add EN|ES toggle)

This is a large pass that touches every page. Steps:
1. Set up localization infrastructure (Program.cs, resource files, marker class)
2. Add language toggle to nav
3. Extract strings from each page one at a time
4. Write adapted Spanish translations (not literal translations)

- [ ] **Step 1: Set up localization infrastructure**

In Program.cs add:
```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
```
Add `RequestLocalizationMiddleware` with supported cultures `["en", "es"]`.

- [ ] **Step 2: Create resource files with homepage strings**
- [ ] **Step 3: Add EN|ES toggle to MarketingHeader**
- [ ] **Step 4: Convert homepage to use IStringLocalizer**
- [ ] **Step 5: Convert remaining pages (batch)**
- [ ] **Step 6: Commit**

```bash
git add src/NavTour.Server/Resources/ src/NavTour.Server/Program.cs src/NavTour.Server/Pages/Marketing/ src/NavTour.Server/Components/Marketing/MarketingHeader.razor
git commit -m "feat: add bilingual support (EN/ES) with IStringLocalizer"
```

### Task 6.4: Accessibility Audit

**Files:**
- Modify: Various marketing pages and CSS

Check and fix:
- `:focus-visible` on all interactive elements
- 4.5:1 contrast ratios (especially with new indigo/violet palette)
- Skip link working
- All images have alt text
- Form labels and ARIA
- Semantic HTML (headings hierarchy, landmarks)

- [ ] **Step 1: Add focus-visible styles if missing**
- [ ] **Step 2: Verify contrast ratios on new brand colors**
- [ ] **Step 3: Audit heading hierarchy on each page**
- [ ] **Step 4: Commit**

---

## Phase 7: Cleanup

### Task 7.1: Remove Deprecated Pages and Update Routes

**Files:**
- Remove or redirect: `src/NavTour.Server/Pages/Marketing/Features.razor` (if replaced by Product.razor)
- Remove or redirect: `src/NavTour.Server/Pages/Marketing/SolutionCS.razor` (if replaced or kept)
- Update: All internal links across all pages and components
- Verify: No broken links, all nav/footer links resolve

- [ ] **Step 1: Audit all internal links**
- [ ] **Step 2: Remove or redirect deprecated pages**
- [ ] **Step 3: Final build verification**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`

- [ ] **Step 4: Commit and push**

---

## Execution Notes

- **Each task should be a separate commit** for easy review and rollback
- **After each phase, push to main** to trigger CI and catch build issues early
- **The premium-website-design skill must be loaded** before writing any CSS or layout code
- **No Bootstrap, no Tailwind** — only CSS custom properties
- **All marketing pages**: `@layout MarketingLayout`, `[AllowAnonymous]`, no `@rendermode`
- **Placeholder screenshots**: Use gray divs with descriptive labels (`.mkt-placeholder` class already exists)
- **Copy**: Write real marketing copy everywhere, never Lorem Ipsum
