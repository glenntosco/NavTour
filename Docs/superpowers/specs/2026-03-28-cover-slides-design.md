# Cover Slides & Chapter System — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Phase:** 5 of NavTour Rebuild

## Overview

Add a chapter/cover slide system to NavTour. Cover slides are special steps (no HTML frame) that display branded welcome/closing screens in the player. Every new demo auto-generates an opening CoverSlide and a closing ClosingSlide. Settings are stored as JSON on the Step entity — no new tables.

## Data Model

### New Enum: `StepType`

```csharp
public enum StepType { Content, CoverSlide, ClosingSlide }
```

### Step Entity Changes

Add to `Step.cs`:
```csharp
public StepType Type { get; set; } = StepType.Content;
public string? ChapterSettings { get; set; }  // JSON, null for Content steps
```

### ChapterSettings JSON Schema

```json
{
  "layout": "center",
  "theme": "dark",
  "title": "Welcome to ProductName",
  "description": "Learn how to use the dashboard in this interactive walkthrough.",
  "ctaText": "Get Started",
  "ctaAction": "next",
  "ctaUrl": null,
  "showLogo": true,
  "logoUrl": null,
  "backgroundType": "frame",
  "backgroundUrl": null,
  "backdropOpacity": 60
}
```

| Field | Type | Values | Default |
|-------|------|--------|---------|
| layout | string | `left`, `center`, `right` | `center` |
| theme | string | `dark`, `light` | `dark` |
| title | string | any | Demo name (cover) / "Enjoyed the demo?" (closing) |
| description | string | any | Auto-generated from step count |
| ctaText | string | any | "Get Started" (cover) / "Learn More" (closing) |
| ctaAction | string | `next`, `url` | `next` |
| ctaUrl | string? | URL | null |
| showLogo | bool | | true |
| logoUrl | string? | URL to uploaded image | null (uses favicon) |
| backgroundType | string | `none`, `frame`, `custom` | `frame` |
| backgroundUrl | string? | URL to custom image | null |
| backdropOpacity | int | 0-100 | 60 |

### Strongly-Typed DTO

```csharp
public class ChapterSettings
{
    public string Layout { get; set; } = "center";
    public string Theme { get; set; } = "dark";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string CtaText { get; set; } = "Get Started";
    public string CtaAction { get; set; } = "next";
    public string? CtaUrl { get; set; }
    public bool ShowLogo { get; set; } = true;
    public string? LogoUrl { get; set; }
    public string BackgroundType { get; set; } = "frame";
    public string? BackgroundUrl { get; set; }
    public int BackdropOpacity { get; set; } = 60;
}
```

## Auto-Generation

On demo creation (`DemoService.CreateDemoAsync`), auto-create two steps:

**Step 1 (CoverSlide):**
- StepNumber: 1
- Type: CoverSlide
- FrameId: null (or first frame if available)
- ChapterSettings: `{ layout: "center", theme: "dark", title: "{demoName}", description: "{stepCount} steps · Interactive product demo", ctaText: "Get Started", ctaAction: "next", showLogo: true, backgroundType: "frame", backdropOpacity: 60 }`

**Step N (ClosingSlide):**
- StepNumber: last
- Type: ClosingSlide
- FrameId: null
- ChapterSettings: `{ layout: "center", theme: "dark", title: "Enjoyed the demo?", description: "Learn more about our features on our website.", ctaText: "Learn More", ctaAction: "next", showLogo: true, backgroundType: "none", backdropOpacity: 60 }`

## Editor Changes

### StepPanel.razor

- Cover/Closing steps get distinct visual treatment:
  - Accent-colored left border instead of regular style
  - Icon badge (slides icon for cover, flag icon for closing) instead of step number
  - Label: "Cover Slide" / "Closing Slide"
- Clicking a chapter step opens `ChapterSettingsPanel` in the right drawer (instead of regular step settings)
- "Add Cover Slide" button shown if no CoverSlide step exists
- "Add Closing Slide" button shown if no ClosingSlide step exists
- Chapter steps cannot be reordered to the middle — cover stays first, closing stays last

### New: ChapterSettingsPanel.razor

Right drawer panel shown when a chapter step is selected:

- **Layout** — 3 segmented buttons: Left | Center | Right
- **Theme** — 2 segmented buttons: Dark | Light
- **Title** — text input
- **Description** — textarea (2-3 lines)
- **CTA Button Text** — text input
- **CTA Action** — dropdown: Next Step | Open URL
- **CTA URL** — text input (shown only when action is "url")
- **Logo** — toggle (show/hide) + file upload button
- **Background** — dropdown: None | First Frame | Custom Image
- **Custom Image URL** — text input (shown only when background is "custom")
- **Backdrop Opacity** — range slider 0-100, with value label
- **Save** — button at bottom

