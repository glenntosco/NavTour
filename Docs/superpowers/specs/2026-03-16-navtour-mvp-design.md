# NavTour MVP Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Core MVP Loop (Option A) — end-to-end demo creation, playback, and analytics
**Build Strategy:** Layer-based swarm (6 parallel agents)

---

## 1. Solution Structure

```
D:/V3/Navtour/
├── NavTour.sln
├── src/
│   ├── NavTour.Server/          # ASP.NET Core host (APIs + Blazor SSR)
│   │   ├── Controllers/         # API controllers
│   │   ├── Components/          # Server-rendered Blazor (App.razor)
│   │   ├── Services/            # Domain services
│   │   ├── Infrastructure/      # EF Core, multi-tenant, middleware
│   │   └── Program.cs
│   ├── NavTour.Client/          # Blazor WASM (Builder UI + Player)
│   │   ├── Pages/               # Builder, Player, Dashboard pages
│   │   ├── Components/          # Shared UI components
│   │   ├── Layout/
│   │   └── Services/            # Client-side services (HttpClient wrappers)
│   └── NavTour.Shared/          # Shared models, DTOs, enums
│       ├── Models/
│       ├── DTOs/
│       └── Enums/
```

- Follows P4 pattern: Server + Client split, .NET 10, Radzen Blazor components
- Shared project for models/DTOs/enums to avoid duplication
- No Chrome Extension in MVP scope (frames uploaded manually as HTML file upload)
- **Note:** Product architecture doc references Syncfusion and Minimal APIs; MVP uses Radzen and Controllers to match actual P4 codebase. Architecture doc to be updated post-MVP.

---

## 2. Data Model & Multi-Tenancy

### Core Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Tenant | Id, Name, Slug, Plan, IsActive | Organization account |
| User | Id, TenantId, Email, Role | ASP.NET Identity + TenantId |
| Demo | Id, TenantId, Name, Slug, Status, Settings, Locale | Draft/Published/Archived |
| Frame | Id, DemoId, TenantId, SequenceOrder, HtmlContent, CssContent, ThumbnailUrl | Inline storage for MVP |
| Step | Id, DemoId, TenantId, FrameId, StepNumber, ClickTargetSelector, NavigationAction | Links frames into guided flow |
| Annotation | Id, StepId, TenantId, Type, Title, Content, PositionX/Y, Width, Height, Style | Tooltip/Modal/Hotspot/Blur |
| DemoSession | Id, DemoId, TenantId, ViewerFingerprint, StartedAt, CompletedAt, Source | One viewer playthrough |
| SessionEvent | Id, SessionId, TenantId, EventType, StepNumber, EventData, OccurredAt | Individual interaction |
| Lead | Id, SessionId, TenantId, Email, Name, Company, CustomData | Form submission |
| ApiKey | Id, TenantId, Name, KeyHash, Permissions, IsActive, CreatedAt, LastUsedAt | SHA-256 hashed API keys |

### Concepts: Frame vs. Step

A **Frame** is a captured screen — a static HTML/CSS snapshot of a product page. Frames are reusable assets.

A **Step** is a guided interaction point within a demo flow. Each Step references a Frame it displays, plus a click target and navigation action. Multiple Steps can reference the same Frame (e.g., two different tooltips on the same screen at different points in the flow). A Frame can also exist without any Step (uploaded but not yet sequenced).

Steps define the linear demo flow. Frames are the visual content.

### NavigationAction Enum

```csharp
public enum NavigationAction
{
    NextStep = 0,       // Advance to next step in sequence
    GoToStep = 1,       // Jump to specific step number (StepNumber stored in Step.NavigationTarget)
    PreviousStep = 2,   // Go back one step
    EndDemo = 3,        // Complete the demo (show completion screen or CTA)
    OpenUrl = 4         // Open external URL (URL stored in Step.NavigationTarget)
}
```

`Step` entity gets an additional field: `NavigationTarget` (nullable string) — holds step number for GoToStep or URL for OpenUrl.

### Annotation.Style Format

JSON string with visual configuration:
```json
{
    "backgroundColor": "#1a1a2e",
    "textColor": "#ffffff",
    "borderRadius": "8px",
    "arrowPosition": "top",     // top, bottom, left, right (tooltips only)
    "opacity": 0.7,             // blur regions
    "pulseColor": "#3b82f6"     // hotspots only
}
```

### Frame Storage (MVP)

HTML and CSS stored inline in database columns (`nvarchar(max)`) for MVP simplicity. Migrate to Azure Blob Storage in hardening phase. Thumbnails are **deferred** — the Frame Strip in the Builder shows a generic frame icon with the frame's sequence number. Thumbnail generation (via client-side canvas capture) is a Phase 2 feature.

