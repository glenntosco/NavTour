# NavTour Public Website Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing marketing website (Landing, Features, Use Cases, Pricing, About, Blog, Docs, Contact) as Blazor SSR pages within the existing NavTour.Server project.

**Architecture:** New SSR-only marketing pages in NavTour.Server with a dedicated MarketingLayout, completely separate from the interactive Radzen app. Route `/` switches from Dashboard to the marketing landing page; authenticated users redirect to `/dashboard`. Render mode architecture updated so marketing pages skip SignalR/WASM entirely.

**Tech Stack:** .NET 10 Blazor SSR, custom CSS (no Radzen on marketing pages), system fonts, vanilla JS for mobile menu only.

**Spec:** `Docs/superpowers/specs/2026-03-17-navtour-public-website-design.md`

---

## File Structure

### New Files (NavTour.Server)

| File | Responsibility |
|---|---|
| `Components/Layout/MarketingLayout.razor` | Public site layout: header, main, footer wrapper |
| `Components/Layout/MarketingLayout.razor.css` | Scoped styles for layout shell |
| `Components/Marketing/MarketingHeader.razor` | Nav bar: logo, links, Login/Start Free CTAs |
| `Components/Marketing/MarketingFooter.razor` | Footer: nav links, legal, copyright |
| `Components/Marketing/HeroSection.razor` | Reusable hero with headline, subheadline, CTAs, visual |
| `Components/Marketing/FeatureCard.razor` | Feature card: icon, title, description |
| `Components/Marketing/PricingCard.razor` | Pricing tier card with feature checklist |
| `Components/Marketing/CtaSection.razor` | Reusable final CTA block |
| `Controllers/ContactController.cs` | API endpoint for contact form + newsletter submissions |
| `Pages/Marketing/Index.razor` | Landing page (`/`) |
| `Pages/Marketing/Features.razor` | Features page (`/features`) |
| `Pages/Marketing/UseCases.razor` | Use cases page (`/use-cases`) |
| `Pages/Marketing/Pricing.razor` | Pricing page (`/pricing`) |
| `Pages/Marketing/About.razor` | About page (`/about`) |
| `Pages/Marketing/Blog.razor` | Blog placeholder (`/blog`) |
| `Pages/Marketing/DocsSoon.razor` | Docs placeholder (`/docs`) |
| `Pages/Marketing/Contact.razor` | Contact page (`/contact`) |
| `wwwroot/css/marketing.css` | Shared marketing CSS: variables, typography, grid, buttons, sections |

Note: `Pages/Marketing/` directory does not currently exist in NavTour.Server — it will be created when the first page file is written. Blazor discovers `@page`-annotated components from any subdirectory within the project assembly.

### Modified Files

| File | Change |
|---|---|
| `src/NavTour.Client/Pages/Dashboard.razor:1` | Change `@page "/"` to `@page "/dashboard"` |
| `src/NavTour.Client/Pages/Login.razor:35` | Change `Nav.NavigateTo("/")` to `Nav.NavigateTo("/dashboard")` |
| `src/NavTour.Client/Pages/Register.razor:39` | Change `Nav.NavigateTo("/")` to `Nav.NavigateTo("/dashboard")` |
| `src/NavTour.Client/Pages/DemoEditor.razor:72` | Change `Nav.NavigateTo("/")` to `Nav.NavigateTo("/dashboard")` |
| `src/NavTour.Client/Pages/DemoSettings.razor` | Change `Nav.NavigateTo("/")` to `Nav.NavigateTo("/dashboard")` if present |
| `src/NavTour.Client/Layout/MainLayout.razor:8` | Change logo link from `"/"` to `"/dashboard"` |
| `src/NavTour.Server/Components/App.razor` | Remove global `@rendermode` from Routes and HeadOutlet |
| `src/NavTour.Server/Components/Routes.razor` | No changes needed — already discovers both assemblies |
| `src/NavTour.Server/Components/_Imports.razor` | Add marketing component namespace |
| `src/NavTour.Server/Infrastructure/Data/NavTourDbContext.cs` | Add `DbSet<ContactSubmission>` |
| `src/NavTour.Server/Program.cs` | Add `builder.Services.AddHttpClient()` for contact form |

---

## Task 1: Render Mode Architecture & Route Fix

**Goal:** Make marketing pages render as static SSR (no SignalR circuit) while keeping app pages interactive. Fix the `/` route conflict.

**Files:**
- Modify: `src/NavTour.Server/Components/App.razor`
- Modify: `src/NavTour.Client/Pages/Dashboard.razor:1`

- [ ] **Step 1: Change Dashboard route from `/` to `/dashboard`**

In `src/NavTour.Client/Pages/Dashboard.razor`, change line 1:

```razor
@* Before: *@
@page "/"

@* After: *@
@page "/dashboard"
```

- [ ] **Step 2: Update all NavigateTo("/") calls to "/dashboard"**

Update every file in `NavTour.Client` that navigates to `"/"` after auth actions:

In `src/NavTour.Client/Pages/Login.razor`: Change `Nav.NavigateTo("/")` → `Nav.NavigateTo("/dashboard")`
In `src/NavTour.Client/Pages/Register.razor`: Change `Nav.NavigateTo("/")` → `Nav.NavigateTo("/dashboard")`
In `src/NavTour.Client/Pages/DemoEditor.razor`: Change `Nav.NavigateTo("/")` → `Nav.NavigateTo("/dashboard")`
In `src/NavTour.Client/Layout/MainLayout.razor`: Change logo link href from `"/"` to `"/dashboard"`

Search for any other `NavigateTo("/")` calls and update them too.

- [ ] **Step 3: Update App.razor to remove global render mode from both Routes and HeadOutlet**

Replace `src/NavTour.Server/Components/App.razor` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="_content/Radzen.Blazor/css/material-base.css" />
    <link rel="stylesheet" href="NavTour.Server.styles.css" />
    <HeadOutlet />
</head>
<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
    <script src="_content/Radzen.Blazor/Radzen.Blazor.js"></script>
    <script src="js/interop.js"></script>
    <script src="js/frame-editor-bridge.js"></script>