All settings serialized to `ChapterSettings` JSON and saved via step update API.

### DemoEditor.razor

When a chapter step is selected:
- Canvas area shows a live preview of the cover slide using `CoverSlideRenderer` component
- No iframe, no element toolbar, no find & replace
- The `activeDrawer` switches to "chapter" to show `ChapterSettingsPanel`

### DemoSettings.razor

Remove the "Welcome Screen" section (lines 40-66) — replaced by cover slide step settings.

## Player Changes

### Player.razor

When `currentStep.Type` is `CoverSlide` or `ClosingSlide`:
- Do NOT render iframe
- Do NOT set up triggers, spotlight, or annotations
- Render `CoverSlideRenderer` inside the `player-scale-wrapper` instead
- CTA click calls `NextStep()` (or opens URL)
- Remove the old `start-overlay` div and all `showWelcomeScreen` / `GetWelcomeTitle()` / `GetWelcomeSubtitle()` / `GetWelcomeButtonText()` code

### New: CoverSlideRenderer.razor

Renders a cover slide inside a container. Used by both the player (live) and editor (preview).

**Parameters:**
- `ChapterSettings Settings` — the parsed settings object
- `string? FrameScreenshotUrl` — URL for "frame" background type
- `string FaviconUrl` — default logo fallback
- `int TotalSteps` — for time estimate badge
- `EventCallback OnCtaClick` — CTA button handler

**Rendering:**
- Full-size container (fills parent)
- Background layer: solid color (dark/light based on theme) with optional image + opacity
- Text card positioned by layout (left/center/right):
  - Logo (if showLogo)
  - Title (h2, bold)
  - Description (1-2 lines)
  - Time estimate badge: "{N} steps · Interactive demo" (auto-calculated)
  - CTA button
- Dark theme: dark overlay, white text, accent CTA button
- Light theme: light overlay, dark text, accent CTA button

**CSS:** Scoped styles using `var(--nt-*)` design tokens. Premium feel — subtle shadows, smooth entrance animation.

## DTO Changes

### PlayerStepDto

Add: `StepType Type`, `string? ChapterSettings`

### StepResponse

Add: `StepType Type`, `string? ChapterSettings`

### CreateStepRequest / UpdateStepRequest

Add: `StepType? Type`, `string? ChapterSettings`

## Migration

EF Core migration adding:
- `Type` (int, default 0 = Content) to Steps table
- `ChapterSettings` (nvarchar(max), nullable) to Steps table

## New Files

| File | Purpose |
|------|---------|
| `src/NavTour.Shared/Enums/StepType.cs` | StepType enum |
| `src/NavTour.Shared/DTOs/ChapterSettings.cs` | Strongly-typed settings class |
| `src/NavTour.Client/Components/ChapterSettingsPanel.razor` | Editor settings panel |
| `src/NavTour.Client/Components/CoverSlideRenderer.razor` | Cover slide renderer (player + editor) |

## Modified Files

| File | Change |
|------|--------|
| `src/NavTour.Shared/Models/Step.cs` | Add Type, ChapterSettings |
| `src/NavTour.Shared/DTOs/Player/PlayerStepDto.cs` | Add Type, ChapterSettings |
| `src/NavTour.Shared/DTOs/Steps/StepResponse.cs` | Add Type, ChapterSettings |
| `src/NavTour.Shared/DTOs/Steps/CreateStepRequest.cs` | Add Type, ChapterSettings |
| `src/NavTour.Shared/DTOs/Steps/UpdateStepRequest.cs` | Add Type, ChapterSettings |
| `src/NavTour.Server/Services/DemoService.cs` | Auto-create cover+closing steps |
| `src/NavTour.Server/Services/PlayerService.cs` | Map Type+ChapterSettings to manifest |
| `src/NavTour.Client/Pages/Player.razor` | Render CoverSlideRenderer for chapter steps, remove old welcome overlay |
| `src/NavTour.Client/Pages/DemoEditor.razor` | Show cover preview + chapter drawer for chapter steps |
| `src/NavTour.Client/Components/StepPanel.razor` | Chapter step visual treatment, add chapter buttons |
| `src/NavTour.Client/Pages/DemoSettings.razor` | Remove welcome screen section |
| EF Migration | New columns |

## What's Deferred

- Form chapter type (lead capture)
- Embed chapter type (Calendly, iframe)
- Password-gated chapter type
- Video intro / AI avatar
- Social proof chapter type
- Custom fonts on cover slide
- Multiple CTA buttons
- Browser chrome frame toggle
- Gradient overlay option