### Frame Upload Mechanism

Frames are uploaded via `multipart/form-data`:
- User selects an `.html` file via the Builder UI file picker
- API extracts the HTML content and any embedded `<style>` blocks as CSS
- External stylesheet `<link>` tags are preserved as-is (referenced by URL)
- Stored in Frame entity's `HtmlContent` and `CssContent` columns

### Multi-Tenant Pattern

- `TenantId` (Guid) on every entity via base class `TenantEntity`
- `TenantEntity` base: `TenantId`, `CreatedAt`, `ModifiedAt`, `IsDeleted` (soft delete)
- `ITenantProvider` resolves tenant from JWT claim or API key header
- `NavTourDbContext` applies EF Core global query filter: `.HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId)`
- No RLS for MVP — EF global filters sufficient. RLS in hardening phase.

---

## 3. Auth & API Design

### Authentication

- **User auth:** ASP.NET Identity + JWT Bearer tokens. Login returns access + refresh token. JWT contains `TenantId` and `Role` claims.
- **API key auth:** `X-NavTour-Key` header. Keys stored as SHA-256 hash in DB, scoped to TenantId. Middleware resolves tenant from either JWT or API key.
- **Roles:** Owner, Admin, Editor, Viewer (enum)

### API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | POST `/api/v1/auth/register` (creates tenant + user), POST `/api/v1/auth/login`, POST `/api/v1/auth/refresh` |
| Demos | CRUD on `/api/v1/demos`, POST `/api/v1/demos/{id}/publish` |
| Frames | POST `/api/v1/demos/{id}/frames`, GET/PUT/DELETE individual frames, PUT reorder |
| Steps | PUT `/api/v1/demos/{id}/steps` (bulk update sequence + annotations) |
| Annotations | CRUD on `/api/v1/steps/{id}/annotations` |
| Analytics | GET `/api/v1/demos/{id}/analytics`, GET `/api/v1/analytics/sessions`, POST `/api/v1/player/{slug}/events` |
| Leads | GET `/api/v1/leads`, POST `/api/v1/player/{slug}/leads` |

| Player | GET `/api/v1/player/{slug}/manifest` (public demo manifest for player) |

- Player endpoints (`/api/v1/player/...`) are unauthenticated (public demos + event ingestion)
- All other endpoints require JWT or API key auth
- Traditional controller pattern (matching P4 convention)
- Demos group includes: GET list, GET by id, POST create, PUT update, DELETE (soft), POST publish
- Frames group includes: GET `/api/v1/demos/{id}/frames` (list all), GET/PUT/DELETE by frame id, PUT reorder
- Steps group includes: GET `/api/v1/demos/{id}/steps` (list all), PUT bulk update

---

## 4. Demo Builder UI

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Demo list with stats cards, create new demo |
| DemoEditor | `/demos/{id}/edit` | Main builder workspace |
| DemoSettings | `/demos/{id}/settings` | Name, slug, branding, locale |
| Analytics | `/demos/{id}/analytics` | Per-demo engagement dashboard |
| LeadsList | `/leads` | Table of captured leads |
| Login/Register | `/login`, `/register` | Auth pages |

### DemoEditor Layout

```
┌─────────────────────────────────────────────────┐
│  Toolbar: Save | Preview | Publish | Settings   │
├──────────┬──────────────────────────┬───────────┤
│  Frame   │   Frame Preview          │  Step     │
│  Strip   │   (sandboxed iframe)     │  Panel    │
│  [F1]    │                          │  - Click  │
│  [F2]    │   ← annotations overlay  │    target │
│  [F3] ←  │                          │  - Nav    │
│  [F4]    │                          │    action │
│  [+Add]  │                          │  - Anno-  │
│  drag to │                          │    tations│
│  reorder │                          │  [+Add]   │
└──────────┴──────────────────────────┴───────────┘
```

- **Frame Strip** (left): Thumbnails, drag-to-reorder, add frame via HTML upload
- **Frame Preview** (center): Sandboxed iframe rendering, annotation overlays on top, click-to-place annotations
- **Step Panel** (right): Click target selector, navigation action config, annotation list with CRUD
- **Annotation types:** Tooltip, Modal, Hotspot, Blur

---

## 5. Demo Player

**Route:** `/demo/{slug}` (public, no auth)

### Player Flow