</body>
</html>
```

Key changes:
- `<Routes @rendermode="InteractiveServer" />` → `<Routes />` (no global render mode)
- `<HeadOutlet @rendermode="InteractiveServer" />` → `<HeadOutlet />` (SSR head rendering for marketing pages; `<PageTitle>` and `<HeadContent>` render server-side into initial HTML)

- [ ] **Step 4: Add render mode to MainLayout**

In `src/NavTour.Client/Layout/MainLayout.razor`, add at the top (after any existing directives):

```razor
@attribute [RenderModeInteractiveServer]
```

This ensures all app pages using MainLayout still get InteractiveServer mode.

Note: If `[RenderModeInteractiveServer]` attribute isn't available in .NET 10, use the alternative approach: wrap `@Body` in MainLayout with `<div @rendermode="InteractiveServer">@Body</div>`, or apply `@rendermode InteractiveServer` per-page on each Client page. Check which pattern the framework supports and use the simplest one.

- [ ] **Step 5: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds with 0 errors.

- [ ] **Step 6: Run and test**

Run: `dotnet run --project src/NavTour.Server/NavTour.Server.csproj`
Test: Navigate to `http://localhost:5017/dashboard` — should show the Dashboard page (login prompt if not authenticated).
Test: Navigate to `http://localhost:5017/` — should show a 404 or empty page (marketing page not created yet, that's expected).
Test: Navigate to `http://localhost:5017/login` — login, verify redirect goes to `/dashboard` not `/`.

- [ ] **Step 7: Commit**

```bash
git add src/NavTour.Server/Components/App.razor src/NavTour.Client/Pages/Dashboard.razor src/NavTour.Client/Pages/Login.razor src/NavTour.Client/Pages/Register.razor src/NavTour.Client/Pages/DemoEditor.razor src/NavTour.Client/Layout/MainLayout.razor
git commit -m "refactor: move Dashboard to /dashboard, remove global render mode for SSR marketing pages"
```

---

## Task 2: Marketing CSS Foundation

**Goal:** Create the shared marketing stylesheet with CSS custom properties, typography, grid utilities, button styles, and section patterns.

**Files:**
- Create: `src/NavTour.Server/wwwroot/css/marketing.css`

- [ ] **Step 1: Create marketing.css**

Create `src/NavTour.Server/wwwroot/css/marketing.css`:

```css
/* NavTour Marketing Site Styles */

/* ========== CSS Custom Properties ========== */
:root {
    --nt-primary: #4361ee;
    --nt-primary-dark: #2d3db8;
    --nt-primary-light: #e8ebfd;
    --nt-primary-lighter: #f4f5fe;
    --nt-text: #1a1a2e;
    --nt-text-secondary: #64748b;
    --nt-white: #ffffff;
    --nt-success: #10b981;
    --nt-border: #e2e8f0;
    --nt-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --nt-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --nt-radius: 8px;
    --nt-radius-lg: 12px;
    --nt-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --nt-max-width: 1200px;
    --nt-section-padding: 80px 24px;
}

/* ========== Reset & Base ========== */
.mkt * { box-sizing: border-box; margin: 0; padding: 0; }
.mkt { font-family: var(--nt-font); color: var(--nt-text); line-height: 1.6; }
.mkt a { color: var(--nt-primary); text-decoration: none; }
.mkt a:hover { color: var(--nt-primary-dark); }
.mkt img { max-width: 100%; height: auto; }

/* ========== Typography ========== */
.mkt h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
.mkt h2 { font-size: 2.5rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
.mkt h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.mkt h4 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }
.mkt p { font-size: 1.125rem; color: var(--nt-text-secondary); }
.mkt .text-sm { font-size: 0.875rem; }
.mkt .text-center { text-align: center; }

/* ========== Layout ========== */
.mkt-container { max-width: var(--nt-max-width); margin: 0 auto; padding: 0 24px; }
.mkt-section { padding: var(--nt-section-padding); }
.mkt-section-alt { padding: var(--nt-section-padding); background: var(--nt-primary-lighter); }

/* ========== Grid ========== */
.mkt-grid { display: grid; gap: 32px; }
.mkt-grid-2 { grid-template-columns: repeat(2, 1fr); }
.mkt-grid-3 { grid-template-columns: repeat(3, 1fr); }
.mkt-grid-4 { grid-template-columns: repeat(4, 1fr); }

/* ========== Buttons ========== */
.mkt-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 28px; border-radius: var(--nt-radius); font-size: 1rem;
    font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;
    text-decoration: none;
}
.mkt-btn-primary {
    background: var(--nt-primary); color: var(--nt-white); border-color: var(--nt-primary);
}
.mkt-btn-primary:hover {
    background: var(--nt-primary-dark); border-color: var(--nt-primary-dark); color: var(--nt-white);
}
.mkt-btn-outline {
    background: transparent; color: var(--nt-primary); border-color: var(--nt-primary);
}
.mkt-btn-outline:hover {
    background: var(--nt-primary); color: var(--nt-white);
}
.mkt-btn-lg { padding: 16px 36px; font-size: 1.125rem; }

/* ========== Cards ========== */
.mkt-card {
    background: var(--nt-white); border: 1px solid var(--nt-border);
    border-radius: var(--nt-radius-lg); padding: 32px;
    box-shadow: var(--nt-shadow); transition: box-shadow 0.2s ease;
}
.mkt-card:hover { box-shadow: var(--nt-shadow-lg); }

/* ========== Image Placeholders ========== */
.mkt-placeholder {
    background: linear-gradient(135deg, var(--nt-primary-light) 0%, #d4dbf9 100%);
    border-radius: var(--nt-radius-lg); display: flex;
    align-items: center; justify-content: center;
    color: var(--nt-primary); font-weight: 600; font-size: 0.875rem;
}
.mkt-placeholder-hero { width: 100%; height: 400px; }
.mkt-placeholder-feature { width: 100%; height: 300px; }
.mkt-placeholder-logo { width: 120px; height: 40px; border-radius: 4px; }

/* ========== Responsive ========== */
@media (max-width: 1024px) {
    .mkt h1 { font-size: 2.75rem; }
    .mkt h2 { font-size: 2rem; }
    .mkt-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
    :root { --nt-section-padding: 48px 16px; }
    .mkt h1 { font-size: 2.25rem; }
    .mkt h2 { font-size: 1.75rem; }
    .mkt-grid-2, .mkt-grid-3, .mkt-grid-4 { grid-template-columns: 1fr; }
    .mkt-btn-lg { padding: 14px 28px; font-size: 1rem; }
}
@media (max-width: 640px) {
    .mkt h1 { font-size: 1.875rem; }
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/NavTour.Server/wwwroot/css/marketing.css`
Expected: File listed.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/wwwroot/css/marketing.css
git commit -m "feat: add marketing CSS foundation with brand colors, typography, grid, buttons"
```

---

## Task 3: MarketingLayout + Header + Footer

**Goal:** Create the marketing layout shell with header navigation and footer. This is the container for all public pages.

**Files:**
- Create: `src/NavTour.Server/Components/Layout/MarketingLayout.razor`
- Create: `src/NavTour.Server/Components/Layout/MarketingLayout.razor.css`
- Create: `src/NavTour.Server/Components/Marketing/MarketingHeader.razor`
- Create: `src/NavTour.Server/Components/Marketing/MarketingFooter.razor`
- Modify: `src/NavTour.Server/Components/_Imports.razor`

- [ ] **Step 1: Update Server _Imports.razor**

Add to `src/NavTour.Server/Components/_Imports.razor`:

```razor
@using NavTour.Server.Components.Marketing
@using NavTour.Server.Components.Layout
```

- [ ] **Step 2: Create MarketingHeader.razor**

Create `src/NavTour.Server/Components/Marketing/MarketingHeader.razor`:

```razor
<header class="mkt-header">
    <div class="mkt-container mkt-header-inner">
        <a href="/" class="mkt-logo">
            <img src="favicon.svg" alt="NavTour" width="32" height="32" />
            <span>NavTour</span>
        </a>

        <nav class="mkt-nav" id="mkt-nav">
            <a href="/features">Features</a>
            <a href="/use-cases">Use Cases</a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
            <a href="/login" class="mkt-nav-mobile-only">Login</a>
            <a href="/register" class="mkt-nav-mobile-only mkt-btn mkt-btn-primary" style="text-align:center">Start Free</a>
        </nav>

        <div class="mkt-header-actions">
            <a href="/login" class="mkt-btn mkt-btn-outline">Login</a>
            <a href="/register" class="mkt-btn mkt-btn-primary">Start Free</a>
        </div>

        <button class="mkt-hamburger" id="mkt-hamburger" aria-label="Toggle menu" aria-expanded="false" onclick="var n=document.getElementById('mkt-nav');n.classList.toggle('open');this.setAttribute('aria-expanded',n.classList.contains('open'))">
            <span></span><span></span><span></span>
        </button>
    </div>
</header>
```

- [ ] **Step 3: Create MarketingFooter.razor**

Create `src/NavTour.Server/Components/Marketing/MarketingFooter.razor`:

```razor
<footer class="mkt-footer">
    <div class="mkt-container">
        <div class="mkt-footer-grid">
            <div class="mkt-footer-col">
                <h4>Product</h4>
                <a href="/features">Features</a>
                <a href="/pricing">Pricing</a>
                <a href="/docs">Documentation</a>
            </div>
            <div class="mkt-footer-col">
                <h4>Solutions</h4>
                <a href="/use-cases#sales">For Sales</a>
                <a href="/use-cases#marketing">For Marketing</a>
                <a href="/use-cases#cs">For Customer Success</a>
            </div>
            <div class="mkt-footer-col">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/blog">Blog</a>
                <a href="/contact">Contact</a>
            </div>
            <div class="mkt-footer-col">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
            </div>
        </div>
        <div class="mkt-footer-bottom">
            <p>&copy; 2026 P4 Software | Grupo Barrdega. All rights reserved.</p>
        </div>
    </div>
</footer>
```

- [ ] **Step 4: Create MarketingLayout.razor**

Create `src/NavTour.Server/Components/Layout/MarketingLayout.razor`:

```razor
@inherits LayoutComponentBase

<link rel="stylesheet" href="css/marketing.css" />

<div class="mkt">
    <a href="#main-content" class="mkt-skip-link">Skip to content</a>
    <MarketingHeader />
    <main id="main-content">
        @Body
    </main>
    <MarketingFooter />
</div>
```

- [ ] **Step 5: Create MarketingLayout.razor.css**

Create `src/NavTour.Server/Components/Layout/MarketingLayout.razor.css`:

```css
/* Skip link */
.mkt-skip-link {
    position: absolute; left: -9999px; top: 0; z-index: 999;
    background: var(--nt-primary); color: #fff; padding: 8px 16px;
}
.mkt-skip-link:focus { left: 0; }

/* Header */
::deep .mkt-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--nt-border, #e2e8f0);
}
::deep .mkt-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; gap: 32px;
}
::deep .mkt-logo {
    display: flex; align-items: center; gap: 8px;
    font-size: 1.25rem; font-weight: 700; color: var(--nt-text, #1a1a2e);
    text-decoration: none;
}
::deep .mkt-nav { display: flex; gap: 28px; }
::deep .mkt-nav a {
    font-size: 0.9375rem; font-weight: 500;
    color: var(--nt-text-secondary, #64748b); text-decoration: none;
}
::deep .mkt-nav a:hover { color: var(--nt-primary, #4361ee); }
::deep .mkt-header-actions { display: flex; gap: 12px; align-items: center; }
::deep .mkt-hamburger {
    display: none; background: none; border: none; cursor: pointer;
    flex-direction: column; gap: 5px; padding: 4px;
}
::deep .mkt-hamburger span {
    display: block; width: 24px; height: 2px; background: var(--nt-text, #1a1a2e);
    transition: 0.2s;
}

/* Footer */
::deep .mkt-footer {
    background: var(--nt-text, #1a1a2e); color: #cbd5e1; padding: 64px 24px 32px;
}
::deep .mkt-footer h4 { color: #fff; margin-bottom: 16px; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
::deep .mkt-footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-bottom: 48px; }
::deep .mkt-footer-col { display: flex; flex-direction: column; gap: 10px; }
::deep .mkt-footer-col a { color: #94a3b8; font-size: 0.875rem; text-decoration: none; }
::deep .mkt-footer-col a:hover { color: #fff; }
::deep .mkt-footer-bottom { border-top: 1px solid #334155; padding-top: 24px; }
::deep .mkt-footer-bottom p { font-size: 0.8125rem; color: #64748b; }

/* Mobile-only links (Login/Start Free in nav) hidden on desktop */
::deep .mkt-nav-mobile-only { display: none; }

/* Mobile */
@media (max-width: 768px) {
    ::deep .mkt-nav {
        display: none; position: absolute; top: 64px; left: 0; right: 0;
        background: #fff; flex-direction: column; padding: 16px 24px;
        border-bottom: 1px solid var(--nt-border, #e2e8f0); box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    ::deep .mkt-nav.open { display: flex; }
    ::deep .mkt-nav-mobile-only { display: block; }
    ::deep .mkt-header-actions { display: none; }
    ::deep .mkt-hamburger { display: flex; }
    ::deep .mkt-footer-grid { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 6: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds with 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/NavTour.Server/Components/Layout/MarketingLayout.razor src/NavTour.Server/Components/Layout/MarketingLayout.razor.css src/NavTour.Server/Components/Marketing/MarketingHeader.razor src/NavTour.Server/Components/Marketing/MarketingFooter.razor src/NavTour.Server/Components/_Imports.razor
git commit -m "feat: add MarketingLayout with header, footer, and mobile nav"
```

---

## Task 4: Reusable Marketing Components

**Goal:** Create shared components used across multiple marketing pages: HeroSection, FeatureCard, PricingCard, CtaSection.

**Files:**
- Create: `src/NavTour.Server/Components/Marketing/HeroSection.razor`
- Create: `src/NavTour.Server/Components/Marketing/FeatureCard.razor`
- Create: `src/NavTour.Server/Components/Marketing/PricingCard.razor`
- Create: `src/NavTour.Server/Components/Marketing/CtaSection.razor`

- [ ] **Step 1: Create HeroSection.razor**

Create `src/NavTour.Server/Components/Marketing/HeroSection.razor`:

```razor
<section class="mkt-section mkt-hero">
    <div class="mkt-container">
        <div class="mkt-hero-content">
            <h1>@Title</h1>
            <p class="mkt-hero-sub">@Subtitle</p>
            <div class="mkt-hero-actions">
                @if (!string.IsNullOrEmpty(PrimaryCtaUrl))
                {
                    <a href="@PrimaryCtaUrl" class="mkt-btn mkt-btn-primary mkt-btn-lg">@PrimaryCtaText</a>
                }
                @if (!string.IsNullOrEmpty(SecondaryCtaUrl))
                {
                    <a href="@SecondaryCtaUrl" class="mkt-btn mkt-btn-outline mkt-btn-lg">@SecondaryCtaText</a>
                }
            </div>
        </div>
        <div class="mkt-placeholder mkt-placeholder-hero">Product Preview</div>
    </div>
</section>

@code {
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public string Subtitle { get; set; } = "";
    [Parameter] public string PrimaryCtaText { get; set; } = "Start Free";
    [Parameter] public string PrimaryCtaUrl { get; set; } = "/register";
    [Parameter] public string SecondaryCtaText { get; set; } = "Book a Demo";
    [Parameter] public string SecondaryCtaUrl { get; set; } = "/contact";
}
```

- [ ] **Step 2: Create FeatureCard.razor**

Create `src/NavTour.Server/Components/Marketing/FeatureCard.razor`:

```razor
<div class="mkt-card mkt-feature-card">
    <div class="mkt-feature-icon">@Icon</div>
    <h3>@Title</h3>
    <p>@Description</p>
</div>

@code {
    [Parameter] public string Icon { get; set; } = "";
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public string Description { get; set; } = "";
}
```

- [ ] **Step 3: Create PricingCard.razor**

Create `src/NavTour.Server/Components/Marketing/PricingCard.razor`:

```razor
<div class="mkt-card mkt-pricing-card @(Highlighted ? "mkt-pricing-highlighted" : "")">
    <h3>@Name</h3>
    <div class="mkt-pricing-price">
        @if (Price == "Free")
        {
            <span class="mkt-pricing-amount">Free</span>
        }
        else if (Price == "Custom")
        {
            <span class="mkt-pricing-amount">Custom</span>
        }
        else
        {
            <span class="mkt-pricing-amount">@Price</span>
            <span class="mkt-pricing-period">/mo</span>
        }
    </div>
    <p class="mkt-pricing-desc">@Description</p>
    <ul class="mkt-pricing-features">
        @foreach (var feature in Features)
        {
            <li>@feature</li>
        }
    </ul>
    <a href="@CtaUrl" class="mkt-btn @(Highlighted ? "mkt-btn-primary" : "mkt-btn-outline")" style="width:100%">@CtaText</a>
</div>

@code {
    [Parameter] public string Name { get; set; } = "";
    [Parameter] public string Price { get; set; } = "";
    [Parameter] public string Description { get; set; } = "";
    [Parameter] public List<string> Features { get; set; } = new();
    [Parameter] public string CtaText { get; set; } = "Get Started";
    [Parameter] public string CtaUrl { get; set; } = "/register";
    [Parameter] public bool Highlighted { get; set; }
}
```

- [ ] **Step 4: Create CtaSection.razor**

Create `src/NavTour.Server/Components/Marketing/CtaSection.razor`:

```razor
<section class="mkt-section mkt-cta-section">
    <div class="mkt-container text-center">
        <h2>@Title</h2>
        <p>@Subtitle</p>
        <div class="mkt-hero-actions" style="margin-top:24px">
            <a href="@CtaUrl" class="mkt-btn mkt-btn-primary mkt-btn-lg">@CtaText</a>
        </div>
    </div>
</section>

@code {
    [Parameter] public string Title { get; set; } = "Ready to transform your demos?";
    [Parameter] public string Subtitle { get; set; } = "Start building interactive demos in minutes. No credit card required.";
    [Parameter] public string CtaText { get; set; } = "Start Free";
    [Parameter] public string CtaUrl { get; set; } = "/register";
}
```

- [ ] **Step 5: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/NavTour.Server/Components/Marketing/
git commit -m "feat: add reusable marketing components — Hero, FeatureCard, PricingCard, CTA"
```

---

## Task 5: Landing Page

**Goal:** Build the full landing page at `/` with all 10 sections from the spec.

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/Index.razor`

- [ ] **Step 1: Create the Marketing/Index.razor page**

Create `src/NavTour.Server/Pages/Marketing/Index.razor`:

```razor
@page "/"
@layout MarketingLayout

<PageTitle>NavTour — Interactive Demo Platform</PageTitle>
<HeadContent>
    <meta name="description" content="Create interactive product demos that close deals faster. 5x cheaper than Navattic. Free to start." />
    <meta property="og:title" content="NavTour — Interactive Demo Platform" />
    <meta property="og:description" content="Create interactive product demos that close deals faster." />
</HeadContent>

@* 1. Hero *@
<HeroSection
    Title="Interactive demos that close deals faster"
    Subtitle="Create, personalize, and share interactive product walkthroughs your prospects can experience — without logging into your product." />

@* 2. Social Proof Bar *@
<section class="mkt-section-alt" style="padding:32px 24px">
    <div class="mkt-container text-center">
        <p class="text-sm" style="color:var(--nt-text-secondary);margin-bottom:16px">Built on proven infrastructure serving 5,000+ clients</p>
        <div style="display:flex;gap:32px;justify-content:center;align-items:center;flex-wrap:wrap">
            @for (int i = 0; i < 5; i++)
            {
                <div class="mkt-placeholder mkt-placeholder-logo">Partner</div>
            }
        </div>
    </div>
</section>

@* 3. Problem → Solution *@
<section class="mkt-section">
    <div class="mkt-container">
        <h2 class="text-center" style="margin-bottom:48px">Why teams switch to NavTour</h2>
        <div class="mkt-grid mkt-grid-3">
            <div class="mkt-card" style="text-align:center">
                <div style="font-size:2rem;margin-bottom:12px">💰</div>
                <h3>Demos shouldn't cost $500/mo</h3>
                <p>Start free, scale at $99/mo. 5x cheaper than the industry standard with more features included.</p>
            </div>
            <div class="mkt-card" style="text-align:center">
                <div style="font-size:2rem;margin-bottom:12px">🔧</div>
                <h3>No engineering required</h3>
                <p>Capture your product with our Chrome extension. Build walkthroughs with drag-and-drop. No code needed.</p>
            </div>
            <div class="mkt-card" style="text-align:center">
                <div style="font-size:2rem;margin-bottom:12px">📊</div>
                <h3>Know what's working</h3>
                <p>Track every click, see where prospects drop off, and capture leads — all in one dashboard.</p>
            </div>
        </div>
    </div>
</section>

@* 4. Feature Highlights *@
<section class="mkt-section-alt">
    <div class="mkt-container">
        <h2 class="text-center" style="margin-bottom:48px">Everything you need to build demos</h2>
        <div class="mkt-grid mkt-grid-4">
            <FeatureCard Icon="📸" Title="Capture" Description="One-click Chrome extension captures your product as interactive HTML snapshots." />
            <FeatureCard Icon="✏️" Title="Annotate" Description="Add tooltips, modals, hotspots, and blur overlays to guide your viewers." />
            <FeatureCard Icon="🎯" Title="Personalize" Description="Dynamic tokens like {{company}} tailor every demo to every prospect." />
            <FeatureCard Icon="📈" Title="Analyze" Description="Session tracking, step completion rates, and lead capture in real time." />
        </div>
    </div>
</section>

@* 5. How It Works *@
<section class="mkt-section">
    <div class="mkt-container">
        <h2 class="text-center" style="margin-bottom:48px">Build a demo in 3 steps</h2>
        <div class="mkt-grid mkt-grid-3">
            <div style="text-align:center">
                <div style="width:48px;height:48px;background:var(--nt-primary);color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:700;margin-bottom:16px">1</div>
                <h3>Capture</h3>
                <p>Use the Chrome extension to capture your product screens as interactive HTML snapshots.</p>
            </div>
            <div style="text-align:center">
                <div style="width:48px;height:48px;background:var(--nt-primary);color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:700;margin-bottom:16px">2</div>
                <h3>Customize</h3>
                <p>Add annotations, personalization tokens, and configure the guided walkthrough flow.</p>
            </div>
            <div style="text-align:center">
                <div style="width:48px;height:48px;background:var(--nt-primary);color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:700;margin-bottom:16px">3</div>
                <h3>Share</h3>
                <p>Publish and share a link. Embed on your website. Track engagement and capture leads.</p>
            </div>
        </div>
    </div>
</section>

@* 6. Use Case Previews *@
<section class="mkt-section-alt">
    <div class="mkt-container">
        <h2 class="text-center" style="margin-bottom:48px">Built for every go-to-market team</h2>
        <div class="mkt-grid mkt-grid-3">
            <a href="/use-cases#sales" class="mkt-card" style="text-decoration:none;color:inherit">
                <h3>For Sales</h3>
                <p>Share interactive demos instantly after discovery calls. Close deals faster.</p>
            </a>
            <a href="/use-cases#marketing" class="mkt-card" style="text-decoration:none;color:inherit">
                <h3>For Marketing</h3>
                <p>Embed product experiences on landing pages and in campaigns. Convert more visitors.</p>
            </a>
            <a href="/use-cases#cs" class="mkt-card" style="text-decoration:none;color:inherit">
                <h3>For Customer Success</h3>
                <p>Self-serve product tours for onboarding and feature adoption. Reduce support tickets.</p>
            </a>
        </div>
    </div>
</section>

@* 7. Metrics / Trust *@
<section class="mkt-section">
    <div class="mkt-container text-center">
        <h2 style="margin-bottom:16px">Trusted infrastructure</h2>
        <p style="max-width:600px;margin:0 auto 32px">NavTour is built on P4 Software's proven multi-tenant platform — the same infrastructure that powers 5,000+ business clients across Latin America and the US.</p>
        <div style="display:flex;gap:48px;justify-content:center;flex-wrap:wrap">
            <div>
                <div style="font-size:2.5rem;font-weight:800;color:var(--nt-primary)">5,000+</div>
                <p class="text-sm">Clients served</p>
            </div>
            <div>
                <div style="font-size:2.5rem;font-weight:800;color:var(--nt-primary)">99.9%</div>
                <p class="text-sm">Uptime SLA</p>
            </div>
            <div>
                <div style="font-size:2.5rem;font-weight:800;color:var(--nt-primary)">SOC 2</div>
                <p class="text-sm">Compliant infrastructure</p>
            </div>
        </div>
    </div>
</section>

@* 8. Pricing Preview *@
<section class="mkt-section-alt">
    <div class="mkt-container text-center">
        <h2 style="margin-bottom:8px">Simple, transparent pricing</h2>
        <p style="margin-bottom:32px">5x cheaper than the industry standard. Start free, upgrade when you're ready.</p>
        <div class="mkt-grid mkt-grid-4">
            <PricingCard Name="Starter" Price="Free" Description="For trying it out"
                Features='new() { "1 seat", "1 demo", "100 views/mo", "Basic capture" }'
                CtaText="Start Free" />
            <PricingCard Name="Pro" Price="$99" Description="For growing teams" Highlighted="true"
                Features='new() { "5 seats", "25 demos", "10K views/mo", "Analytics + API" }'
                CtaText="Start Free" />
            <PricingCard Name="Business" Price="$299" Description="For scaling orgs"
                Features='new() { "15 seats", "Unlimited demos", "50K views/mo", "SSO + Branding" }'
                CtaText="Contact Sales" CtaUrl="/contact" />
            <PricingCard Name="Enterprise" Price="Custom" Description="For large deployments"
                Features='new() { "Unlimited seats", "Unlimited demos", "Unlimited views", "Self-host + SLA" }'
                CtaText="Contact Sales" CtaUrl="/contact" />
        </div>
        <a href="/pricing" style="display:inline-block;margin-top:24px;font-weight:600">See full pricing comparison →</a>
    </div>
</section>

@* 9. Final CTA *@
<CtaSection />
```

- [ ] **Step 2: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 3: Run and test in browser**

Run: `dotnet run --project src/NavTour.Server/NavTour.Server.csproj`
Navigate to `http://localhost:5017/` — should render the full landing page with marketing layout.
Verify: Header, all 10 sections, footer render. No Radzen styles leaking in.

- [ ] **Step 4: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Index.razor
git commit -m "feat: add marketing landing page with hero, features, pricing, CTA sections"
```

---

## Task 6: Features Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/Features.razor`

- [ ] **Step 1: Create Features.razor**

Create `src/NavTour.Server/Pages/Marketing/Features.razor`:

```razor
@page "/features"
@layout MarketingLayout

<PageTitle>Features — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="Capture, annotate, personalize, and analyze interactive product demos. Chrome extension, drag-and-drop builder, full API." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container text-center">
        <h1>Everything you need to build interactive demos</h1>
        <p style="max-width:640px;margin:16px auto 0">From capture to analytics, NavTour gives your team the tools to create demos that convert — without writing a line of code.</p>
    </div>
</section>

@* Alternating feature sections *@
@foreach (var (feature, index) in features.Select((f, i) => (f, i)))
{
    <section class="@(index % 2 == 0 ? "mkt-section" : "mkt-section-alt")">
        <div class="mkt-container">
            <div class="mkt-grid mkt-grid-2" style="align-items:center">
                <div style="@(index % 2 == 1 ? "order:2" : "")">
                    <h2>@feature.Title</h2>
                    <p style="margin-top:12px">@feature.Description</p>
                </div>
                <div class="mkt-placeholder mkt-placeholder-feature" style="@(index % 2 == 1 ? "order:1" : "")">@feature.Title</div>
            </div>
        </div>
    </section>
}

<CtaSection Title="Ready to build your first demo?" Subtitle="Get started in minutes. No credit card required." />

@code {
    private readonly List<(string Title, string Description)> features = new()
    {
        ("Chrome Extension Capture", "Capture your product in clicks, not code. Our Chrome extension takes one-click DOM snapshots, preserving HTML and CSS for fully interactive playback. Works on any web application — SPA, MPA, or static site."),
        ("Visual Demo Builder", "Build interactive walkthroughs with drag-and-drop. Edit captured frames inline, reorder steps, and preview your demo in real time. No engineering required."),
        ("Annotations & Overlays", "Guide prospects step-by-step with tooltips, modals, hotspots, and blur overlays. Click to place, drag to reposition. Add numbered badges and directional arrows for crystal-clear guidance."),
        ("Personalization", "Tailor every demo to every prospect. Use dynamic tokens like {{company}} and {{name}} that resolve via URL parameters. One demo template serves unlimited personalized experiences."),
        ("Lead Capture", "Turn viewers into pipeline. Configure lead gate forms that capture contact information before or during the demo. Export leads or push to your CRM via API."),
        ("Analytics Dashboard", "See exactly how prospects engage. Track session starts, step completion rates, drop-off points, and time-on-step. Identify high-intent accounts from engagement data."),
        ("API-First Architecture", "Automate everything. Every feature is accessible via our REST API — create demos programmatically, trigger events, export data, and integrate with your existing sales and marketing stack."),
        ("Multi-Language Support", "Demos in every language your buyers speak. Native English and Spanish support from day one, with an extensible translation framework for any language.")
    };
}
```

- [ ] **Step 2: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Features.razor
git commit -m "feat: add Features marketing page with alternating sections"
```

---

## Task 7: Use Cases Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/UseCases.razor`

- [ ] **Step 1: Create UseCases.razor**

Create `src/NavTour.Server/Pages/Marketing/UseCases.razor`:

```razor
@page "/use-cases"
@layout MarketingLayout

<PageTitle>Use Cases — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="See how sales, marketing, and customer success teams use NavTour interactive demos to close deals, convert visitors, and onboard customers." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container text-center">
        <h1>Built for every go-to-market team</h1>
        <p style="max-width:640px;margin:16px auto 0">Whether you're closing deals, driving conversions, or onboarding customers — NavTour helps your team deliver product experiences that move the needle.</p>
    </div>
</section>

@* Sales *@
<section class="mkt-section" id="sales">
    <div class="mkt-container">
        <div class="mkt-grid mkt-grid-2" style="align-items:center">
            <div>
                <p style="color:var(--nt-primary);font-weight:600;margin-bottom:8px">For Sales Teams</p>
                <h2>Close deals faster with interactive demos</h2>
                <p style="margin:16px 0">Prospects go cold waiting for live demos. With NavTour, share personalized interactive demos instantly after discovery calls. Every prospect gets a tailored experience with their company name, industry context, and relevant use cases built in.</p>
                <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;margin-top:20px">
                    <li>✓ Personalize demos with prospect details via URL params</li>
                    <li>✓ Capture leads directly from the demo experience</li>
                    <li>✓ Track engagement to prioritize follow-ups</li>
                </ul>
                <a href="/register" class="mkt-btn mkt-btn-primary" style="margin-top:24px">Start Free</a>
            </div>
            <div class="mkt-placeholder mkt-placeholder-feature">Sales Demo Preview</div>
        </div>
    </div>
</section>

@* Marketing *@
<section class="mkt-section-alt" id="marketing">
    <div class="mkt-container">
        <div class="mkt-grid mkt-grid-2" style="align-items:center">
            <div style="order:2">
                <p style="color:var(--nt-primary);font-weight:600;margin-bottom:8px">For Marketing Teams</p>
                <h2>Convert more visitors with embedded demos</h2>
                <p style="margin:16px 0">Website visitors leave without experiencing your product. Embed interactive demos on landing pages, in email campaigns, and across your website. Turn passive browsing into active product engagement.</p>
                <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;margin-top:20px">
                    <li>✓ Capture product screens with the Chrome extension</li>
                    <li>✓ Embed demos anywhere with a simple script tag</li>
                    <li>✓ Track engagement and attribute pipeline to demos</li>
                </ul>
                <a href="/register" class="mkt-btn mkt-btn-primary" style="margin-top:24px">Start Free</a>
            </div>
            <div class="mkt-placeholder mkt-placeholder-feature" style="order:1">Marketing Demo Preview</div>
        </div>
    </div>
</section>

@* Customer Success *@
<section class="mkt-section" id="cs">
    <div class="mkt-container">
        <div class="mkt-grid mkt-grid-2" style="align-items:center">
            <div>
                <p style="color:var(--nt-primary);font-weight:600;margin-bottom:8px">For Customer Success</p>
                <h2>Onboard faster with self-serve product tours</h2>
                <p style="margin:16px 0">Onboarding takes too long and support tickets pile up. Create step-by-step product tours that guide new users through setup, feature adoption, and best practices — without scheduling a single call.</p>
                <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;margin-top:20px">
                    <li>✓ Build guided walkthroughs with tooltips and hotspots</li>
                    <li>✓ Track completion rates to identify stuck users</li>
                    <li>✓ Reduce onboarding time and support volume</li>
                </ul>
                <a href="/register" class="mkt-btn mkt-btn-primary" style="margin-top:24px">Start Free</a>
            </div>
            <div class="mkt-placeholder mkt-placeholder-feature">CS Tour Preview</div>
        </div>
    </div>
</section>

<CtaSection />
```

- [ ] **Step 2: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/UseCases.razor
git commit -m "feat: add Use Cases marketing page — Sales, Marketing, CS personas"
```

---

## Task 8: Pricing Page

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/Pricing.razor`

- [ ] **Step 1: Create Pricing.razor**

Create `src/NavTour.Server/Pages/Marketing/Pricing.razor`:

```razor
@page "/pricing"
@layout MarketingLayout

<PageTitle>Pricing — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="NavTour pricing starts at $0. Pro plans from $99/mo — 5x cheaper than Navattic. Transparent pricing, no hidden fees." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container text-center">
        <h1>Simple, transparent pricing</h1>
        <p style="max-width:560px;margin:16px auto 0">Start free. Upgrade when you're ready. 5x cheaper than the industry standard.</p>
    </div>
</section>

<section class="mkt-section" style="padding-top:0">
    <div class="mkt-container">
        <div class="mkt-grid mkt-grid-4">
            <PricingCard Name="Starter" Price="Free" Description="For trying it out"
                Features='new() { "1 seat", "1 demo", "100 views/mo", "Chrome extension capture", "Basic annotations" }'
                CtaText="Start Free" />
            <PricingCard Name="Pro" Price="$99" Description="For growing teams" Highlighted="true"
                Features='new() { "5 seats", "25 demos", "10K views/mo", "Analytics dashboard", "Full API access", "Lead capture", "Personalization" }'
                CtaText="Start Free" />
            <PricingCard Name="Business" Price="$299" Description="For scaling organizations"
                Features='new() { "15 seats", "Unlimited demos", "50K views/mo", "Everything in Pro", "SSO / SAML", "Custom branding", "Dedicated CSM" }'
                CtaText="Contact Sales" CtaUrl="/contact" />
            <PricingCard Name="Enterprise" Price="Custom" Description="For large deployments"
                Features='new() { "Unlimited seats", "Unlimited demos", "Unlimited views", "Everything in Business", "Self-hosted option", "SLA guarantee", "Professional services" }'
                CtaText="Contact Sales" CtaUrl="/contact" />
        </div>
    </div>
</section>

@* Feature comparison table *@
<section class="mkt-section-alt">
    <div class="mkt-container">
        <h2 class="text-center" style="margin-bottom:32px">Compare plans</h2>
        <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:0.9375rem">
                <thead>
                    <tr style="border-bottom:2px solid var(--nt-border)">
                        <th style="text-align:left;padding:12px 16px;width:40%">Feature</th>
                        <th style="text-align:center;padding:12px 16px">Starter</th>
                        <th style="text-align:center;padding:12px 16px;background:var(--nt-primary-light)">Pro</th>
                        <th style="text-align:center;padding:12px 16px">Business</th>
                        <th style="text-align:center;padding:12px 16px">Enterprise</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach (var row in comparisonRows)
                    {
                        <tr style="border-bottom:1px solid var(--nt-border)">
                            <td style="padding:12px 16px;font-weight:500">@row.Feature</td>
                            <td style="text-align:center;padding:12px 16px">@((MarkupString)FormatCheck(row.Starter))</td>
                            <td style="text-align:center;padding:12px 16px;background:var(--nt-primary-light)">@((MarkupString)FormatCheck(row.Pro))</td>
                            <td style="text-align:center;padding:12px 16px">@((MarkupString)FormatCheck(row.Business))</td>
                            <td style="text-align:center;padding:12px 16px">@((MarkupString)FormatCheck(row.Enterprise))</td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    </div>
</section>

@* FAQ *@
<section class="mkt-section">
    <div class="mkt-container" style="max-width:720px">
        <h2 class="text-center" style="margin-bottom:32px">Frequently asked questions</h2>
        @foreach (var faq in faqs)
        {
            <details style="border-bottom:1px solid var(--nt-border);padding:16px 0">
                <summary style="cursor:pointer;font-weight:600;font-size:1.0625rem">@faq.Q</summary>
                <p style="margin-top:8px">@faq.A</p>
            </details>
        }
    </div>
</section>

<CtaSection />

@code {
    private record ComparisonRow(string Feature, string Starter, string Pro, string Business, string Enterprise);
    private record Faq(string Q, string A);

    private string FormatCheck(string val) => val switch
    {
        "yes" => "<span style='color:var(--nt-success);font-weight:700'>✓</span>",
        "no" => "<span style='color:#cbd5e1'>—</span>",
        _ => val
    };

    private readonly List<ComparisonRow> comparisonRows = new()
    {
        new("Chrome extension capture", "yes", "yes", "yes", "yes"),
        new("Annotations (tooltip, modal, hotspot)", "yes", "yes", "yes", "yes"),
        new("Personalization tokens", "no", "yes", "yes", "yes"),
        new("Analytics dashboard", "no", "yes", "yes", "yes"),
        new("Lead capture forms", "no", "yes", "yes", "yes"),
        new("REST API access", "no", "yes", "yes", "yes"),
        new("Custom branding", "no", "no", "yes", "yes"),
        new("SSO / SAML", "no", "no", "yes", "yes"),
        new("Multi-language demos", "no", "no", "yes", "yes"),
        new("Self-hosted deployment", "no", "no", "no", "yes"),
        new("SLA guarantee", "no", "no", "no", "yes"),
        new("Dedicated CSM", "no", "no", "yes", "yes"),
    };

    private readonly List<Faq> faqs = new()
    {
        new("Can I try NavTour for free?", "Yes! The Starter plan is completely free — no credit card required. You get 1 demo with up to 100 views per month."),
        new("What counts as a 'view'?", "A view is counted each time a unique visitor opens your demo. Repeat visits from the same person within 24 hours count as one view."),
        new("Can I change plans at any time?", "Yes. Upgrade or downgrade at any time. When upgrading, you'll be prorated for the remainder of your billing cycle."),
        new("Do you offer annual billing?", "Yes. Annual billing saves 20% compared to monthly pricing. Contact us for annual plan details."),
        new("What happens if I exceed my view limit?", "Your demos stay live. We'll notify you when you reach 80% of your limit and suggest upgrading. We never cut off your demos mid-month."),
        new("Is there a self-hosted option?", "Yes, for Enterprise customers. You can deploy NavTour on your own infrastructure with full control over data residency and security.")
    };
}
```

- [ ] **Step 2: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/Pricing.razor
git commit -m "feat: add Pricing page with tier cards, comparison table, FAQ"
```

---

## Task 9: About, Blog, Docs, Contact Pages

**Goal:** Build the remaining 4 marketing pages. Blog and Docs are placeholders.

**Files:**
- Create: `src/NavTour.Server/Pages/Marketing/About.razor`
- Create: `src/NavTour.Server/Pages/Marketing/Blog.razor`
- Create: `src/NavTour.Server/Pages/Marketing/DocsSoon.razor`
- Create: `src/NavTour.Server/Pages/Marketing/Contact.razor`

- [ ] **Step 1: Create About.razor**

Create `src/NavTour.Server/Pages/Marketing/About.razor`:

```razor
@page "/about"
@layout MarketingLayout

<PageTitle>About — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="NavTour is built by P4 Software, part of Grupo Barrdega — serving 5,000+ business clients with proven multi-tenant SaaS infrastructure." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container" style="max-width:800px">
        <h1 class="text-center">About NavTour</h1>
        <p class="text-center" style="margin-top:16px;font-size:1.25rem">We believe every B2B company should be able to show their product — not just talk about it.</p>
    </div>
</section>

<section class="mkt-section-alt">
    <div class="mkt-container" style="max-width:800px">
        <h2>Our Mission</h2>
        <p style="margin-top:12px">Interactive demos shouldn't be a luxury. Leading platforms charge $500–$1,000+ per month with rigid annual contracts, putting them out of reach for most teams. NavTour makes interactive product demos accessible to every B2B company — starting free, with Pro plans at $99/month.</p>

        <h2 style="margin-top:48px">Built on Proven Infrastructure</h2>
        <p style="margin-top:12px">NavTour is built by P4 Software, the technology division of Grupo Barrdega. Our multi-tenant SaaS platform already serves 5,000+ business clients across Latin America and the United States. NavTour runs on the same battle-tested infrastructure — the same security standards, the same reliability, the same compliance posture.</p>

        <h2 style="margin-top:48px">Why We Built This</h2>
        <p style="margin-top:12px">We saw our own sales teams struggle with the same problem every B2B company faces: prospects want to experience the product before buying, but live demos are expensive and don't scale. We built NavTour to solve that — first for ourselves, now for everyone.</p>
    </div>
</section>

<CtaSection Title="Join us" Subtitle="Start building interactive demos today." />
```

- [ ] **Step 2: Create Blog.razor (placeholder with newsletter signup)**

Create `src/NavTour.Server/Pages/Marketing/Blog.razor`:

```razor
@page "/blog"
@layout MarketingLayout
@inject IHttpClientFactory HttpClientFactory
@inject NavigationManager NavigationManager

<PageTitle>Blog — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="Product updates, demo best practices, and go-to-market insights from the NavTour team." />
</HeadContent>

<section class="mkt-section" style="min-height:60vh;display:flex;align-items:center">
    <div class="mkt-container text-center">
        <h1>Blog</h1>
        <p style="margin:16px auto 24px;max-width:480px">We're working on content about demo best practices, product updates, and go-to-market strategies.</p>

        @if (subscribed)
        {
            <p style="color:var(--nt-success);font-weight:600">Thanks! We'll notify you when we publish.</p>
        }
        else
        {
            <form method="post" @formname="blog-subscribe" @onsubmit="HandleSubscribe" style="display:inline-flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center">
                <AntiforgeryToken />
                <input type="email" name="SubscribeEmail" value="@SubscribeEmail" required placeholder="Enter your email"
                    style="padding:10px 14px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem;min-width:260px" />
                <button type="submit" class="mkt-btn mkt-btn-primary">Subscribe for Updates</button>
            </form>
        }

        <div style="margin-top:32px">
            <a href="/register" class="mkt-btn mkt-btn-outline">Get Started Instead</a>
        </div>
    </div>
</section>

@code {
    [SupplyParameterFromForm]
    public string SubscribeEmail { get; set; } = "";

    private bool subscribed;

    private async Task HandleSubscribe()
    {
        if (string.IsNullOrWhiteSpace(SubscribeEmail)) return;
        try
        {
            using var http = HttpClientFactory.CreateClient();
            http.BaseAddress = new Uri(NavigationManager.BaseUri);
            await http.PostAsJsonAsync("api/v1/contact", new { email = SubscribeEmail, type = "Newsletter" });
        }
        catch { }
        subscribed = true;
    }
}
```

- [ ] **Step 3: Create DocsSoon.razor (placeholder with newsletter signup)**

Create `src/NavTour.Server/Pages/Marketing/DocsSoon.razor`:

```razor
@page "/docs"
@layout MarketingLayout
@inject IHttpClientFactory HttpClientFactory
@inject NavigationManager NavigationManager

<PageTitle>Documentation — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="NavTour documentation — guides, API reference, and integration tutorials." />
</HeadContent>

<section class="mkt-section" style="min-height:60vh;display:flex;align-items:center">
    <div class="mkt-container text-center">
        <h1>Documentation</h1>
        <p style="margin:16px auto 24px;max-width:480px">Our documentation is coming soon. Subscribe to be notified, or reach out if you need help.</p>

        @if (subscribed)
        {
            <p style="color:var(--nt-success);font-weight:600">Thanks! We'll notify you when docs are ready.</p>
        }
        else
        {
            <form method="post" @formname="docs-subscribe" @onsubmit="HandleSubscribe" style="display:inline-flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center">
                <AntiforgeryToken />
                <input type="email" name="SubscribeEmail" value="@SubscribeEmail" required placeholder="Enter your email"
                    style="padding:10px 14px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem;min-width:260px" />
                <button type="submit" class="mkt-btn mkt-btn-primary">Subscribe for Updates</button>
            </form>
        }

        <div style="margin-top:32px">
            <a href="/contact" class="mkt-btn mkt-btn-outline">Contact Us</a>
        </div>
    </div>
</section>

@code {
    [SupplyParameterFromForm]
    public string SubscribeEmail { get; set; } = "";

    private bool subscribed;

    private async Task HandleSubscribe()
    {
        if (string.IsNullOrWhiteSpace(SubscribeEmail)) return;
        try
        {
            using var http = HttpClientFactory.CreateClient();
            http.BaseAddress = new Uri(NavigationManager.BaseUri);
            await http.PostAsJsonAsync("api/v1/contact", new { email = SubscribeEmail, type = "Newsletter" });
        }
        catch { }
        subscribed = true;
    }
}
```

- [ ] **Step 4: Create Contact.razor**

Create `src/NavTour.Server/Pages/Marketing/Contact.razor`:

```razor
@page "/contact"
@layout MarketingLayout

<PageTitle>Contact — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="Get in touch with the NavTour team. Questions about pricing, demos, or partnerships — we'd love to hear from you." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container" style="max-width:600px">
        <h1 class="text-center">Get in Touch</h1>
        <p class="text-center" style="margin:16px 0 40px">Questions about NavTour? Want to see a live demo? We'd love to hear from you.</p>

        <form method="post" @formname="contact" @onsubmit="HandleSubmit">
            <AntiforgeryToken />
            <div style="display:flex;flex-direction:column;gap:16px">

                @* Honeypot field — hidden from users, bots fill it *@
                <div style="position:absolute;left:-9999px" aria-hidden="true">
                    <input type="text" name="website" @bind="honeypot" tabindex="-1" autocomplete="off" />
                </div>

                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Name *</label>
                    <input type="text" @bind="name" required
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Email *</label>
                    <input type="email" @bind="email" required
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Company</label>
                    <input type="text" @bind="company"
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Message *</label>
                    <textarea @bind="message" required rows="5"
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem;resize:vertical"></textarea>
                </div>

                @if (submitted)
                {
                    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:var(--nt-radius);padding:12px 16px;color:#065f46">
                        Thank you! We'll get back to you shortly.
                    </div>
                }

                <button type="submit" class="mkt-btn mkt-btn-primary" style="width:100%">Send Message</button>
            </div>
        </form>

        <div class="text-center" style="margin-top:40px">
            <p style="font-weight:600">Or email us directly</p>
            <p><a href="mailto:hello@navtour.io">hello@navtour.io</a></p>
        </div>
    </div>
</section>

@code {
    private string name = "";
    private string email = "";
    private string company = "";
    private string message = "";
    private string honeypot = "";
    private bool submitted;

    private async Task HandleSubmit()
    {
        // If honeypot is filled, silently ignore (bot submission)
        if (!string.IsNullOrEmpty(honeypot))
        {
            submitted = true;
            return;
        }

        // TODO: Save to ContactSubmission table via ContactController
        // For now, just show success message
        submitted = true;
    }
}
```

Note: The contact form uses Blazor SSR enhanced form handling (`@formname` + `@onsubmit`). The `HandleSubmit` method is a placeholder — Task 10 will wire it to a backend API. The honeypot field provides basic bot prevention.

- [ ] **Step 5: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/NavTour.Server/Pages/Marketing/
git commit -m "feat: add About, Blog, Docs, Contact marketing pages"
```

---

## Task 10: Contact Form Backend

**Goal:** Add a ContactSubmission entity and API endpoint so the contact form and newsletter signup actually persist data.

**Files:**
- Create: `src/NavTour.Shared/Entities/ContactSubmission.cs`
- Modify: `src/NavTour.Server/Infrastructure/Data/NavTourDbContext.cs` (add DbSet)
- Modify: `src/NavTour.Server/Program.cs` (add `AddHttpClient()`)
- Create: `src/NavTour.Server/Controllers/ContactController.cs`
- Modify: `src/NavTour.Server/Pages/Marketing/Contact.razor` (wire to API with SSR form pattern)

- [ ] **Step 1: Create ContactSubmission entity**

Create `src/NavTour.Shared/Entities/ContactSubmission.cs`:

```csharp
namespace NavTour.Shared.Entities;

public class ContactSubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = "Contact"; // "Contact" or "Newsletter"
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Company { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 2: Add DbSet to NavTourDbContext**

In `src/NavTour.Server/Infrastructure/Data/NavTourDbContext.cs`, add:

```csharp
public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
```

Add the using: `using NavTour.Shared.Entities;` if not already present.

- [ ] **Step 3: Register HttpClient in Program.cs**

In `src/NavTour.Server/Program.cs`, add before `var app = builder.Build();`:

```csharp
builder.Services.AddHttpClient();
```

- [ ] **Step 4: Create and apply migration**

Run:
```bash
cd src/NavTour.Server && dotnet ef migrations add AddContactSubmissions && dotnet ef database update
```

- [ ] **Step 5: Create ContactController**

Create `src/NavTour.Server/Controllers/ContactController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.Entities;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[AllowAnonymous]
public class ContactController(NavTourDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactSubmissionRequest request)
    {
        var submission = new ContactSubmission
        {
            Type = request.Type ?? "Contact",
            Name = request.Name ?? "",
            Email = request.Email,
            Company = request.Company,
            Message = request.Message
        };

        db.ContactSubmissions.Add(submission);
        await db.SaveChangesAsync();

        return Ok(new { message = "Received" });
    }
}

public record ContactSubmissionRequest(
    string Email,
    string? Name = null,
    string? Company = null,
    string? Message = null,
    string? Type = "Contact"
);
```

Note: `[AllowAnonymous]` is required since this endpoint must be accessible to unauthenticated marketing site visitors.

- [ ] **Step 6: Rewrite Contact.razor with SSR-compatible form handling**

The contact page uses static SSR (no render mode), so `@bind` and `@onsubmit` won't work as interactive Blazor patterns. Replace the entire Contact.razor with a form that uses `[SupplyParameterFromForm]` for SSR form model binding:

Replace `src/NavTour.Server/Pages/Marketing/Contact.razor` with:

```razor
@page "/contact"
@layout MarketingLayout
@inject IHttpClientFactory HttpClientFactory
@inject NavigationManager NavigationManager

<PageTitle>Contact — NavTour</PageTitle>
<HeadContent>
    <meta name="description" content="Get in touch with the NavTour team. Questions about pricing, demos, or partnerships — we'd love to hear from you." />
</HeadContent>

<section class="mkt-section">
    <div class="mkt-container" style="max-width:600px">
        <h1 class="text-center">Get in Touch</h1>
        <p class="text-center" style="margin:16px 0 40px">Questions about NavTour? Want to see a live demo? We'd love to hear from you.</p>

        @if (submitted)
        {
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:var(--nt-radius);padding:24px;color:#065f46;text-align:center;margin-bottom:32px">
                <h3 style="color:#065f46">Thank you!</h3>
                <p style="color:#065f46;margin-top:8px">We'll get back to you shortly.</p>
            </div>
        }

        <form method="post" @formname="contact" @onsubmit="HandleSubmit">
            <AntiforgeryToken />
            <div style="display:flex;flex-direction:column;gap:16px">

                @* Honeypot field — hidden from users, bots fill it *@
                <div style="position:absolute;left:-9999px" aria-hidden="true">
                    <input type="text" name="website" @bind="Model.Honeypot" tabindex="-1" autocomplete="off" />
                </div>

                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Name *</label>
                    <input type="text" name="Model.Name" value="@Model.Name" required
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Email *</label>
                    <input type="email" name="Model.Email" value="@Model.Email" required
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Company</label>
                    <input type="text" name="Model.Company" value="@Model.Company"
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem" />
                </div>
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:4px">Message *</label>
                    <textarea name="Model.Message" rows="5" required
                        style="width:100%;padding:10px 12px;border:1px solid var(--nt-border);border-radius:var(--nt-radius);font-size:1rem;resize:vertical">@Model.Message</textarea>
                </div>

                <button type="submit" class="mkt-btn mkt-btn-primary" style="width:100%">Send Message</button>
            </div>
        </form>

        <div class="text-center" style="margin-top:40px">
            <p style="font-weight:600">Or email us directly</p>
            <p><a href="mailto:hello@navtour.io">hello@navtour.io</a></p>
        </div>
    </div>
</section>

@code {
    [SupplyParameterFromForm]
    public ContactFormModel Model { get; set; } = new();

    private bool submitted;

    private async Task HandleSubmit()
    {
        // If honeypot is filled, silently ignore (bot submission)
        if (!string.IsNullOrEmpty(Model.Honeypot))
        {
            submitted = true;
            return;
        }

        try
        {
            using var http = HttpClientFactory.CreateClient();
            http.BaseAddress = new Uri(NavigationManager.BaseUri);
            await http.PostAsJsonAsync("api/v1/contact", new
            {
                name = Model.Name,
                email = Model.Email,
                company = Model.Company,
                message = Model.Message,
                type = "Contact"
            });
        }
        catch { /* Silently fail for MVP — still show success */ }

        submitted = true;
        Model = new(); // Clear form
    }

    public class ContactFormModel
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Company { get; set; } = "";
        public string Message { get; set; } = "";
        public string Honeypot { get; set; } = "";
    }
}
```

Note: This uses `[SupplyParameterFromForm]` which is the Blazor SSR form binding pattern. The form posts back to the same page, Blazor binds the posted form values to `Model`, and `HandleSubmit` fires server-side. No SignalR or WASM required.

- [ ] **Step 7: Build and verify**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/NavTour.Shared/Entities/ContactSubmission.cs src/NavTour.Server/Infrastructure/Data/ src/NavTour.Server/Controllers/ContactController.cs src/NavTour.Server/Pages/Marketing/Contact.razor src/NavTour.Server/Program.cs
git commit -m "feat: add contact form backend — ContactSubmission entity, API endpoint, SSR form"
```

---

## Task 11: Final Integration & Smoke Test

**Goal:** Run the full site, verify all pages render, fix any issues.

- [ ] **Step 1: Build the full solution**

Run: `dotnet build src/NavTour.Server/NavTour.Server.csproj`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Run the app**

Run: `dotnet run --project src/NavTour.Server/NavTour.Server.csproj`

- [ ] **Step 3: Verify all marketing pages**

Navigate and verify each page renders with the marketing layout (header + content + footer):
- `http://localhost:5017/` — Landing page
- `http://localhost:5017/features` — Features page
- `http://localhost:5017/use-cases` — Use Cases page
- `http://localhost:5017/pricing` — Pricing page
- `http://localhost:5017/about` — About page
- `http://localhost:5017/blog` — Blog placeholder
- `http://localhost:5017/docs` — Docs placeholder
- `http://localhost:5017/contact` — Contact page with form

- [ ] **Step 4: Verify app pages still work**

- `http://localhost:5017/dashboard` — Should show Dashboard (login prompt or content)
- `http://localhost:5017/login` — Should show login form
- `http://localhost:5017/register` — Should show registration form

- [ ] **Step 5: Verify mobile responsiveness**

Use browser dev tools to test at 375px width. Verify:
- Hamburger menu appears and toggles
- Grids collapse to single column
- Text is readable, no horizontal overflow

- [ ] **Step 6: Fix any issues found**

Address any build errors, rendering problems, or layout conflicts discovered during testing.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: NavTour public marketing website — landing, features, use cases, pricing, about, contact"
```