1. Loads demo manifest from `/api/v1/player/{slug}/manifest`
2. Renders current frame HTML/CSS in sandboxed iframe (`sandbox="allow-same-origin"`)
3. Overlay layer renders annotations positioned over iframe
4. Click handlers detect target matches → navigate to next step/frame
5. Progress bar shows step N of M
6. Optional lead capture form gate (before demo, after step N, or at end)

### Player UI

```
┌─────────────────────────────────────────────┐
│  NavTour · Demo Title         [1/8] [→] [✕] │
├─────────────────────────────────────────────┤
│   ┌─────────────────────────────────┐       │
│   │   Sandboxed iframe              │       │
│   │   (captured HTML/CSS)           │       │
│   │                    ┌──────────┐ │       │
│   │                    │ Tooltip  │ │       │
│   │                    └──────────┘ │       │
│   │         ◉ hotspot               │       │
│   └─────────────────────────────────┘       │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  Step 3/8       │
│  [← Back]                    [Next →]       │
└─────────────────────────────────────────────┘
```

- Responsive iframe scaling
- Keyboard nav (arrow keys)
- Events fire to analytics endpoint (debounced, fire-and-forget, `navigator.sendBeacon` on unload)

---

## 6. Analytics Engine

### Event Ingestion

- Player POSTs to `/api/v1/player/{slug}/events` (unauthenticated, rate-limited by IP)
- Client-side batching (flush every 5s or on unload)
- Direct DB writes for MVP (Service Bus queuing added later)

### Events Tracked

| EventType | Trigger | Data |
|-----------|---------|------|
| DemoStarted | Player loads | Source URL, UTM params, user agent, referrer |
| StepViewed | Step becomes active | Step number, timestamp |
| StepCompleted | User advances | Step number, time on step (ms) |
| DemoCompleted | Final step reached | Total time, completion path |
| DropOff | Tab closed / nav away | Last step, time before exit |
| CtaClicked | CTA button clicked | CTA type, step context |
| LeadSubmitted | Form submitted | Lead ID reference |

### Dashboard Widgets (Radzen Charts)

| Widget | Visualization |
|--------|--------------|
| Views / Completions / Avg Time | Stat cards |
| Views over time | Line chart (30 days) |
| Completion funnel | Bar chart (step drop-off) |
| Top sources | Table (referrer, UTM) |
| Recent sessions | Table (step count, duration, completed) |
| Leads | Count + link to leads list |

### Session Identification

Fingerprint hash of IP + User Agent + demo ID. Same viewer within 30 min = same session.

---

## 7. Swarm Build Strategy

### Agent Assignments

| Agent | Scope | Files Owned |
|-------|-------|-------------|
| 1: Foundation | Solution scaffold, .csproj files, EF Core DbContext, entities, migrations, multi-tenant infrastructure, base classes, Program.cs | `*.sln`, `*.csproj`, `Infrastructure/`, `NavTour.Shared/` |
| 2: Auth | ASP.NET Identity setup, JWT config, API key middleware, AuthController, tenant provisioning | `Controllers/AuthController.cs`, auth services, Identity config |
| 3: Demo API | Demo/Frame/Step/Annotation controllers + services + DTOs | `Controllers/Demo*.cs`, `Controllers/Frame*.cs`, etc. |
| 4: Builder UI | All Blazor pages for demo management (Dashboard, Editor, Settings, Login) | `Client/Pages/`, `Client/Components/`, `Client/Layout/` |
| 5: Player | Demo Player WASM component, manifest endpoint, overlay rendering | `Client/Pages/Player/`, player services |
| 6: Analytics | Event ingestion endpoint, session management, analytics queries, dashboard page | `Controllers/AnalyticsController.cs`, analytics services, dashboard page |

### Dependency Chain

```
Agent 1 (Foundation) ──→ Agents 2, 3, 4, 5, 6 (all in parallel)
```

Agent 1 completes first. Agents 2-6 launch simultaneously after.

---

## 8. Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| .NET | 10.0 | P4 platform standard |
| Blazor | SSR + WASM hybrid | P4 pattern (InteractiveAuto) |
| UI Components | Radzen Blazor | P4 standard (not Syncfusion) |
| Database | SQL Server LocalDB | Dev environment; Azure SQL later |
| ORM | EF Core 10 | Global query filters for multi-tenancy |
| Auth | ASP.NET Identity + JWT | Standard, battle-tested |
| API Style | Controllers | P4 convention |

---

## 9. DTO Contracts

All DTOs live in `NavTour.Shared/DTOs/`. These are the agreed contracts between agents.

### Auth DTOs

```csharp
public record RegisterRequest(string Email, string Password, string CompanyName, string FullName);
public record LoginRequest(string Email, string Password);
public record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, Guid TenantId);
public record RefreshRequest(string RefreshToken);
```

### Demo DTOs

```csharp
public record CreateDemoRequest(string Name, string? Description, string Locale = "en");
public record UpdateDemoRequest(string? Name, string? Description, string? Locale, string? Settings);
public record DemoResponse(Guid Id, string Name, string Slug, string? Description, DemoStatus Status, string Locale, string? Settings, long ViewCount, DateTime CreatedAt);
public record DemoListItemResponse(Guid Id, string Name, string Slug, DemoStatus Status, long ViewCount, int FrameCount, int StepCount, DateTime CreatedAt);
```

### Frame DTOs

```csharp
// Upload: multipart/form-data with IFormFile
public record FrameResponse(Guid Id, int SequenceOrder, string? ThumbnailUrl, DateTime CreatedAt);
public record FrameDetailResponse(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent, DateTime CreatedAt);
public record ReorderFramesRequest(List<Guid> FrameIdsInOrder);
```

### Step DTOs

```csharp
public record StepDto(Guid? Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<AnnotationDto> Annotations);
public record UpdateStepsRequest(List<StepDto> Steps);  // Bulk replace all steps for a demo
public record StepResponse(Guid Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<AnnotationResponse> Annotations);
```

### Annotation DTOs

```csharp
public record AnnotationDto(Guid? Id, AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
public record CreateAnnotationRequest(AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
public record AnnotationResponse(Guid Id, AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
```

### Player DTOs

```csharp
public record PlayerManifestResponse(
    string DemoName,
    string Slug,
    string? Settings,          // JSON: branding, CTA config, lead gate config
    List<PlayerFrameDto> Frames,
    List<PlayerStepDto> Steps
);

public record PlayerFrameDto(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent);

public record PlayerStepDto(
    Guid Id,
    Guid FrameId,
    int StepNumber,
    string? ClickTargetSelector,
    NavigationAction NavigationAction,
    string? NavigationTarget,
    List<PlayerAnnotationDto> Annotations
);

public record PlayerAnnotationDto(AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
```

### Analytics DTOs

```csharp
public record EventBatchRequest(Guid? SessionId, string? ViewerFingerprint, List<SessionEventDto> Events);
public record SessionEventDto(EventType EventType, int? StepNumber, string? EventData, DateTime OccurredAt);
public record EventBatchResponse(Guid SessionId);  // Returns session ID for subsequent batches

public record AnalyticsSummaryResponse(long TotalViews, long Completions, double AvgTimeSeconds, double CompletionRate, List<DailyViewCount> ViewsOverTime, List<StepFunnelEntry> Funnel, List<SourceEntry> TopSources);
public record DailyViewCount(DateTime Date, int Count);
public record StepFunnelEntry(int StepNumber, int ViewCount, int CompletionCount);
public record SourceEntry(string Source, int Count);

public record SessionListResponse(Guid Id, DateTime StartedAt, DateTime? CompletedAt, int StepsViewed, int TotalSteps, bool Completed, string? Source);
```

### Lead DTOs

```csharp
public record LeadCaptureRequest(string Email, string? Name, string? Company, string? CustomData);
public record LeadResponse(Guid Id, string Email, string? Name, string? Company, string? CustomData, Guid DemoId, string DemoName, DateTime CapturedAt);
```

### Enums

```csharp
public enum DemoStatus { Draft = 0, Published = 1, Archived = 2 }
public enum AnnotationType { Tooltip = 0, Modal = 1, Hotspot = 2, Blur = 3 }
public enum EventType { DemoStarted = 1, StepViewed = 2, StepCompleted = 3, DemoCompleted = 4, DropOff = 5, CtaClicked = 6, LeadSubmitted = 7 }
public enum UserRole { Owner = 0, Admin = 1, Editor = 2, Viewer = 3 }
public enum NavigationAction { NextStep = 0, GoToStep = 1, PreviousStep = 2, EndDemo = 3, OpenUrl = 4 }
```

---

## 10. Database Seeding & Migration Strategy

- EF Core migrations applied automatically on startup (`context.Database.Migrate()` in `Program.cs`)
- `DbSeeder` runs after migration and creates:
  - **Default tenant:** "NavTour Demo" (slug: `navtour-demo`)
  - **Admin user:** `admin@navtour.io` / `NavTour123!` (Owner role)
  - **Sample demo:** "Product Tour Example" with 3 frames (simple HTML pages), 3 steps with tooltips, published status
- Seeder only runs if the Tenants table is empty (idempotent)
- Connection string: SQL Server LocalDB for development (`Server=(localdb)\\mssqllocaldb;Database=NavTour;Trusted_Connection=true`)
