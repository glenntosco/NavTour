# NavTour MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the NavTour interactive demo platform MVP — demo creation, playback, and analytics — as a .NET 10 Blazor application with multi-tenant architecture.

**Architecture:** Layered architecture with Server (ASP.NET Core APIs + Blazor SSR host), Client (Blazor WASM for Builder UI + Player), and Shared (models, DTOs, enums). Multi-tenancy via EF Core global query filters with TenantId on every entity. Traditional controller pattern matching P4 Software conventions.

**Tech Stack:** .NET 10, Blazor SSR+WASM hybrid, Radzen Blazor components, EF Core 10, SQL Server LocalDB, ASP.NET Identity + JWT, C# 13

**Spec:** `docs/superpowers/specs/2026-03-16-navtour-mvp-design.md`

---

## File Structure

```
D:/V3/Navtour/
├── NavTour.sln
├── src/
│   ├── NavTour.Shared/
│   │   ├── NavTour.Shared.csproj
│   │   ├── Models/
│   │   │   ├── TenantEntity.cs            # Base class: Id, TenantId, CreatedAt, ModifiedAt, IsDeleted
│   │   │   ├── Tenant.cs
│   │   │   ├── Demo.cs
│   │   │   ├── Frame.cs
│   │   │   ├── Step.cs
│   │   │   ├── Annotation.cs
│   │   │   ├── DemoSession.cs
│   │   │   ├── SessionEvent.cs
│   │   │   ├── Lead.cs
│   │   │   └── ApiKey.cs
│   │   ├── DTOs/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterRequest.cs
│   │   │   │   ├── LoginRequest.cs
│   │   │   │   ├── LoginResponse.cs
│   │   │   │   └── RefreshRequest.cs
│   │   │   ├── Demos/
│   │   │   │   ├── CreateDemoRequest.cs
│   │   │   │   ├── UpdateDemoRequest.cs
│   │   │   │   ├── DemoResponse.cs
│   │   │   │   └── DemoListItemResponse.cs
│   │   │   ├── Frames/
│   │   │   │   ├── FrameResponse.cs
│   │   │   │   ├── FrameDetailResponse.cs
│   │   │   │   └── ReorderFramesRequest.cs
│   │   │   ├── Steps/
│   │   │   │   ├── StepDto.cs
│   │   │   │   ├── UpdateStepsRequest.cs
│   │   │   │   └── StepResponse.cs
│   │   │   ├── Annotations/
│   │   │   │   ├── AnnotationDto.cs
│   │   │   │   ├── CreateAnnotationRequest.cs
│   │   │   │   └── AnnotationResponse.cs
│   │   │   ├── Player/
│   │   │   │   ├── PlayerManifestResponse.cs
│   │   │   │   ├── PlayerFrameDto.cs
│   │   │   │   ├── PlayerStepDto.cs
│   │   │   │   └── PlayerAnnotationDto.cs
│   │   │   ├── Analytics/
│   │   │   │   ├── EventBatchRequest.cs
│   │   │   │   ├── SessionEventDto.cs
│   │   │   │   ├── EventBatchResponse.cs
│   │   │   │   ├── AnalyticsSummaryResponse.cs
│   │   │   │   └── SessionListResponse.cs
│   │   │   └── Leads/
│   │   │       ├── LeadCaptureRequest.cs
│   │   │       └── LeadResponse.cs
│   │   └── Enums/
│   │       ├── DemoStatus.cs
│   │       ├── AnnotationType.cs
│   │       ├── EventType.cs
│   │       ├── UserRole.cs
│   │       └── NavigationAction.cs
│   ├── NavTour.Server/
│   │   ├── NavTour.Server.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Properties/launchSettings.json
│   │   ├── Infrastructure/
│   │   │   ├── Data/
│   │   │   │   ├── NavTourDbContext.cs
│   │   │   │   └── DbSeeder.cs
│   │   │   ├── MultiTenancy/
│   │   │   │   ├── ITenantProvider.cs
│   │   │   │   └── TenantProvider.cs
│   │   │   └── Auth/
│   │   │       ├── ApiKeyMiddleware.cs
│   │   │       ├── JwtTokenService.cs
│   │   │       └── ApplicationUser.cs
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── DemosController.cs
│   │   │   ├── FramesController.cs
│   │   │   ├── StepsController.cs
│   │   │   ├── AnnotationsController.cs
│   │   │   ├── PlayerController.cs
│   │   │   ├── AnalyticsController.cs
│   │   │   └── LeadsController.cs
│   │   ├── Services/
│   │   │   ├── IDemoService.cs / DemoService.cs
│   │   │   ├── IFrameService.cs / FrameService.cs
│   │   │   ├── IStepService.cs / StepService.cs
│   │   │   ├── IAnnotationService.cs / AnnotationService.cs
│   │   │   ├── IPlayerService.cs / PlayerService.cs
│   │   │   ├── IAnalyticsService.cs / AnalyticsService.cs
│   │   │   └── ILeadService.cs / LeadService.cs
│   │   ├── Components/
│   │   │   ├── App.razor
│   │   │   ├── Routes.razor
│   │   │   └── _Imports.razor
│   │   └── wwwroot/
│   └── NavTour.Client/
│       ├── NavTour.Client.csproj
│       ├── Program.cs
│       ├── Routes.razor
│       ├── _Imports.razor
│       ├── Layout/
│       │   └── MainLayout.razor
│       ├── Pages/
│       │   ├── Login.razor
│       │   ├── Register.razor
│       │   ├── Dashboard.razor
│       │   ├── DemoEditor.razor
│       │   ├── DemoSettings.razor
│       │   ├── DemoAnalytics.razor
│       │   ├── LeadsList.razor
│       │   └── Player.razor
│       ├── Components/
│       │   ├── FrameStrip.razor
│       │   ├── FramePreview.razor
│       │   ├── StepPanel.razor
│       │   ├── AnnotationOverlay.razor
│       │   ├── PlayerOverlay.razor
│       │   └── LeadCaptureForm.razor
│       └── Services/
│           ├── AuthService.cs
│           ├── DemoApiService.cs
│           ├── PlayerApiService.cs
│           └── AnalyticsApiService.cs
```

---

## Chunk 1: Task 1 — Foundation (Agent 1)

### Task 1: Solution Scaffold, Shared Library, Entities, DbContext, Multi-Tenancy, Seeding

**Owner:** Agent 1 (Foundation)
**Blocks:** Tasks 2, 3, 4, 5, 6

**Files to create:**
- `NavTour.sln`
- `src/NavTour.Shared/NavTour.Shared.csproj`
- `src/NavTour.Shared/Enums/*.cs` (all 5 enums)
- `src/NavTour.Shared/Models/*.cs` (all 10 entities)
- `src/NavTour.Shared/DTOs/**/*.cs` (all DTOs)
- `src/NavTour.Server/NavTour.Server.csproj`
- `src/NavTour.Server/Program.cs`
- `src/NavTour.Server/appsettings.json`
- `src/NavTour.Server/appsettings.Development.json`
- `src/NavTour.Server/Properties/launchSettings.json`
- `src/NavTour.Server/Infrastructure/Data/NavTourDbContext.cs`
- `src/NavTour.Server/Infrastructure/Data/DbSeeder.cs`
- `src/NavTour.Server/Infrastructure/MultiTenancy/ITenantProvider.cs`
- `src/NavTour.Server/Infrastructure/MultiTenancy/TenantProvider.cs`
- `src/NavTour.Server/Infrastructure/Auth/ApplicationUser.cs`
- `src/NavTour.Server/Components/App.razor`
- `src/NavTour.Server/Components/Routes.razor`
- `src/NavTour.Server/Components/_Imports.razor`
- `src/NavTour.Client/NavTour.Client.csproj`
- `src/NavTour.Client/Program.cs`
- `src/NavTour.Client/Routes.razor`
- `src/NavTour.Client/_Imports.razor`
- `src/NavTour.Client/Layout/MainLayout.razor`
- `src/NavTour.Client/Pages/Index.razor` (placeholder home)

---

- [ ] **Step 1: Create solution and project files**

Create `NavTour.sln` with three projects. Use `dotnet` CLI:

```bash
cd D:/V3/Navtour
dotnet new sln -n NavTour
mkdir -p src/NavTour.Shared src/NavTour.Server src/NavTour.Client

# Shared class library
cd src/NavTour.Shared
dotnet new classlib -n NavTour.Shared --framework net10.0
rm Class1.cs  # remove default

# Server (Blazor Web App)
cd ../NavTour.Server
dotnet new blazor -n NavTour.Server --framework net10.0 --interactivity Auto --empty

# Client (Blazor WASM)
cd ../NavTour.Client
dotnet new blazorwasm -n NavTour.Client --framework net10.0 --empty

# Add projects to solution
cd D:/V3/Navtour
dotnet sln add src/NavTour.Shared/NavTour.Shared.csproj
dotnet sln add src/NavTour.Server/NavTour.Server.csproj
dotnet sln add src/NavTour.Client/NavTour.Client.csproj

# Add references
dotnet add src/NavTour.Server/NavTour.Server.csproj reference src/NavTour.Shared/NavTour.Shared.csproj
dotnet add src/NavTour.Server/NavTour.Server.csproj reference src/NavTour.Client/NavTour.Client.csproj
dotnet add src/NavTour.Client/NavTour.Client.csproj reference src/NavTour.Shared/NavTour.Shared.csproj
```

- [ ] **Step 2: Install NuGet packages**

```bash
# Server packages
cd D:/V3/Navtour/src/NavTour.Server
dotnet add package Radzen.Blazor
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt

# Client packages
cd ../NavTour.Client
dotnet add package Radzen.Blazor
dotnet add package Microsoft.AspNetCore.Components.WebAssembly.Authentication
dotnet add package Microsoft.Extensions.Http
```

- [ ] **Step 3: Create all enums**

Create `src/NavTour.Shared/Enums/` directory with these files:

`DemoStatus.cs`:
```csharp
namespace NavTour.Shared.Enums;

public enum DemoStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}
```

`AnnotationType.cs`:
```csharp
namespace NavTour.Shared.Enums;

public enum AnnotationType
{
    Tooltip = 0,
    Modal = 1,
    Hotspot = 2,
    Blur = 3
}
```

`EventType.cs`:
```csharp
namespace NavTour.Shared.Enums;

public enum EventType
{
    DemoStarted = 1,
    StepViewed = 2,
    StepCompleted = 3,
    DemoCompleted = 4,
    DropOff = 5,
    CtaClicked = 6,
    LeadSubmitted = 7
}
```

`UserRole.cs`:
```csharp
namespace NavTour.Shared.Enums;

public enum UserRole
{
    Owner = 0,
    Admin = 1,
    Editor = 2,
    Viewer = 3
}
```

`NavigationAction.cs`:
```csharp
namespace NavTour.Shared.Enums;

public enum NavigationAction
{
    NextStep = 0,
    GoToStep = 1,
    PreviousStep = 2,
    EndDemo = 3,
    OpenUrl = 4
}
```

- [ ] **Step 4: Create base entity and all model classes**

`src/NavTour.Shared/Models/TenantEntity.cs`:
```csharp
namespace NavTour.Shared.Models;

public abstract class TenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
    public bool IsDeleted { get; set; }
}
```

`src/NavTour.Shared/Models/Tenant.cs`:
```csharp
using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "Starter";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

`src/NavTour.Shared/Models/Demo.cs`:
```csharp
using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Demo : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DemoStatus Status { get; set; } = DemoStatus.Draft;
    public string? Settings { get; set; }
    public string Locale { get; set; } = "en";
    public long ViewCount { get; set; }
    public Guid CreatedBy { get; set; }

    public List<Frame> Frames { get; set; } = [];
    public List<Step> Steps { get; set; } = [];
    public List<DemoSession> Sessions { get; set; } = [];
}
```

`src/NavTour.Shared/Models/Frame.cs`:
```csharp
namespace NavTour.Shared.Models;

public class Frame : TenantEntity
{
    public Guid DemoId { get; set; }
    public int SequenceOrder { get; set; }
    public string HtmlContent { get; set; } = string.Empty;
    public string? CssContent { get; set; }
    public string? ThumbnailUrl { get; set; }

    public Demo Demo { get; set; } = null!;
}
```

`src/NavTour.Shared/Models/Step.cs`:
```csharp
using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Step : TenantEntity
{
    public Guid DemoId { get; set; }
    public Guid FrameId { get; set; }
    public int StepNumber { get; set; }
    public string? ClickTargetSelector { get; set; }
    public NavigationAction NavigationAction { get; set; } = NavigationAction.NextStep;
    public string? NavigationTarget { get; set; }

    public Demo Demo { get; set; } = null!;
    public Frame Frame { get; set; } = null!;
    public List<Annotation> Annotations { get; set; } = [];
}
```

`src/NavTour.Shared/Models/Annotation.cs`:
```csharp
using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Annotation : TenantEntity
{
    public Guid StepId { get; set; }
    public AnnotationType Type { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string? Style { get; set; }

    public Step Step { get; set; } = null!;
}
```

`src/NavTour.Shared/Models/DemoSession.cs`:
```csharp
namespace NavTour.Shared.Models;

public class DemoSession : TenantEntity
{
    public Guid DemoId { get; set; }
    public string? ViewerFingerprint { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Source { get; set; }

    public Demo Demo { get; set; } = null!;
    public List<SessionEvent> Events { get; set; } = [];
    public Lead? Lead { get; set; }
}
```

`src/NavTour.Shared/Models/SessionEvent.cs`:
```csharp
using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

// NOTE: SessionEvent uses long PK for high-volume writes, not TenantEntity base.
// Services creating SessionEvent must set TenantId manually (not auto-set by SetAuditFields).
public class SessionEvent
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid SessionId { get; set; }
    public EventType EventType { get; set; }
    public int? StepNumber { get; set; }
    public string? EventData { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public DemoSession Session { get; set; } = null!;
}
```

`src/NavTour.Shared/Models/Lead.cs`:
```csharp
namespace NavTour.Shared.Models;

public class Lead : TenantEntity
{
    public Guid SessionId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Company { get; set; }
    public string? CustomData { get; set; }

    public DemoSession Session { get; set; } = null!;
}
```

`src/NavTour.Shared/Models/ApiKey.cs`:
```csharp
namespace NavTour.Shared.Models;

public class ApiKey : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty;
    public string? Permissions { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastUsedAt { get; set; }
}
```

- [ ] **Step 5: Create all DTO files**

Create all DTOs as specified in the spec (Section 9). Each DTO is a C# `record` in its own file under `src/NavTour.Shared/DTOs/{Group}/`. Use the exact record definitions from the spec. Files:

- `DTOs/Auth/RegisterRequest.cs` — `record RegisterRequest(string Email, string Password, string CompanyName, string FullName)`
- `DTOs/Auth/LoginRequest.cs` — `record LoginRequest(string Email, string Password)`
- `DTOs/Auth/LoginResponse.cs` — `record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, Guid TenantId)`
- `DTOs/Auth/RefreshRequest.cs` — `record RefreshRequest(string RefreshToken)`
- `DTOs/Demos/CreateDemoRequest.cs` — `record CreateDemoRequest(string Name, string? Description, string Locale = "en")`
- `DTOs/Demos/UpdateDemoRequest.cs` — `record UpdateDemoRequest(string? Name, string? Description, string? Locale, string? Settings)`
- `DTOs/Demos/DemoResponse.cs` — `record DemoResponse(Guid Id, string Name, string Slug, string? Description, DemoStatus Status, string Locale, string? Settings, long ViewCount, DateTime CreatedAt)`
- `DTOs/Demos/DemoListItemResponse.cs` — `record DemoListItemResponse(Guid Id, string Name, string Slug, DemoStatus Status, long ViewCount, int FrameCount, int StepCount, DateTime CreatedAt)`
- `DTOs/Frames/FrameResponse.cs` — `record FrameResponse(Guid Id, int SequenceOrder, string? ThumbnailUrl, DateTime CreatedAt)`
- `DTOs/Frames/FrameDetailResponse.cs` — `record FrameDetailResponse(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent, DateTime CreatedAt)`
- `DTOs/Frames/ReorderFramesRequest.cs` — `record ReorderFramesRequest(List<Guid> FrameIdsInOrder)`
- `DTOs/Steps/StepDto.cs` — `record StepDto(Guid? Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<AnnotationDto> Annotations)`
- `DTOs/Steps/UpdateStepsRequest.cs` — `record UpdateStepsRequest(List<StepDto> Steps)`
- `DTOs/Steps/StepResponse.cs` — `record StepResponse(Guid Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<AnnotationResponse> Annotations)`
- `DTOs/Annotations/AnnotationDto.cs` — `record AnnotationDto(Guid? Id, AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style)`
- `DTOs/Annotations/CreateAnnotationRequest.cs` — `record CreateAnnotationRequest(AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style)`
- `DTOs/Annotations/AnnotationResponse.cs` — `record AnnotationResponse(Guid Id, AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style)`
- `DTOs/Player/PlayerManifestResponse.cs` — `record PlayerManifestResponse(string DemoName, string Slug, string? Settings, List<PlayerFrameDto> Frames, List<PlayerStepDto> Steps)`
- `DTOs/Player/PlayerFrameDto.cs` — `record PlayerFrameDto(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent)`
- `DTOs/Player/PlayerStepDto.cs` — `record PlayerStepDto(Guid Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<PlayerAnnotationDto> Annotations)`
- `DTOs/Player/PlayerAnnotationDto.cs` — `record PlayerAnnotationDto(AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style)`
- `DTOs/Analytics/EventBatchRequest.cs` — `record EventBatchRequest(Guid? SessionId, string? ViewerFingerprint, List<SessionEventDto> Events)`
- `DTOs/Analytics/SessionEventDto.cs` — `record SessionEventDto(EventType EventType, int? StepNumber, string? EventData, DateTime OccurredAt)`
- `DTOs/Analytics/EventBatchResponse.cs` — `record EventBatchResponse(Guid SessionId)`
- `DTOs/Analytics/AnalyticsSummaryResponse.cs` — `record AnalyticsSummaryResponse(long TotalViews, long Completions, double AvgTimeSeconds, double CompletionRate, List<DailyViewCount> ViewsOverTime, List<StepFunnelEntry> Funnel, List<SourceEntry> TopSources)` plus `record DailyViewCount(DateTime Date, int Count)`, `record StepFunnelEntry(int StepNumber, int ViewCount, int CompletionCount)`, `record SourceEntry(string Source, int Count)` — all in same file
- `DTOs/Analytics/SessionListResponse.cs` — `record SessionListResponse(Guid Id, DateTime StartedAt, DateTime? CompletedAt, int StepsViewed, int TotalSteps, bool Completed, string? Source)`
- `DTOs/Leads/LeadCaptureRequest.cs` — `record LeadCaptureRequest(string Email, string? Name, string? Company, string? CustomData)`
- `DTOs/Leads/LeadResponse.cs` — `record LeadResponse(Guid Id, string Email, string? Name, string? Company, string? CustomData, Guid DemoId, string DemoName, DateTime CapturedAt)`

All records use namespace `NavTour.Shared.DTOs.{Group}` and import enums from `NavTour.Shared.Enums`.

- [ ] **Step 6: Create ITenantProvider and TenantProvider**

`src/NavTour.Server/Infrastructure/MultiTenancy/ITenantProvider.cs`:
```csharp
namespace NavTour.Server.Infrastructure.MultiTenancy;

public interface ITenantProvider
{
    Guid TenantId { get; }
    void SetTenantId(Guid tenantId);
}
```

`src/NavTour.Server/Infrastructure/MultiTenancy/TenantProvider.cs`:
```csharp
namespace NavTour.Server.Infrastructure.MultiTenancy;

public class TenantProvider : ITenantProvider
{
    private Guid _tenantId;

    public Guid TenantId => _tenantId;

    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
```

- [ ] **Step 7: Create ApplicationUser**

`src/NavTour.Server/Infrastructure/Auth/ApplicationUser.cs`:
```csharp
using Microsoft.AspNetCore.Identity;
using NavTour.Shared.Enums;

namespace NavTour.Server.Infrastructure.Auth;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Viewer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 8: Create NavTourDbContext**

`src/NavTour.Server/Infrastructure/Data/NavTourDbContext.cs`:
```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.Models;

namespace NavTour.Server.Infrastructure.Data;

public class NavTourDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public NavTourDbContext(DbContextOptions<NavTourDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Demo> Demos => Set<Demo>();
    public DbSet<Frame> Frames => Set<Frame>();
    public DbSet<Step> Steps => Set<Step>();
    public DbSet<Annotation> Annotations => Set<Annotation>();
    public DbSet<DemoSession> DemoSessions => Set<DemoSession>();
    public DbSet<SessionEvent> SessionEvents => Set<SessionEvent>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Tenant (no global filter — Tenant is the root)
        builder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Name).HasMaxLength(200);
            e.Property(t => t.Slug).HasMaxLength(100);
        });

        // Demo
        builder.Entity<Demo>(e =>
        {
            e.HasQueryFilter(d => d.TenantId == _tenantProvider.TenantId && !d.IsDeleted);
            e.HasIndex(d => new { d.TenantId, d.Slug }).IsUnique();
            e.Property(d => d.Name).HasMaxLength(200);
            e.Property(d => d.Slug).HasMaxLength(100);
            e.Property(d => d.Description).HasMaxLength(2000);
            e.Property(d => d.Locale).HasMaxLength(10);
        });

        // Frame
        builder.Entity<Frame>(e =>
        {
            e.HasQueryFilter(f => f.TenantId == _tenantProvider.TenantId && !f.IsDeleted);
            e.HasOne(f => f.Demo).WithMany(d => d.Frames).HasForeignKey(f => f.DemoId).OnDelete(DeleteBehavior.Cascade);
        });

        // Step
        builder.Entity<Step>(e =>
        {
            e.HasQueryFilter(s => s.TenantId == _tenantProvider.TenantId && !s.IsDeleted);
            e.HasOne(s => s.Demo).WithMany(d => d.Steps).HasForeignKey(s => s.DemoId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Frame).WithMany().HasForeignKey(s => s.FrameId).OnDelete(DeleteBehavior.NoAction);
        });

        // Annotation
        builder.Entity<Annotation>(e =>
        {
            e.HasQueryFilter(a => a.TenantId == _tenantProvider.TenantId && !a.IsDeleted);
            e.HasOne(a => a.Step).WithMany(s => s.Annotations).HasForeignKey(a => a.StepId).OnDelete(DeleteBehavior.Cascade);
            e.Property(a => a.Title).HasMaxLength(200);
            e.Property(a => a.Content).HasMaxLength(4000);
        });

        // DemoSession
        builder.Entity<DemoSession>(e =>
        {
            e.HasQueryFilter(ds => ds.TenantId == _tenantProvider.TenantId && !ds.IsDeleted);
            e.HasOne(ds => ds.Demo).WithMany(d => d.Sessions).HasForeignKey(ds => ds.DemoId).OnDelete(DeleteBehavior.Cascade);
            e.Property(ds => ds.ViewerFingerprint).HasMaxLength(128);
            e.Property(ds => ds.Source).HasMaxLength(500);
        });

        // SessionEvent
        builder.Entity<SessionEvent>(e =>
        {
            e.HasQueryFilter(se => se.TenantId == _tenantProvider.TenantId);
            e.HasOne(se => se.Session).WithMany(s => s.Events).HasForeignKey(se => se.SessionId).OnDelete(DeleteBehavior.Cascade);
            // UserAgent is stored in EventData JSON, not as a separate column
        });

        // Lead
        builder.Entity<Lead>(e =>
        {
            e.HasQueryFilter(l => l.TenantId == _tenantProvider.TenantId && !l.IsDeleted);
            e.HasOne(l => l.Session).WithOne(s => s.Lead).HasForeignKey<Lead>(l => l.SessionId).OnDelete(DeleteBehavior.Cascade);
            e.Property(l => l.Email).HasMaxLength(320);
            e.Property(l => l.Name).HasMaxLength(200);
            e.Property(l => l.Company).HasMaxLength(200);
        });

        // ApiKey
        builder.Entity<ApiKey>(e =>
        {
            e.HasQueryFilter(ak => ak.TenantId == _tenantProvider.TenantId && !ak.IsDeleted);
            e.Property(ak => ak.Name).HasMaxLength(100);
            e.Property(ak => ak.KeyHash).HasMaxLength(64);
        });
    }

    public override int SaveChanges()
    {
        SetAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetAuditFields()
    {
        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenantProvider.TenantId;
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedAt = DateTime.UtcNow;
            }
        }
    }
}
```

- [ ] **Step 9: Create DbSeeder**

`src/NavTour.Server/Infrastructure/Data/DbSeeder.cs`:
```csharp
using Microsoft.AspNetCore.Identity;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<NavTourDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await context.Database.MigrateAsync();

        if (await context.Tenants.AnyAsync())
            return;

        // Create default tenant
        var tenant = new Tenant
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "NavTour Demo",
            Slug = "navtour-demo",
            Plan = "Pro",
            IsActive = true
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        // Create admin user
        var adminUser = new ApplicationUser
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            UserName = "admin@navtour.io",
            Email = "admin@navtour.io",
            FullName = "NavTour Admin",
            TenantId = tenant.Id,
            Role = UserRole.Owner,
            EmailConfirmed = true
        };
        await userManager.CreateAsync(adminUser, "NavTour123!");

        // Set tenant for seeded data
        var tenantProvider = scope.ServiceProvider.GetRequiredService<ITenantProvider>();
        tenantProvider.SetTenantId(tenant.Id);

        // Create sample demo
        var demo = new Demo
        {
            Name = "Product Tour Example",
            Slug = "product-tour-example",
            Description = "A sample interactive product demo",
            Status = DemoStatus.Published,
            CreatedBy = adminUser.Id,
            TenantId = tenant.Id
        };
        context.Demos.Add(demo);

        // Create 3 sample frames
        var frames = new[]
        {
            new Frame { DemoId = demo.Id, TenantId = tenant.Id, SequenceOrder = 1, HtmlContent = "<html><body><div style='padding:40px;font-family:sans-serif'><h1>Welcome to Our Product</h1><p>Click the button below to get started.</p><button id='get-started' style='padding:12px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px'>Get Started</button></div></body></html>" },
            new Frame { DemoId = demo.Id, TenantId = tenant.Id, SequenceOrder = 2, HtmlContent = "<html><body><div style='padding:40px;font-family:sans-serif'><h1>Dashboard Overview</h1><div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:20px'><div style='padding:20px;background:#f0f9ff;border-radius:8px'><h3>Users</h3><p style='font-size:32px;font-weight:bold'>1,234</p></div><div style='padding:20px;background:#f0fdf4;border-radius:8px'><h3>Revenue</h3><p style='font-size:32px;font-weight:bold'>$52K</p></div><div style='padding:20px;background:#fef3c7;border-radius:8px'><h3>Growth</h3><p style='font-size:32px;font-weight:bold'>+23%</p></div></div></div></body></html>" },
            new Frame { DemoId = demo.Id, TenantId = tenant.Id, SequenceOrder = 3, HtmlContent = "<html><body><div style='padding:40px;font-family:sans-serif'><h1>Ready to Start?</h1><p style='font-size:18px;margin:20px 0'>Sign up for a free trial and see results in minutes.</p><button id='signup' style='padding:16px 32px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:18px'>Start Free Trial</button></div></body></html>" }
        };
        context.Frames.AddRange(frames);

        // Create 3 steps with annotations
        var steps = new[]
        {
            new Step
            {
                DemoId = demo.Id, TenantId = tenant.Id, FrameId = frames[0].Id, StepNumber = 1,
                ClickTargetSelector = "#get-started", NavigationAction = NavigationAction.NextStep,
                Annotations = [new Annotation { TenantId = tenant.Id, Type = AnnotationType.Tooltip, Title = "Welcome!", Content = "Click 'Get Started' to see the dashboard.", PositionX = 50, PositionY = 70, Width = 250, Height = 80, Style = "{\"backgroundColor\":\"#1a1a2e\",\"textColor\":\"#ffffff\",\"borderRadius\":\"8px\",\"arrowPosition\":\"top\"}" }]
            },
            new Step
            {
                DemoId = demo.Id, TenantId = tenant.Id, FrameId = frames[1].Id, StepNumber = 2,
                NavigationAction = NavigationAction.NextStep,
                Annotations = [new Annotation { TenantId = tenant.Id, Type = AnnotationType.Hotspot, Title = "Key Metrics", Content = "These cards show your real-time business metrics.", PositionX = 30, PositionY = 40, Width = 60, Height = 40, Style = "{\"pulseColor\":\"#3b82f6\"}" }]
            },
            new Step
            {
                DemoId = demo.Id, TenantId = tenant.Id, FrameId = frames[2].Id, StepNumber = 3,
                ClickTargetSelector = "#signup", NavigationAction = NavigationAction.EndDemo,
                Annotations = [new Annotation { TenantId = tenant.Id, Type = AnnotationType.Modal, Title = "You're All Set!", Content = "Click 'Start Free Trial' to begin your journey.", PositionX = 25, PositionY = 20, Width = 50, Height = 40, Style = "{\"backgroundColor\":\"#ffffff\",\"textColor\":\"#1a1a2e\",\"borderRadius\":\"12px\"}" }]
            }
        };
        context.Steps.AddRange(steps);
        await context.SaveChangesAsync();
    }
}
```

- [ ] **Step 10: Create Program.cs (Server)**

`src/NavTour.Server/Program.cs`:
```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<NavTourDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Multi-tenancy
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<NavTourDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "NavTourDevelopmentSecretKey2026!@#$%^&*()";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "NavTour",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NavTour",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

// Blazor
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddHubOptions(options => options.MaximumReceiveMessageSize = 10 * 1024 * 1024)
    .AddInteractiveWebAssemblyComponents();

// Controllers + Radzen
builder.Services.AddControllers();
builder.Services.AddRadzenComponents();
builder.Services.AddHttpClient();

// CORS for player embeds
builder.Services.AddCors(options =>
{
    options.AddPolicy("PlayerCors", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Seed database
await DbSeeder.SeedAsync(app.Services);

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.UseCors("PlayerCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapRazorComponents<NavTour.Server.Components.App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(NavTour.Client._Imports).Assembly);

app.Run();
```

- [ ] **Step 11: Create appsettings files**

`src/NavTour.Server/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=NavTour;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "NavTourDevelopmentSecretKey2026!@#$%^&*()",
    "Issuer": "NavTour",
    "Audience": "NavTour",
    "ExpiryMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

`src/NavTour.Server/appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

- [ ] **Step 12: Create Blazor shell components**

`src/NavTour.Server/Components/App.razor`:
```razor
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="_content/Radzen.Blazor/css/material-base.css" />
    <link rel="stylesheet" href="NavTour.Server.styles.css" />
    <HeadOutlet @rendermode="InteractiveAuto" />
</head>
<body>
    <Routes @rendermode="InteractiveAuto" />
    <script src="_framework/blazor.web.js"></script>
    <script src="_content/Radzen.Blazor/Radzen.Blazor.js"></script>
</body>
</html>
```

`src/NavTour.Server/Components/Routes.razor`:
```razor
<Router AppAssembly="typeof(Program).Assembly"
        AdditionalAssemblies="new[] { typeof(NavTour.Client._Imports).Assembly }">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(NavTour.Client.Layout.MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>
```

`src/NavTour.Server/Components/_Imports.razor`:
```razor
@using Microsoft.AspNetCore.Components
@using Microsoft.AspNetCore.Components.Web
```

`src/NavTour.Client/Routes.razor`:
```razor
<Router AppAssembly="typeof(NavTour.Client._Imports).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>
```

`src/NavTour.Client/_Imports.razor`:
```razor
@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.JSInterop
@using Radzen
@using Radzen.Blazor
@using NavTour.Client
@using NavTour.Client.Layout
@using NavTour.Shared.Enums
@using NavTour.Shared.DTOs.Demos
@using NavTour.Shared.DTOs.Frames
@using NavTour.Shared.DTOs.Steps
@using NavTour.Shared.DTOs.Annotations
@using NavTour.Shared.DTOs.Player
@using NavTour.Shared.DTOs.Analytics
@using NavTour.Shared.DTOs.Leads
```

`src/NavTour.Client/Layout/MainLayout.razor`:
```razor
@inherits LayoutComponentBase

<RadzenLayout>
    <RadzenHeader>
        <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" Gap="0" class="rz-p-2">
            <RadzenText TextStyle="TextStyle.H5" class="rz-m-0"><strong>NavTour</strong></RadzenText>
        </RadzenStack>
    </RadzenHeader>
    <RadzenBody>
        <div class="rz-p-4">
            @Body
        </div>
    </RadzenBody>
</RadzenLayout>

<RadzenDialog />
<RadzenNotification />
<RadzenTooltip />
<RadzenContextMenu />
```

`src/NavTour.Client/Program.cs`:
```csharp
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Radzen;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddRadzenComponents();
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

await builder.Build().RunAsync();
```

`src/NavTour.Client/Pages/Index.razor`:
```razor
@* Placeholder — replaced by Dashboard.razor (Task 4) which also uses @page "/" *@
@* Delete this file once Dashboard.razor is created *@
@page "/placeholder-index"

<RadzenText TextStyle="TextStyle.H3">Welcome to NavTour</RadzenText>
<RadzenText>Interactive Demo Platform</RadzenText>
```

**Note:** Agent 4 (Builder UI) must delete `Index.razor` when creating `Dashboard.razor`, since both use the `/` route.

- [ ] **Step 13: Build and verify**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 14: Create initial EF migration**

```bash
cd D:/V3/Navtour/src/NavTour.Server
dotnet ef migrations add InitialCreate
```

- [ ] **Step 15: Run and verify seeding**

```bash
cd D:/V3/Navtour/src/NavTour.Server
dotnet run
```

Expected: App starts, database is created and seeded, navigating to `https://localhost:5001` shows "Welcome to NavTour".

- [ ] **Step 16: Commit foundation**

```bash
cd D:/V3/Navtour
git init
git add -A
git commit -m "feat: NavTour foundation — solution, entities, DbContext, multi-tenancy, seeding"
```

---

## Chunk 2: Tasks 2-3 — Auth System + Demo CRUD API

### Task 2: Authentication System (Agent 2)

**Owner:** Agent 2 (Auth)
**Blocked by:** Task 1
**Files to create:**
- `src/NavTour.Server/Infrastructure/Auth/JwtTokenService.cs`
- `src/NavTour.Server/Infrastructure/Auth/ApiKeyMiddleware.cs`
- `src/NavTour.Server/Controllers/AuthController.cs`

---

- [ ] **Step 1: Create JwtTokenService**

`src/NavTour.Server/Infrastructure/Auth/JwtTokenService.cs`:
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace NavTour.Server.Infrastructure.Auth;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("FullName", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NavTour",
            audience: _config["Jwt:Audience"] ?? "NavTour",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));

        try
        {
            return new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _config["Jwt:Issuer"] ?? "NavTour",
                ValidAudience = _config["Jwt:Audience"] ?? "NavTour",
                IssuerSigningKey = key
            }, out _);
        }
        catch
        {
            return null;
        }
    }
}
```

- [ ] **Step 2: Create ApiKeyMiddleware**

`src/NavTour.Server/Infrastructure/Auth/ApiKeyMiddleware.cs`:
```csharp
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;

namespace NavTour.Server.Infrastructure.Auth;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-NavTour-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, NavTourDbContext dbContext, ITenantProvider tenantProvider)
    {
        // Skip if already authenticated via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("TenantId")?.Value;
            if (tenantClaim != null && Guid.TryParse(tenantClaim, out var tenantId))
            {
                tenantProvider.SetTenantId(tenantId);
            }
            await _next(context);
            return;
        }

        // Check for API key
        if (context.Request.Headers.TryGetValue(ApiKeyHeader, out var apiKeyValue))
        {
            var keyHash = HashApiKey(apiKeyValue.ToString());
            var apiKey = await dbContext.ApiKeys
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(k => k.KeyHash == keyHash && k.IsActive && !k.IsDeleted);

            if (apiKey != null)
            {
                tenantProvider.SetTenantId(apiKey.TenantId);
                apiKey.LastUsedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();

                var claims = new[]
                {
                    new Claim("TenantId", apiKey.TenantId.ToString()),
                    new Claim("ApiKeyId", apiKey.Id.ToString()),
                    new Claim(ClaimTypes.Role, "ApiKey")
                };
                context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "ApiKey"));
            }
        }

        await _next(context);
    }

    private static string HashApiKey(string apiKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToHexStringLower(bytes);
    }
}
```

- [ ] **Step 3: Create AuthController**

`src/NavTour.Server/Controllers/AuthController.cs`:
```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Auth;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtService;
    private readonly NavTourDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtService,
        NavTourDbContext dbContext,
        ITenantProvider tenantProvider)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
    {
        // Create tenant
        var tenant = new Tenant
        {
            Name = request.CompanyName,
            Slug = request.CompanyName.ToLowerInvariant().Replace(" ", "-"),
            Plan = "Starter",
            IsActive = true
        };
        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync();

        // Create user
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            TenantId = tenant.Id,
            Role = UserRole.Owner,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            // Rollback tenant
            _dbContext.Tenants.Remove(tenant);
            await _dbContext.SaveChangesAsync();
            return BadRequest(result.Errors);
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return Ok(new LoginResponse(accessToken, refreshToken, DateTime.UtcNow.AddHours(1), tenant.Id));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { message = "Invalid email or password" });

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return Ok(new LoginResponse(accessToken, refreshToken, DateTime.UtcNow.AddHours(1), user.TenantId));
    }

    [HttpPost("refresh")]
    public ActionResult<LoginResponse> Refresh(RefreshRequest request)
    {
        // MVP: simple refresh — validate the refresh token is non-empty
        // Full refresh token rotation implemented in Phase 2
        return BadRequest(new { message = "Refresh not yet implemented — re-login required" });
    }
}
```

- [ ] **Step 4: Register auth services in Program.cs**

Add to `Program.cs` before `var app = builder.Build();`:
```csharp
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
```

Add after `app.UseAuthentication();`:
```csharp
app.UseMiddleware<ApiKeyMiddleware>();
```

Add using:
```csharp
using NavTour.Server.Infrastructure.Auth;
```

- [ ] **Step 5: Build and verify auth compiles**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

- [ ] **Step 6: Commit auth**

```bash
git add src/NavTour.Server/Infrastructure/Auth/JwtTokenService.cs src/NavTour.Server/Infrastructure/Auth/ApiKeyMiddleware.cs src/NavTour.Server/Controllers/AuthController.cs src/NavTour.Server/Program.cs
git commit -m "feat: auth system — JWT tokens, API key middleware, register/login endpoints"
```

---

### Task 3: Demo CRUD API (Agent 3)

**Owner:** Agent 3 (Demo API)
**Blocked by:** Task 1
**Files to create:**
- `src/NavTour.Server/Services/IDemoService.cs`
- `src/NavTour.Server/Services/DemoService.cs`
- `src/NavTour.Server/Services/IFrameService.cs`
- `src/NavTour.Server/Services/FrameService.cs`
- `src/NavTour.Server/Services/IStepService.cs`
- `src/NavTour.Server/Services/StepService.cs`
- `src/NavTour.Server/Services/IAnnotationService.cs`
- `src/NavTour.Server/Services/AnnotationService.cs`
- `src/NavTour.Server/Controllers/DemosController.cs`
- `src/NavTour.Server/Controllers/FramesController.cs`
- `src/NavTour.Server/Controllers/StepsController.cs`
- `src/NavTour.Server/Controllers/AnnotationsController.cs`

---

- [ ] **Step 1: Create DemoService**

`src/NavTour.Server/Services/IDemoService.cs`:
```csharp
using NavTour.Shared.DTOs.Demos;

namespace NavTour.Server.Services;

public interface IDemoService
{
    Task<List<DemoListItemResponse>> GetAllAsync();
    Task<DemoResponse?> GetByIdAsync(Guid id);
    Task<DemoResponse> CreateAsync(CreateDemoRequest request, Guid userId);
    Task<DemoResponse?> UpdateAsync(Guid id, UpdateDemoRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> PublishAsync(Guid id);
}
```

`src/NavTour.Server/Services/DemoService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Demos;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class DemoService : IDemoService
{
    private readonly NavTourDbContext _db;

    public DemoService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<DemoListItemResponse>> GetAllAsync()
    {
        return await _db.Demos
            .Select(d => new DemoListItemResponse(
                d.Id, d.Name, d.Slug, d.Status, d.ViewCount,
                d.Frames.Count(f => !f.IsDeleted),
                d.Steps.Count(s => !s.IsDeleted),
                d.CreatedAt))
            .ToListAsync();
    }

    public async Task<DemoResponse?> GetByIdAsync(Guid id)
    {
        return await _db.Demos
            .Where(d => d.Id == id)
            .Select(d => new DemoResponse(
                d.Id, d.Name, d.Slug, d.Description, d.Status,
                d.Locale, d.Settings, d.ViewCount, d.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<DemoResponse> CreateAsync(CreateDemoRequest request, Guid userId)
    {
        var slug = request.Name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("--", "-");

        // Ensure unique slug within tenant
        var baseSlug = slug;
        var counter = 1;
        while (await _db.Demos.AnyAsync(d => d.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var demo = new Demo
        {
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            Locale = request.Locale ?? "en",
            CreatedBy = userId
        };

        _db.Demos.Add(demo);
        await _db.SaveChangesAsync();

        return new DemoResponse(demo.Id, demo.Name, demo.Slug, demo.Description,
            demo.Status, demo.Locale, demo.Settings, demo.ViewCount, demo.CreatedAt);
    }

    public async Task<DemoResponse?> UpdateAsync(Guid id, UpdateDemoRequest request)
    {
        var demo = await _db.Demos.FindAsync(id);
        if (demo == null) return null;

        if (request.Name != null) demo.Name = request.Name;
        if (request.Description != null) demo.Description = request.Description;
        if (request.Locale != null) demo.Locale = request.Locale;
        if (request.Settings != null) demo.Settings = request.Settings;

        await _db.SaveChangesAsync();

        return new DemoResponse(demo.Id, demo.Name, demo.Slug, demo.Description,
            demo.Status, demo.Locale, demo.Settings, demo.ViewCount, demo.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var demo = await _db.Demos.FindAsync(id);
        if (demo == null) return false;

        demo.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var demo = await _db.Demos.FindAsync(id);
        if (demo == null) return false;

        demo.Status = DemoStatus.Published;
        await _db.SaveChangesAsync();
        return true;
    }
}
```

- [ ] **Step 2: Create FrameService**

`src/NavTour.Server/Services/IFrameService.cs`:
```csharp
using NavTour.Shared.DTOs.Frames;

namespace NavTour.Server.Services;

public interface IFrameService
{
    Task<List<FrameResponse>> GetAllByDemoAsync(Guid demoId);
    Task<FrameDetailResponse?> GetByIdAsync(Guid id);
    Task<FrameResponse> UploadAsync(Guid demoId, IFormFile file);
    Task<bool> DeleteAsync(Guid id);
    Task<FrameDetailResponse?> UpdateAsync(Guid id, string htmlContent, string? cssContent);
    Task<bool> ReorderAsync(Guid demoId, ReorderFramesRequest request);
}
```

`src/NavTour.Server/Services/FrameService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Frames;
using NavTour.Shared.Models;
using System.Text.RegularExpressions;

namespace NavTour.Server.Services;

public class FrameService : IFrameService
{
    private readonly NavTourDbContext _db;

    public FrameService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<FrameResponse>> GetAllByDemoAsync(Guid demoId)
    {
        return await _db.Frames
            .Where(f => f.DemoId == demoId)
            .OrderBy(f => f.SequenceOrder)
            .Select(f => new FrameResponse(f.Id, f.SequenceOrder, f.ThumbnailUrl, f.CreatedAt))
            .ToListAsync();
    }

    public async Task<FrameDetailResponse?> GetByIdAsync(Guid id)
    {
        return await _db.Frames
            .Where(f => f.Id == id)
            .Select(f => new FrameDetailResponse(f.Id, f.SequenceOrder, f.HtmlContent, f.CssContent, f.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<FrameResponse> UploadAsync(Guid demoId, IFormFile file)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var htmlContent = await reader.ReadToEndAsync();

        // Extract <style> blocks as CSS
        string? cssContent = null;
        var styleMatches = Regex.Matches(htmlContent, @"<style[^>]*>([\s\S]*?)</style>", RegexOptions.IgnoreCase);
        if (styleMatches.Count > 0)
        {
            cssContent = string.Join("\n", styleMatches.Select(m => m.Groups[1].Value));
        }

        var maxOrder = await _db.Frames
            .Where(f => f.DemoId == demoId)
            .MaxAsync(f => (int?)f.SequenceOrder) ?? 0;

        var frame = new Frame
        {
            DemoId = demoId,
            SequenceOrder = maxOrder + 1,
            HtmlContent = htmlContent,
            CssContent = cssContent
        };

        _db.Frames.Add(frame);
        await _db.SaveChangesAsync();

        return new FrameResponse(frame.Id, frame.SequenceOrder, frame.ThumbnailUrl, frame.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var frame = await _db.Frames.FindAsync(id);
        if (frame == null) return false;

        frame.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<FrameDetailResponse?> UpdateAsync(Guid id, string htmlContent, string? cssContent)
    {
        var frame = await _db.Frames.FindAsync(id);
        if (frame == null) return null;

        frame.HtmlContent = htmlContent;
        frame.CssContent = cssContent;
        await _db.SaveChangesAsync();

        return new FrameDetailResponse(frame.Id, frame.SequenceOrder, frame.HtmlContent, frame.CssContent, frame.CreatedAt);
    }

    public async Task<bool> ReorderAsync(Guid demoId, ReorderFramesRequest request)
    {
        var frames = await _db.Frames
            .Where(f => f.DemoId == demoId)
            .ToListAsync();

        for (int i = 0; i < request.FrameIdsInOrder.Count; i++)
        {
            var frame = frames.FirstOrDefault(f => f.Id == request.FrameIdsInOrder[i]);
            if (frame != null) frame.SequenceOrder = i + 1;
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
```

- [ ] **Step 3: Create StepService**

`src/NavTour.Server/Services/IStepService.cs`:
```csharp
using NavTour.Shared.DTOs.Steps;

namespace NavTour.Server.Services;

public interface IStepService
{
    Task<List<StepResponse>> GetAllByDemoAsync(Guid demoId);
    Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request);
}
```

`src/NavTour.Server/Services/StepService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class StepService : IStepService
{
    private readonly NavTourDbContext _db;

    public StepService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<StepResponse>> GetAllByDemoAsync(Guid demoId)
    {
        return await _db.Steps
            .Where(s => s.DemoId == demoId)
            .Include(s => s.Annotations)
            .OrderBy(s => s.StepNumber)
            .Select(s => new StepResponse(
                s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
                s.NavigationAction, s.NavigationTarget,
                s.Annotations.Where(a => !a.IsDeleted).Select(a => new AnnotationResponse(
                    a.Id, a.Type, a.Title, a.Content,
                    a.PositionX, a.PositionY, a.Width, a.Height, a.Style
                )).ToList()))
            .ToListAsync();
    }

    public async Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request)
    {
        // Remove existing steps for this demo
        var existingSteps = await _db.Steps
            .Where(s => s.DemoId == demoId)
            .Include(s => s.Annotations)
            .ToListAsync();

        _db.Steps.RemoveRange(existingSteps);

        // Create new steps from request
        foreach (var stepDto in request.Steps)
        {
            var step = new Step
            {
                Id = stepDto.Id ?? Guid.NewGuid(),
                DemoId = demoId,
                FrameId = stepDto.FrameId,
                StepNumber = stepDto.StepNumber,
                ClickTargetSelector = stepDto.ClickTargetSelector,
                NavigationAction = stepDto.NavigationAction,
                NavigationTarget = stepDto.NavigationTarget,
                Annotations = stepDto.Annotations.Select(a => new Annotation
                {
                    Id = a.Id ?? Guid.NewGuid(),
                    Type = a.Type,
                    Title = a.Title,
                    Content = a.Content,
                    PositionX = a.PositionX,
                    PositionY = a.PositionY,
                    Width = a.Width,
                    Height = a.Height,
                    Style = a.Style
                }).ToList()
            };
            _db.Steps.Add(step);
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
```

- [ ] **Step 4: Create AnnotationService**

`src/NavTour.Server/Services/IAnnotationService.cs`:
```csharp
using NavTour.Shared.DTOs.Annotations;

namespace NavTour.Server.Services;

public interface IAnnotationService
{
    Task<List<AnnotationResponse>> GetByStepAsync(Guid stepId);
    Task<AnnotationResponse> CreateAsync(Guid stepId, CreateAnnotationRequest request);
    Task<AnnotationResponse?> UpdateAsync(Guid id, CreateAnnotationRequest request);
    Task<bool> DeleteAsync(Guid id);
}
```

`src/NavTour.Server/Services/AnnotationService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class AnnotationService : IAnnotationService
{
    private readonly NavTourDbContext _db;

    public AnnotationService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<AnnotationResponse>> GetByStepAsync(Guid stepId)
    {
        return await _db.Annotations
            .Where(a => a.StepId == stepId)
            .Select(a => new AnnotationResponse(
                a.Id, a.Type, a.Title, a.Content,
                a.PositionX, a.PositionY, a.Width, a.Height, a.Style))
            .ToListAsync();
    }

    public async Task<AnnotationResponse> CreateAsync(Guid stepId, CreateAnnotationRequest request)
    {
        var step = await _db.Steps.FindAsync(stepId);
        var annotation = new Annotation
        {
            StepId = stepId,
            Type = request.Type,
            Title = request.Title,
            Content = request.Content,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Height = request.Height,
            Style = request.Style
        };

        _db.Annotations.Add(annotation);
        await _db.SaveChangesAsync();

        return new AnnotationResponse(annotation.Id, annotation.Type, annotation.Title,
            annotation.Content, annotation.PositionX, annotation.PositionY,
            annotation.Width, annotation.Height, annotation.Style);
    }

    public async Task<AnnotationResponse?> UpdateAsync(Guid id, CreateAnnotationRequest request)
    {
        var annotation = await _db.Annotations.FindAsync(id);
        if (annotation == null) return null;

        annotation.Type = request.Type;
        annotation.Title = request.Title;
        annotation.Content = request.Content;
        annotation.PositionX = request.PositionX;
        annotation.PositionY = request.PositionY;
        annotation.Width = request.Width;
        annotation.Height = request.Height;
        annotation.Style = request.Style;

        await _db.SaveChangesAsync();

        return new AnnotationResponse(annotation.Id, annotation.Type, annotation.Title,
            annotation.Content, annotation.PositionX, annotation.PositionY,
            annotation.Width, annotation.Height, annotation.Style);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var annotation = await _db.Annotations.FindAsync(id);
        if (annotation == null) return false;

        annotation.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }
}
```

- [ ] **Step 5: Create DemosController**

`src/NavTour.Server/Controllers/DemosController.cs`:
```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Demos;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/demos")]
[Authorize]
public class DemosController : ControllerBase
{
    private readonly IDemoService _demoService;

    public DemosController(IDemoService demoService)
    {
        _demoService = demoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DemoListItemResponse>>> GetAll()
    {
        return Ok(await _demoService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DemoResponse>> GetById(Guid id)
    {
        var demo = await _demoService.GetByIdAsync(id);
        return demo == null ? NotFound() : Ok(demo);
    }

    [HttpPost]
    public async Task<ActionResult<DemoResponse>> Create(CreateDemoRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var demo = await _demoService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = demo.Id }, demo);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DemoResponse>> Update(Guid id, UpdateDemoRequest request)
    {
        var demo = await _demoService.UpdateAsync(id, request);
        return demo == null ? NotFound() : Ok(demo);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _demoService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        return await _demoService.PublishAsync(id) ? Ok() : NotFound();
    }
}
```

- [ ] **Step 6: Create FramesController**

`src/NavTour.Server/Controllers/FramesController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Frames;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
public class FramesController : ControllerBase
{
    private readonly IFrameService _frameService;

    public FramesController(IFrameService frameService)
    {
        _frameService = frameService;
    }

    [HttpGet("api/v1/demos/{demoId:guid}/frames")]
    public async Task<ActionResult<List<FrameResponse>>> GetAll(Guid demoId)
    {
        return Ok(await _frameService.GetAllByDemoAsync(demoId));
    }

    [HttpGet("api/v1/frames/{id:guid}")]
    public async Task<ActionResult<FrameDetailResponse>> GetById(Guid id)
    {
        var frame = await _frameService.GetByIdAsync(id);
        return frame == null ? NotFound() : Ok(frame);
    }

    [HttpPost("api/v1/demos/{demoId:guid}/frames")]
    public async Task<ActionResult<FrameResponse>> Upload(Guid demoId, IFormFile file)
    {
        var frame = await _frameService.UploadAsync(demoId, file);
        return CreatedAtAction(nameof(GetById), new { id = frame.Id }, frame);
    }

    [HttpPut("api/v1/frames/{id:guid}")]
    public async Task<ActionResult<FrameDetailResponse>> Update(Guid id, IFormFile file)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var htmlContent = await reader.ReadToEndAsync();
        string? cssContent = null;
        var styleMatches = System.Text.RegularExpressions.Regex.Matches(htmlContent, @"<style[^>]*>([\s\S]*?)</style>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (styleMatches.Count > 0)
            cssContent = string.Join("\n", styleMatches.Select(m => m.Groups[1].Value));

        var frame = await _frameService.UpdateAsync(id, htmlContent, cssContent);
        return frame == null ? NotFound() : Ok(frame);
    }

    [HttpDelete("api/v1/frames/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _frameService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpPut("api/v1/demos/{demoId:guid}/frames/reorder")]
    public async Task<IActionResult> Reorder(Guid demoId, ReorderFramesRequest request)
    {
        return await _frameService.ReorderAsync(demoId, request) ? Ok() : NotFound();
    }
}
```

- [ ] **Step 7: Create StepsController**

`src/NavTour.Server/Controllers/StepsController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Steps;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
public class StepsController : ControllerBase
{
    private readonly IStepService _stepService;

    public StepsController(IStepService stepService)
    {
        _stepService = stepService;
    }

    [HttpGet("api/v1/demos/{demoId:guid}/steps")]
    public async Task<ActionResult<List<StepResponse>>> GetAll(Guid demoId)
    {
        return Ok(await _stepService.GetAllByDemoAsync(demoId));
    }

    [HttpPut("api/v1/demos/{demoId:guid}/steps")]
    public async Task<IActionResult> UpdateSteps(Guid demoId, UpdateStepsRequest request)
    {
        return await _stepService.UpdateStepsAsync(demoId, request) ? Ok() : NotFound();
    }
}
```

- [ ] **Step 8: Create AnnotationsController**

`src/NavTour.Server/Controllers/AnnotationsController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Annotations;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/steps/{stepId:guid}/annotations")]
[Authorize]
public class AnnotationsController : ControllerBase
{
    private readonly IAnnotationService _annotationService;

    public AnnotationsController(IAnnotationService annotationService)
    {
        _annotationService = annotationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AnnotationResponse>>> GetAll(Guid stepId)
    {
        return Ok(await _annotationService.GetByStepAsync(stepId));
    }

    [HttpPost]
    public async Task<ActionResult<AnnotationResponse>> Create(Guid stepId, CreateAnnotationRequest request)
    {
        var annotation = await _annotationService.CreateAsync(stepId, request);
        return Created($"api/v1/steps/{stepId}/annotations/{annotation.Id}", annotation);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AnnotationResponse>> Update(Guid id, CreateAnnotationRequest request)
    {
        var annotation = await _annotationService.UpdateAsync(id, request);
        return annotation == null ? NotFound() : Ok(annotation);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _annotationService.DeleteAsync(id) ? NoContent() : NotFound();
    }
}
```

- [ ] **Step 9: Register services in Program.cs**

Add to `Program.cs` before `var app = builder.Build();`:
```csharp
// Domain services
builder.Services.AddScoped<IDemoService, DemoService>();
builder.Services.AddScoped<IFrameService, FrameService>();
builder.Services.AddScoped<IStepService, StepService>();
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
```

Add usings:
```csharp
using NavTour.Server.Services;
```

- [ ] **Step 10: Build and verify**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

- [ ] **Step 11: Commit Demo API**

```bash
git add src/NavTour.Server/Services/ src/NavTour.Server/Controllers/DemosController.cs src/NavTour.Server/Controllers/FramesController.cs src/NavTour.Server/Controllers/StepsController.cs src/NavTour.Server/Controllers/AnnotationsController.cs src/NavTour.Server/Program.cs
git commit -m "feat: demo CRUD API — demos, frames, steps, annotations with services"
```

---

## Chunk 3: Tasks 4-5 — Builder UI + Demo Player

### Task 4: Demo Builder UI (Agent 4)

**Owner:** Agent 4 (Builder UI)
**Blocked by:** Task 1
**Files to create:**
- `src/NavTour.Client/Services/AuthService.cs`
- `src/NavTour.Client/Services/DemoApiService.cs`
- `src/NavTour.Client/Pages/Login.razor`
- `src/NavTour.Client/Pages/Register.razor`
- `src/NavTour.Client/Pages/Dashboard.razor`
- `src/NavTour.Client/Pages/DemoEditor.razor`
- `src/NavTour.Client/Pages/DemoSettings.razor`
- `src/NavTour.Client/Components/FrameStrip.razor`
- `src/NavTour.Client/Components/FramePreview.razor`
- `src/NavTour.Client/Components/StepPanel.razor`
- `src/NavTour.Client/Components/AnnotationOverlay.razor`
- `src/NavTour.Client/Layout/MainLayout.razor` (modify)

---

- [ ] **Step 1: Create AuthService**

`src/NavTour.Client/Services/AuthService.cs`:
```csharp
using System.Net.Http.Json;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Client.Services;

public class AuthService
{
    private readonly HttpClient _http;
    private string? _accessToken;
    private Guid? _tenantId;

    public AuthService(HttpClient http)
    {
        _http = http;
    }

    public bool IsAuthenticated => _accessToken != null;
    public Guid? TenantId => _tenantId;

    public async Task<(bool Success, string? Error)> LoginAsync(string email, string password)
    {
        var response = await _http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(email, password));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return (false, error);
        }

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        _accessToken = result!.AccessToken;
        _tenantId = result.TenantId;
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RegisterAsync(string email, string password, string companyName, string fullName)
    {
        var response = await _http.PostAsJsonAsync("api/v1/auth/register",
            new RegisterRequest(email, password, companyName, fullName));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return (false, error);
        }

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        _accessToken = result!.AccessToken;
        _tenantId = result.TenantId;
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        return (true, null);
    }

    public void Logout()
    {
        _accessToken = null;
        _tenantId = null;
        _http.DefaultRequestHeaders.Authorization = null;
    }
}
```

- [ ] **Step 2: Create DemoApiService**

`src/NavTour.Client/Services/DemoApiService.cs`:
```csharp
using System.Net.Http.Json;
using NavTour.Shared.DTOs.Demos;
using NavTour.Shared.DTOs.Frames;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.DTOs.Annotations;

namespace NavTour.Client.Services;

public class DemoApiService
{
    private readonly HttpClient _http;

    public DemoApiService(HttpClient http)
    {
        _http = http;
    }

    // Demos
    public async Task<List<DemoListItemResponse>> GetDemosAsync()
        => await _http.GetFromJsonAsync<List<DemoListItemResponse>>("api/v1/demos") ?? [];

    public async Task<DemoResponse?> GetDemoAsync(Guid id)
        => await _http.GetFromJsonAsync<DemoResponse>($"api/v1/demos/{id}");

    public async Task<DemoResponse?> CreateDemoAsync(CreateDemoRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/demos", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<DemoResponse>() : null;
    }

    public async Task<bool> UpdateDemoAsync(Guid id, UpdateDemoRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{id}", request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteDemoAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/demos/{id}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> PublishDemoAsync(Guid id)
    {
        var response = await _http.PostAsync($"api/v1/demos/{id}/publish", null);
        return response.IsSuccessStatusCode;
    }

    // Frames
    public async Task<List<FrameResponse>> GetFramesAsync(Guid demoId)
        => await _http.GetFromJsonAsync<List<FrameResponse>>($"api/v1/demos/{demoId}/frames") ?? [];

    public async Task<FrameDetailResponse?> GetFrameDetailAsync(Guid frameId)
        => await _http.GetFromJsonAsync<FrameDetailResponse>($"api/v1/frames/{frameId}");

    public async Task<FrameResponse?> UploadFrameAsync(Guid demoId, Stream fileStream, string fileName)
    {
        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(fileStream), "file", fileName);
        var response = await _http.PostAsync($"api/v1/demos/{demoId}/frames", content);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<FrameResponse>() : null;
    }

    public async Task<bool> DeleteFrameAsync(Guid frameId)
    {
        var response = await _http.DeleteAsync($"api/v1/frames/{frameId}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> ReorderFramesAsync(Guid demoId, List<Guid> frameIds)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/frames/reorder", new ReorderFramesRequest(frameIds));
        return response.IsSuccessStatusCode;
    }

    // Steps
    public async Task<List<StepResponse>> GetStepsAsync(Guid demoId)
        => await _http.GetFromJsonAsync<List<StepResponse>>($"api/v1/demos/{demoId}/steps") ?? [];

    public async Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/steps", request);
        return response.IsSuccessStatusCode;
    }

    // Annotations
    public async Task<AnnotationResponse?> CreateAnnotationAsync(Guid stepId, CreateAnnotationRequest request)
    {
        var response = await _http.PostAsJsonAsync($"api/v1/steps/{stepId}/annotations", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AnnotationResponse>() : null;
    }

    public async Task<bool> DeleteAnnotationAsync(Guid stepId, Guid annotationId)
    {
        var response = await _http.DeleteAsync($"api/v1/steps/{stepId}/annotations/{annotationId}");
        return response.IsSuccessStatusCode;
    }
}
```

- [ ] **Step 3: Register client services in Program.cs**

Update `src/NavTour.Client/Program.cs`:
```csharp
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Radzen;
using NavTour.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddRadzenComponents();
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DemoApiService>();

await builder.Build().RunAsync();
```

- [ ] **Step 4: Update MainLayout with sidebar navigation**

`src/NavTour.Client/Layout/MainLayout.razor`:
```razor
@inherits LayoutComponentBase
@inject AuthService Auth
@inject NavigationManager Nav

<RadzenLayout>
    <RadzenHeader>
        <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" JustifyContent="JustifyContent.SpaceBetween" class="rz-p-2" Style="width:100%">
            <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" Gap="8px">
                <RadzenText TextStyle="TextStyle.H5" class="rz-m-0" Style="cursor:pointer" @onclick='() => Nav.NavigateTo("/")'>
                    <strong>NavTour</strong>
                </RadzenText>
            </RadzenStack>
            @if (Auth.IsAuthenticated)
            {
                <RadzenStack Orientation="Orientation.Horizontal" Gap="8px">
                    <RadzenButton Text="Leads" ButtonStyle="ButtonStyle.Light" Click='() => Nav.NavigateTo("/leads")' />
                    <RadzenButton Text="Logout" ButtonStyle="ButtonStyle.Danger" Variant="Variant.Text" Click="Logout" />
                </RadzenStack>
            }
        </RadzenStack>
    </RadzenHeader>
    <RadzenBody>
        <div class="rz-p-4">
            @Body
        </div>
    </RadzenBody>
</RadzenLayout>

<RadzenDialog />
<RadzenNotification />
<RadzenTooltip />
<RadzenContextMenu />

@code {
    private void Logout()
    {
        Auth.Logout();
        Nav.NavigateTo("/login");
    }
}
```

- [ ] **Step 5: Create Login page**

`src/NavTour.Client/Pages/Login.razor`:
```razor
@page "/login"
@inject AuthService Auth
@inject NavigationManager Nav

<RadzenStack Gap="16px" Style="max-width:400px;margin:60px auto">
    <RadzenText TextStyle="TextStyle.H4">Sign In to NavTour</RadzenText>

    @if (errorMessage != null)
    {
        <RadzenAlert AlertStyle="AlertStyle.Danger" ShowIcon="true">@errorMessage</RadzenAlert>
    }

    <RadzenTextBox @bind-Value="email" Placeholder="Email" Style="width:100%" />
    <RadzenPassword @bind-Value="password" Placeholder="Password" Style="width:100%" />
    <RadzenButton Text="Sign In" ButtonStyle="ButtonStyle.Primary" Style="width:100%" Click="HandleLogin" IsBusy="loading" />

    <RadzenText>
        Don't have an account? <RadzenLink Path="/register">Register</RadzenLink>
    </RadzenText>
</RadzenStack>

@code {
    private string email = "";
    private string password = "";
    private string? errorMessage;
    private bool loading;

    private async Task HandleLogin()
    {
        loading = true;
        errorMessage = null;
        var (success, error) = await Auth.LoginAsync(email, password);
        if (success)
            Nav.NavigateTo("/");
        else
            errorMessage = "Invalid email or password";
        loading = false;
    }
}
```

- [ ] **Step 6: Create Register page**

`src/NavTour.Client/Pages/Register.razor`:
```razor
@page "/register"
@inject AuthService Auth
@inject NavigationManager Nav

<RadzenStack Gap="16px" Style="max-width:400px;margin:60px auto">
    <RadzenText TextStyle="TextStyle.H4">Create Your NavTour Account</RadzenText>

    @if (errorMessage != null)
    {
        <RadzenAlert AlertStyle="AlertStyle.Danger" ShowIcon="true">@errorMessage</RadzenAlert>
    }

    <RadzenTextBox @bind-Value="fullName" Placeholder="Full Name" Style="width:100%" />
    <RadzenTextBox @bind-Value="companyName" Placeholder="Company Name" Style="width:100%" />
    <RadzenTextBox @bind-Value="email" Placeholder="Email" Style="width:100%" />
    <RadzenPassword @bind-Value="password" Placeholder="Password (min 8 chars)" Style="width:100%" />
    <RadzenButton Text="Create Account" ButtonStyle="ButtonStyle.Primary" Style="width:100%" Click="HandleRegister" IsBusy="loading" />

    <RadzenText>
        Already have an account? <RadzenLink Path="/login">Sign In</RadzenLink>
    </RadzenText>
</RadzenStack>

@code {
    private string fullName = "";
    private string companyName = "";
    private string email = "";
    private string password = "";
    private string? errorMessage;
    private bool loading;

    private async Task HandleRegister()
    {
        loading = true;
        errorMessage = null;
        var (success, error) = await Auth.RegisterAsync(email, password, companyName, fullName);
        if (success)
            Nav.NavigateTo("/");
        else
            errorMessage = error ?? "Registration failed";
        loading = false;
    }
}
```

- [ ] **Step 7: Create Dashboard page**

`src/NavTour.Client/Pages/Dashboard.razor`:
```razor
@page "/"
@inject AuthService Auth
@inject DemoApiService DemoApi
@inject NavigationManager Nav
@inject DialogService Dialog

@if (!Auth.IsAuthenticated)
{
    <RadzenStack Gap="24px" Style="max-width:600px;margin:60px auto;text-align:center">
        <RadzenText TextStyle="TextStyle.H3"><strong>NavTour</strong></RadzenText>
        <RadzenText TextStyle="TextStyle.H6" Style="color:var(--rz-text-secondary-color)">
            Create interactive product demos that convert prospects into customers.
        </RadzenText>
        <RadzenStack Orientation="Orientation.Horizontal" Gap="12px" JustifyContent="JustifyContent.Center">
            <RadzenButton Text="Sign In" ButtonStyle="ButtonStyle.Primary" Click='() => Nav.NavigateTo("/login")' />
            <RadzenButton Text="Get Started Free" ButtonStyle="ButtonStyle.Secondary" Click='() => Nav.NavigateTo("/register")' />
        </RadzenStack>
    </RadzenStack>
}
else
{
    <RadzenStack Gap="16px">
        <RadzenStack Orientation="Orientation.Horizontal" JustifyContent="JustifyContent.SpaceBetween" AlignItems="AlignItems.Center">
            <RadzenText TextStyle="TextStyle.H4">My Demos</RadzenText>
            <RadzenButton Text="+ New Demo" ButtonStyle="ButtonStyle.Primary" Click="CreateNewDemo" />
        </RadzenStack>

        @if (loading)
        {
            <RadzenProgressBarCircular ShowValue="false" Mode="ProgressBarMode.Indeterminate" />
        }
        else if (demos.Count == 0)
        {
            <RadzenCard Style="text-align:center;padding:40px">
                <RadzenText TextStyle="TextStyle.H6">No demos yet</RadzenText>
                <RadzenText>Create your first interactive demo to get started.</RadzenText>
                <RadzenButton Text="Create Demo" ButtonStyle="ButtonStyle.Primary" Style="margin-top:16px" Click="CreateNewDemo" />
            </RadzenCard>
        }
        else
        {
            <RadzenDataGrid Data="@demos" TItem="DemoListItemResponse" AllowSorting="true">
                <Columns>
                    <RadzenDataGridColumn Property="Name" Title="Name">
                        <Template Context="demo">
                            <RadzenLink Path='@($"/demos/{demo.Id}/edit")'>@demo.Name</RadzenLink>
                        </Template>
                    </RadzenDataGridColumn>
                    <RadzenDataGridColumn Property="Status" Title="Status" Width="120px">
                        <Template Context="demo">
                            <RadzenBadge Text="@demo.Status.ToString()"
                                BadgeStyle="@(demo.Status == DemoStatus.Published ? BadgeStyle.Success : BadgeStyle.Light)" />
                        </Template>
                    </RadzenDataGridColumn>
                    <RadzenDataGridColumn Property="ViewCount" Title="Views" Width="100px" />
                    <RadzenDataGridColumn Property="FrameCount" Title="Frames" Width="100px" />
                    <RadzenDataGridColumn Property="StepCount" Title="Steps" Width="100px" />
                    <RadzenDataGridColumn Title="Actions" Width="200px">
                        <Template Context="demo">
                            <RadzenButton Text="Edit" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
                                Click='() => Nav.NavigateTo($"/demos/{demo.Id}/edit")' />
                            <RadzenButton Text="Analytics" ButtonStyle="ButtonStyle.Info" Variant="Variant.Text" Size="ButtonSize.Small"
                                Click='() => Nav.NavigateTo($"/demos/{demo.Id}/analytics")' />
                        </Template>
                    </RadzenDataGridColumn>
                </Columns>
            </RadzenDataGrid>
        }
    </RadzenStack>
}

@code {
    private List<DemoListItemResponse> demos = [];
    private bool loading = true;

    protected override async Task OnInitializedAsync()
    {
        if (Auth.IsAuthenticated)
        {
            demos = await DemoApi.GetDemosAsync();
        }
        loading = false;
    }

    private async Task CreateNewDemo()
    {
        var name = await Dialog.OpenAsync<RadzenTextBox>("New Demo Name");
        if (name is string demoName && !string.IsNullOrWhiteSpace(demoName))
        {
            var demo = await DemoApi.CreateDemoAsync(new CreateDemoRequest(demoName, null));
            if (demo != null)
                Nav.NavigateTo($"/demos/{demo.Id}/edit");
        }
    }
}
```

- [ ] **Step 8: Create FrameStrip component**

`src/NavTour.Client/Components/FrameStrip.razor`:
```razor
<RadzenStack Gap="8px" Style="width:140px;min-height:100%;overflow-y:auto;border-right:1px solid var(--rz-border-color);padding:8px">
    @for (int i = 0; i < Frames.Count; i++)
    {
        var frame = Frames[i];
        var isSelected = frame.Id == SelectedFrameId;
        <RadzenCard Style="@($"cursor:pointer;padding:8px;{(isSelected ? "border:2px solid var(--rz-primary)" : "")}")"
            @onclick="() => OnFrameSelected.InvokeAsync(frame.Id)">
            <RadzenStack AlignItems="AlignItems.Center">
                <RadzenIcon Icon="web" Style="font-size:32px;color:var(--rz-text-secondary-color)" />
                <RadzenText TextStyle="TextStyle.Caption">Frame @frame.SequenceOrder</RadzenText>
            </RadzenStack>
        </RadzenCard>
    }
    <RadzenButton Text="+ Add" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small" Style="width:100%" Click="OnAddFrame" />
</RadzenStack>

@code {
    [Parameter] public List<FrameResponse> Frames { get; set; } = [];
    [Parameter] public Guid? SelectedFrameId { get; set; }
    [Parameter] public EventCallback<Guid> OnFrameSelected { get; set; }
    [Parameter] public EventCallback OnAddFrame { get; set; }
}
```

- [ ] **Step 9: Create FramePreview component**

`src/NavTour.Client/Components/FramePreview.razor`:
```razor
@inject IJSRuntime JS

<div style="flex:1;position:relative;overflow:hidden;background:var(--rz-base-200)">
    @if (HtmlContent != null)
    {
        <iframe @ref="iframeRef" sandbox="allow-same-origin" style="width:100%;height:100%;border:none"
            srcdoc="@HtmlContent"></iframe>

        @* Annotation overlays rendered on top *@
        @if (Annotations != null)
        {
            foreach (var annotation in Annotations)
            {
                <AnnotationOverlay Annotation="annotation" Mode="AnnotationOverlayMode.Edit" />
            }
        }
    }
    else
    {
        <RadzenStack AlignItems="AlignItems.Center" JustifyContent="JustifyContent.Center" Style="height:100%">
            <RadzenIcon Icon="image" Style="font-size:64px;color:var(--rz-text-tertiary-color)" />
            <RadzenText Style="color:var(--rz-text-secondary-color)">Select a frame to preview</RadzenText>
        </RadzenStack>
    }
</div>

@code {
    [Parameter] public string? HtmlContent { get; set; }
    [Parameter] public List<AnnotationResponse>? Annotations { get; set; }

    private ElementReference iframeRef;
}
```

- [ ] **Step 10: Create AnnotationOverlay component**

`src/NavTour.Client/Components/AnnotationOverlay.razor`:
```razor
@using NavTour.Shared.DTOs.Annotations

<div style="@GetStyle()" class="annotation-overlay">
    @switch (Annotation.Type)
    {
        case AnnotationType.Tooltip:
            <div style="@GetTooltipStyle()">
                @if (Annotation.Title != null)
                {
                    <strong>@Annotation.Title</strong>
                }
                @if (Annotation.Content != null)
                {
                    <p style="margin:4px 0 0">@Annotation.Content</p>
                }
            </div>
            break;

        case AnnotationType.Modal:
            <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:400px">
                @if (Annotation.Title != null)
                {
                    <h3 style="margin:0 0 8px">@Annotation.Title</h3>
                }
                @if (Annotation.Content != null)
                {
                    <p style="margin:0">@Annotation.Content</p>
                }
            </div>
            break;

        case AnnotationType.Hotspot:
            <div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.5);animation:pulse 2s infinite;border:3px solid #3b82f6">
            </div>
            break;

        case AnnotationType.Blur:
            <div style="width:100%;height:100%;backdrop-filter:blur(8px);background:rgba(0,0,0,0.1);border-radius:4px">
            </div>
            break;
    }
</div>

@code {
    [Parameter] public AnnotationResponse Annotation { get; set; } = null!;
    [Parameter] public AnnotationOverlayMode Mode { get; set; } = AnnotationOverlayMode.View;

    private string GetStyle()
    {
        return $"position:absolute;left:{Annotation.PositionX}%;top:{Annotation.PositionY}%;width:{Annotation.Width}%;height:{Annotation.Height}%;z-index:10;pointer-events:none";
    }

    private string GetTooltipStyle()
    {
        var parsed = ParseStyle();
        var bg = parsed.GetValueOrDefault("backgroundColor", "#1a1a2e");
        var color = parsed.GetValueOrDefault("textColor", "#ffffff");
        var radius = parsed.GetValueOrDefault("borderRadius", "8px");
        return $"background:{bg};color:{color};border-radius:{radius};padding:12px 16px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2)";
    }

    private Dictionary<string, string> ParseStyle()
    {
        if (string.IsNullOrEmpty(Annotation.Style)) return [];
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(Annotation.Style) ?? [];
        }
        catch { return []; }
    }

    public enum AnnotationOverlayMode { View, Edit }
}
```

- [ ] **Step 11: Create StepPanel component**

`src/NavTour.Client/Components/StepPanel.razor`:
```razor
@using NavTour.Shared.DTOs.Steps
@using NavTour.Shared.DTOs.Annotations

<RadzenStack Gap="8px" Style="width:280px;min-height:100%;overflow-y:auto;border-left:1px solid var(--rz-border-color);padding:12px">
    <RadzenText TextStyle="TextStyle.H6">Steps</RadzenText>

    @if (Steps.Count == 0)
    {
        <RadzenText Style="color:var(--rz-text-secondary-color);font-size:13px">No steps configured. Add frames first, then create steps.</RadzenText>
    }

    @foreach (var step in Steps.OrderBy(s => s.StepNumber))
    {
        var isSelected = step.Id == SelectedStepId;
        <RadzenCard Style="@($"padding:10px;cursor:pointer;{(isSelected ? "border:2px solid var(--rz-primary)" : "")}")"
            @onclick="() => OnStepSelected.InvokeAsync(step.Id)">
            <RadzenStack Gap="4px">
                <RadzenText TextStyle="TextStyle.Subtitle2">Step @step.StepNumber</RadzenText>
                <RadzenText TextStyle="TextStyle.Caption" Style="color:var(--rz-text-secondary-color)">
                    @step.NavigationAction.ToString()
                    @if (step.ClickTargetSelector != null)
                    {
                        <text> · @step.ClickTargetSelector</text>
                    }
                </RadzenText>
                <RadzenText TextStyle="TextStyle.Caption">
                    @step.Annotations.Count annotation(s)
                </RadzenText>
            </RadzenStack>
        </RadzenCard>
    }

    <RadzenButton Text="+ Add Step" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small" Style="width:100%" Click="OnAddStep" />
</RadzenStack>

@code {
    [Parameter] public List<StepResponse> Steps { get; set; } = [];
    [Parameter] public Guid? SelectedStepId { get; set; }
    [Parameter] public EventCallback<Guid> OnStepSelected { get; set; }
    [Parameter] public EventCallback OnAddStep { get; set; }
}
```

- [ ] **Step 12: Create DemoEditor page**

`src/NavTour.Client/Pages/DemoEditor.razor`:
```razor
@page "/demos/{DemoId:guid}/edit"
@inject DemoApiService DemoApi
@inject NavigationManager Nav
@inject NotificationService Notification
@inject AuthService Auth

<RadzenStack Gap="0" Style="height:calc(100vh - 80px)">
    @* Toolbar *@
    <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" Gap="8px"
        Style="padding:8px 12px;border-bottom:1px solid var(--rz-border-color)">
        <RadzenText TextStyle="TextStyle.H6" class="rz-m-0">@(demo?.Name ?? "Loading...")</RadzenText>
        <div style="flex:1"></div>
        <RadzenButton Text="Save" ButtonStyle="ButtonStyle.Primary" Size="ButtonSize.Small" Click="SaveSteps" IsBusy="saving" />
        <RadzenButton Text="Preview" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
            Click='() => Nav.NavigateTo($"/demo/{demo?.Slug}", true)' />
        <RadzenButton Text="Publish" ButtonStyle="ButtonStyle.Success" Size="ButtonSize.Small" Click="PublishDemo" />
        <RadzenButton Text="Settings" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
            Click='() => Nav.NavigateTo($"/demos/{DemoId}/settings")' />
    </RadzenStack>

    @* Main workspace *@
    <RadzenStack Orientation="Orientation.Horizontal" Style="flex:1;overflow:hidden">
        <FrameStrip Frames="frames" SelectedFrameId="selectedFrameId"
            OnFrameSelected="SelectFrame" OnAddFrame="AddFrame" />

        <FramePreview HtmlContent="@currentFrameHtml"
            Annotations="@currentAnnotations" />

        <StepPanel Steps="steps" SelectedStepId="selectedStepId"
            OnStepSelected="SelectStep" OnAddStep="AddStep" />
    </RadzenStack>
</RadzenStack>

@code {
    [Parameter] public Guid DemoId { get; set; }

    private DemoResponse? demo;
    private List<FrameResponse> frames = [];
    private List<StepResponse> steps = [];
    private Guid? selectedFrameId;
    private Guid? selectedStepId;
    private string? currentFrameHtml;
    private List<AnnotationResponse>? currentAnnotations;
    private bool saving;

    protected override async Task OnInitializedAsync()
    {
        if (!Auth.IsAuthenticated) { Nav.NavigateTo("/login"); return; }

        demo = await DemoApi.GetDemoAsync(DemoId);
        if (demo == null) { Nav.NavigateTo("/"); return; }

        frames = await DemoApi.GetFramesAsync(DemoId);
        steps = await DemoApi.GetStepsAsync(DemoId);

        if (frames.Count > 0)
            await SelectFrame(frames[0].Id);
    }

    private async Task SelectFrame(Guid frameId)
    {
        selectedFrameId = frameId;
        var detail = await DemoApi.GetFrameDetailAsync(frameId);
        currentFrameHtml = detail?.HtmlContent;

        // Show annotations for the step that uses this frame
        var step = steps.FirstOrDefault(s => s.FrameId == frameId);
        currentAnnotations = step?.Annotations;
        selectedStepId = step?.Id;
    }

    private void SelectStep(Guid stepId)
    {
        selectedStepId = stepId;
        var step = steps.FirstOrDefault(s => s.Id == stepId);
        if (step != null)
        {
            selectedFrameId = step.FrameId;
            currentAnnotations = step.Annotations;
            _ = SelectFrame(step.FrameId);
        }
    }

    private async Task AddFrame()
    {
        // Trigger file input via JS interop would be ideal,
        // but for MVP use a simple HTML content input
        // The upload will be handled when the user selects a file
        Notification.Notify(NotificationSeverity.Info, "Upload", "Use the API to upload HTML frames for now.");
    }

    private async Task AddStep()
    {
        if (selectedFrameId == null) return;

        var newStep = new StepDto(
            null, selectedFrameId.Value, steps.Count + 1,
            null, NavigationAction.NextStep, null, []);

        var allSteps = steps.Select(s => new StepDto(
            s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
            s.NavigationAction, s.NavigationTarget,
            s.Annotations.Select(a => new AnnotationDto(
                a.Id, a.Type, a.Title, a.Content,
                a.PositionX, a.PositionY, a.Width, a.Height, a.Style)).ToList()
        )).Append(newStep).ToList();

        await DemoApi.UpdateStepsAsync(DemoId, new UpdateStepsRequest(allSteps));
        steps = await DemoApi.GetStepsAsync(DemoId);
        Notification.Notify(NotificationSeverity.Success, "Step added");
    }

    private async Task SaveSteps()
    {
        saving = true;
        var stepDtos = steps.Select(s => new StepDto(
            s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
            s.NavigationAction, s.NavigationTarget,
            s.Annotations.Select(a => new AnnotationDto(
                a.Id, a.Type, a.Title, a.Content,
                a.PositionX, a.PositionY, a.Width, a.Height, a.Style)).ToList()
        )).ToList();

        await DemoApi.UpdateStepsAsync(DemoId, new UpdateStepsRequest(stepDtos));
        Notification.Notify(NotificationSeverity.Success, "Saved", "Steps saved successfully.");
        saving = false;
    }

    private async Task PublishDemo()
    {
        await DemoApi.PublishDemoAsync(DemoId);
        demo = await DemoApi.GetDemoAsync(DemoId);
        Notification.Notify(NotificationSeverity.Success, "Published", $"Demo is live at /demo/{demo?.Slug}");
    }
}
```

- [ ] **Step 13: Create DemoSettings page**

`src/NavTour.Client/Pages/DemoSettings.razor`:
```razor
@page "/demos/{DemoId:guid}/settings"
@inject DemoApiService DemoApi
@inject NavigationManager Nav
@inject NotificationService Notification
@inject AuthService Auth

<RadzenStack Gap="16px" Style="max-width:600px">
    <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" Gap="8px">
        <RadzenButton Icon="arrow_back" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
            Click='() => Nav.NavigateTo($"/demos/{DemoId}/edit")' />
        <RadzenText TextStyle="TextStyle.H5">Demo Settings</RadzenText>
    </RadzenStack>

    @if (demo != null)
    {
        <RadzenCard>
            <RadzenStack Gap="12px">
                <RadzenFormField Text="Name">
                    <RadzenTextBox @bind-Value="name" Style="width:100%" />
                </RadzenFormField>
                <RadzenFormField Text="Description">
                    <RadzenTextArea @bind-Value="description" Style="width:100%" Rows="3" />
                </RadzenFormField>
                <RadzenFormField Text="Slug (URL path)">
                    <RadzenTextBox Value="@demo.Slug" Disabled="true" Style="width:100%" />
                </RadzenFormField>
                <RadzenFormField Text="Language">
                    <RadzenDropDown @bind-Value="locale" Data="@locales" Style="width:100%" />
                </RadzenFormField>
                <RadzenButton Text="Save Changes" ButtonStyle="ButtonStyle.Primary" Click="Save" IsBusy="saving" />
            </RadzenStack>
        </RadzenCard>

        <RadzenCard>
            <RadzenStack Gap="8px">
                <RadzenText TextStyle="TextStyle.H6" Style="color:var(--rz-danger)">Danger Zone</RadzenText>
                <RadzenButton Text="Delete Demo" ButtonStyle="ButtonStyle.Danger" Variant="Variant.Outlined" Click="DeleteDemo" />
            </RadzenStack>
        </RadzenCard>
    }
</RadzenStack>

@code {
    [Parameter] public Guid DemoId { get; set; }

    private DemoResponse? demo;
    private string name = "";
    private string? description;
    private string locale = "en";
    private bool saving;
    private List<string> locales = ["en", "es"];

    protected override async Task OnInitializedAsync()
    {
        if (!Auth.IsAuthenticated) { Nav.NavigateTo("/login"); return; }
        demo = await DemoApi.GetDemoAsync(DemoId);
        if (demo != null)
        {
            name = demo.Name;
            description = demo.Description;
            locale = demo.Locale;
        }
    }

    private async Task Save()
    {
        saving = true;
        await DemoApi.UpdateDemoAsync(DemoId, new UpdateDemoRequest(name, description, locale, null));
        Notification.Notify(NotificationSeverity.Success, "Saved");
        saving = false;
    }

    private async Task DeleteDemo()
    {
        await DemoApi.DeleteDemoAsync(DemoId);
        Nav.NavigateTo("/");
    }
}
```

- [ ] **Step 14: Create LeadsList page**

`src/NavTour.Client/Pages/LeadsList.razor`:
```razor
@page "/leads"
@inject HttpClient Http
@inject AuthService Auth
@inject NavigationManager Nav

<RadzenStack Gap="16px">
    <RadzenText TextStyle="TextStyle.H4">Captured Leads</RadzenText>

    @if (loading)
    {
        <RadzenProgressBarCircular ShowValue="false" Mode="ProgressBarMode.Indeterminate" />
    }
    else
    {
        <RadzenDataGrid Data="@leads" TItem="LeadResponse" AllowSorting="true" AllowPaging="true" PageSize="25">
            <Columns>
                <RadzenDataGridColumn Property="Email" Title="Email" />
                <RadzenDataGridColumn Property="Name" Title="Name" />
                <RadzenDataGridColumn Property="Company" Title="Company" />
                <RadzenDataGridColumn Property="DemoName" Title="Demo" />
                <RadzenDataGridColumn Property="CapturedAt" Title="Captured" FormatString="{0:g}" />
            </Columns>
        </RadzenDataGrid>
    }
</RadzenStack>

@code {
    private List<LeadResponse> leads = [];
    private bool loading = true;

    protected override async Task OnInitializedAsync()
    {
        if (!Auth.IsAuthenticated) { Nav.NavigateTo("/login"); return; }
        leads = await Http.GetFromJsonAsync<List<LeadResponse>>("api/v1/leads") ?? [];
        loading = false;
    }
}
```

- [ ] **Step 15: Build and verify**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

- [ ] **Step 16: Commit Builder UI**

```bash
git add src/NavTour.Client/
git commit -m "feat: demo builder UI — dashboard, editor, settings, leads pages with Radzen components"
```

---

### Task 5: Demo Player (Agent 5)

**Owner:** Agent 5 (Player)
**Blocked by:** Task 1
**Files to create:**
- `src/NavTour.Server/Services/IPlayerService.cs`
- `src/NavTour.Server/Services/PlayerService.cs`
- `src/NavTour.Server/Controllers/PlayerController.cs`
- `src/NavTour.Client/Services/PlayerApiService.cs`
- `src/NavTour.Client/Pages/Player.razor`
- `src/NavTour.Client/Components/PlayerOverlay.razor`
- `src/NavTour.Client/Components/LeadCaptureForm.razor`

---

- [ ] **Step 1: Create PlayerService**

`src/NavTour.Server/Services/IPlayerService.cs`:
```csharp
using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public interface IPlayerService
{
    Task<PlayerManifestResponse?> GetManifestAsync(string slug);
    Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId);
}
```

`src/NavTour.Server/Services/PlayerService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Leads;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class PlayerService : IPlayerService
{
    private readonly NavTourDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public PlayerService(NavTourDbContext db, ITenantProvider tenantProvider)
    {
        _db = db;
        _tenantProvider = tenantProvider;
    }

    public async Task<PlayerManifestResponse?> GetManifestAsync(string slug)
    {
        // Player queries bypass tenant filter — find demo by slug across all tenants
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .Where(d => d.Slug == slug && d.Status == DemoStatus.Published && !d.IsDeleted)
            .FirstOrDefaultAsync();

        if (demo == null) return null;

        // Increment view count
        demo.ViewCount++;
        await _db.SaveChangesAsync();

        // Set tenant context for subsequent queries
        _tenantProvider.SetTenantId(demo.TenantId);

        var frames = await _db.Frames
            .Where(f => f.DemoId == demo.Id)
            .OrderBy(f => f.SequenceOrder)
            .Select(f => new PlayerFrameDto(f.Id, f.SequenceOrder, f.HtmlContent, f.CssContent))
            .ToListAsync();

        var steps = await _db.Steps
            .Where(s => s.DemoId == demo.Id)
            .Include(s => s.Annotations)
            .OrderBy(s => s.StepNumber)
            .Select(s => new PlayerStepDto(
                s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
                s.NavigationAction, s.NavigationTarget,
                s.Annotations.Where(a => !a.IsDeleted).Select(a => new PlayerAnnotationDto(
                    a.Type, a.Title, a.Content,
                    a.PositionX, a.PositionY, a.Width, a.Height, a.Style
                )).ToList()))
            .ToListAsync();

        return new PlayerManifestResponse(demo.Name, demo.Slug, demo.Settings, frames, steps);
    }

    public async Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

        var lead = new Lead
        {
            TenantId = demo.TenantId,
            SessionId = sessionId,
            Email = request.Email,
            Name = request.Name,
            Company = request.Company,
            CustomData = request.CustomData
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();
        return lead.Id;
    }
}
```

- [ ] **Step 2: Create PlayerController**

`src/NavTour.Server/Controllers/PlayerController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.DTOs.Leads;
using NavTour.Shared.DTOs.Player;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/player")]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayerController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    [HttpGet("{slug}/manifest")]
    public async Task<ActionResult<PlayerManifestResponse>> GetManifest(string slug)
    {
        var manifest = await _playerService.GetManifestAsync(slug);
        return manifest == null ? NotFound() : Ok(manifest);
    }

    [HttpPost("{slug}/leads")]
    public async Task<ActionResult> CaptureLead(string slug, LeadCaptureRequest request, [FromQuery] Guid? sessionId)
    {
        var leadId = await _playerService.RecordLeadAsync(slug, request, sessionId ?? Guid.NewGuid());
        return Ok(new { leadId });
    }
}
```

- [ ] **Step 3: Create PlayerApiService (client)**

`src/NavTour.Client/Services/PlayerApiService.cs`:
```csharp
using System.Net.Http.Json;
using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Client.Services;

public class PlayerApiService
{
    private readonly HttpClient _http;

    public PlayerApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<PlayerManifestResponse?> GetManifestAsync(string slug)
        => await _http.GetFromJsonAsync<PlayerManifestResponse>($"api/v1/player/{slug}/manifest");

    public async Task<Guid?> SendEventsAsync(string slug, EventBatchRequest batch)
    {
        var response = await _http.PostAsJsonAsync($"api/v1/player/{slug}/events", batch);
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<EventBatchResponse>();
            return result?.SessionId;
        }
        return null;
    }

    public async Task CaptureLead(string slug, LeadCaptureRequest request, Guid? sessionId)
    {
        await _http.PostAsJsonAsync($"api/v1/player/{slug}/leads?sessionId={sessionId}", request);
    }
}
```

- [ ] **Step 4: Register player services**

Add to `src/NavTour.Server/Program.cs`:
```csharp
builder.Services.AddScoped<IPlayerService, PlayerService>();
```

Add to `src/NavTour.Client/Program.cs`:
```csharp
builder.Services.AddScoped<PlayerApiService>();
```

- [ ] **Step 5: Create LeadCaptureForm component**

`src/NavTour.Client/Components/LeadCaptureForm.razor`:
```razor
<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center">
    <RadzenCard Style="width:400px;padding:24px">
        <RadzenStack Gap="16px">
            <RadzenText TextStyle="TextStyle.H5">Want to learn more?</RadzenText>
            <RadzenText>Enter your details to continue.</RadzenText>
            <RadzenTextBox @bind-Value="email" Placeholder="Email *" Style="width:100%" />
            <RadzenTextBox @bind-Value="name" Placeholder="Name" Style="width:100%" />
            <RadzenTextBox @bind-Value="company" Placeholder="Company" Style="width:100%" />
            <RadzenButton Text="Continue" ButtonStyle="ButtonStyle.Primary" Style="width:100%" Click="Submit" Disabled="@string.IsNullOrWhiteSpace(email)" />
            <RadzenButton Text="Skip" ButtonStyle="ButtonStyle.Light" Variant="Variant.Text" Style="width:100%" Click="() => OnSkip.InvokeAsync()" />
        </RadzenStack>
    </RadzenCard>
</div>

@code {
    [Parameter] public EventCallback<LeadCaptureRequest> OnSubmit { get; set; }
    [Parameter] public EventCallback OnSkip { get; set; }

    private string email = "";
    private string? name;
    private string? company;

    private async Task Submit()
    {
        await OnSubmit.InvokeAsync(new LeadCaptureRequest(email, name, company, null));
    }
}
```

- [ ] **Step 6: Create PlayerOverlay component**

`src/NavTour.Client/Components/PlayerOverlay.razor`:
```razor
@using NavTour.Shared.DTOs.Player

@foreach (var annotation in Annotations)
{
    <div style="position:absolute;left:@(annotation.PositionX)%;top:@(annotation.PositionY)%;width:@(annotation.Width)%;height:@(annotation.Height)%;z-index:10;pointer-events:none">
        @switch (annotation.Type)
        {
            case AnnotationType.Tooltip:
                var tooltipStyle = ParseStyle(annotation.Style);
                <div style="background:@tooltipStyle.GetValueOrDefault("backgroundColor", "#1a1a2e");color:@tooltipStyle.GetValueOrDefault("textColor", "#fff");border-radius:@tooltipStyle.GetValueOrDefault("borderRadius", "8px");padding:12px 16px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
                    @if (annotation.Title != null) { <strong>@annotation.Title</strong> }
                    @if (annotation.Content != null) { <p style="margin:4px 0 0">@annotation.Content</p> }
                </div>
                break;

            case AnnotationType.Modal:
                <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
                    @if (annotation.Title != null) { <h3 style="margin:0 0 8px">@annotation.Title</h3> }
                    @if (annotation.Content != null) { <p style="margin:0">@annotation.Content</p> }
                </div>
                break;

            case AnnotationType.Hotspot:
                <div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.5);border:3px solid #3b82f6;animation:pulse 2s infinite"></div>
                break;

            case AnnotationType.Blur:
                <div style="width:100%;height:100%;backdrop-filter:blur(8px);background:rgba(0,0,0,0.1);border-radius:4px"></div>
                break;
        }
    </div>
}

@code {
    [Parameter] public List<PlayerAnnotationDto> Annotations { get; set; } = [];

    private Dictionary<string, string> ParseStyle(string? style)
    {
        if (string.IsNullOrEmpty(style)) return [];
        try { return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(style) ?? []; }
        catch { return []; }
    }
}
```

- [ ] **Step 7: Create Player page**

`src/NavTour.Client/Pages/Player.razor`:
```razor
@page "/demo/{Slug}"
@layout PlayerLayout
@inject PlayerApiService PlayerApi
@inject NavigationManager Nav
@implements IDisposable

<div @onkeydown="HandleKeyDown" tabindex="0" @ref="playerContainer" style="outline:none">
@if (loading)
{
    <div style="display:flex;align-items:center;justify-content:center;height:100vh">
        <RadzenProgressBarCircular ShowValue="false" Mode="ProgressBarMode.Indeterminate" Size="64" />
    </div>
}
else if (manifest == null)
{
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px">
        <RadzenText TextStyle="TextStyle.H4">Demo Not Found</RadzenText>
        <RadzenText>This demo may have been removed or is not yet published.</RadzenText>
    </div>
}
else
{
    @* Player chrome *@
    <div style="display:flex;flex-direction:column;height:100vh;background:#f5f5f5">
        @* Header bar *@
        <div style="display:flex;align-items:center;padding:8px 16px;background:white;border-bottom:1px solid #e0e0e0;gap:12px">
            <span style="font-weight:600;font-size:14px;color:#666">NavTour</span>
            <span style="font-size:14px;font-weight:500">@manifest.DemoName</span>
            <div style="flex:1"></div>
            <span style="font-size:13px;color:#999">@(currentStepIndex + 1) / @manifest.Steps.Count</span>
        </div>

        @* Frame content with overlays *@
        <div style="flex:1;position:relative;overflow:hidden">
            @if (currentFrame != null)
            {
                <iframe sandbox="allow-same-origin" style="width:100%;height:100%;border:none"
                    srcdoc="@currentFrame.HtmlContent"></iframe>
            }

            @if (currentStep != null)
            {
                <PlayerOverlay Annotations="currentStep.Annotations" />
            }
        </div>

        @* Progress bar and navigation *@
        <div style="display:flex;align-items:center;padding:8px 16px;background:white;border-top:1px solid #e0e0e0;gap:12px">
            <RadzenButton Text="Back" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
                Disabled="@(currentStepIndex <= 0)" Click="PreviousStep" />
            <div style="flex:1">
                <RadzenProgressBar Value="@progressPercent" ShowValue="false" Style="height:6px" />
            </div>
            <RadzenText TextStyle="TextStyle.Caption">Step @(currentStepIndex + 1) of @manifest.Steps.Count</RadzenText>
            <RadzenButton Text="@(currentStepIndex >= manifest.Steps.Count - 1 ? "Finish" : "Next")"
                ButtonStyle="ButtonStyle.Primary" Size="ButtonSize.Small" Click="NextStep" />
        </div>
    </div>

    @if (showLeadForm)
    {
        <LeadCaptureForm OnSubmit="SubmitLead" OnSkip="SkipLead" />
    }
}
</div>

@code {
    [Parameter] public string Slug { get; set; } = "";

    private PlayerManifestResponse? manifest;
    private bool loading = true;
    private int currentStepIndex;
    private Guid? sessionId;
    private bool showLeadForm;
    private DateTime stepStartTime = DateTime.UtcNow;
    private List<SessionEventDto> eventBuffer = [];
    private System.Threading.Timer? flushTimer;
    private ElementReference playerContainer;

    private PlayerStepDto? currentStep => manifest?.Steps.ElementAtOrDefault(currentStepIndex);
    private PlayerFrameDto? currentFrame => currentStep != null
        ? manifest?.Frames.FirstOrDefault(f => f.Id == currentStep.FrameId)
        : null;
    private double progressPercent => manifest?.Steps.Count > 0
        ? (double)(currentStepIndex + 1) / manifest.Steps.Count * 100
        : 0;

    protected override async Task OnInitializedAsync()
    {
        manifest = await PlayerApi.GetManifestAsync(Slug);
        loading = false;

        if (manifest != null)
        {
            // Fire DemoStarted event
            BufferEvent(EventType.DemoStarted, null, null);
            BufferEvent(EventType.StepViewed, 1, null);
            stepStartTime = DateTime.UtcNow;

            // Flush events every 5 seconds
            flushTimer = new System.Threading.Timer(async _ => await FlushEvents(), null, 5000, 5000);
        }
    }

    private void HandleKeyDown(KeyboardEventArgs e)
    {
        if (e.Key == "ArrowRight" || e.Key == "Right") _ = NextStep();
        else if (e.Key == "ArrowLeft" || e.Key == "Left") _ = PreviousStep();
    }

    private async Task NextStep()
    {
        if (manifest == null) return;

        var step = currentStep;
        var timeOnStep = (int)(DateTime.UtcNow - stepStartTime).TotalMilliseconds;
        BufferEvent(EventType.StepCompleted, currentStepIndex + 1, $"{{\"timeOnStepMs\":{timeOnStep}}}");

        // Handle NavigationAction
        if (step != null)
        {
            switch (step.NavigationAction)
            {
                case NavigationAction.NextStep:
                    if (currentStepIndex >= manifest.Steps.Count - 1)
                    {
                        BufferEvent(EventType.DemoCompleted, null, null);
                        await FlushEvents();
                        showLeadForm = true;
                        return;
                    }
                    currentStepIndex++;
                    break;

                case NavigationAction.GoToStep:
                    if (int.TryParse(step.NavigationTarget, out var targetStep))
                        currentStepIndex = manifest.Steps.FindIndex(s => s.StepNumber == targetStep);
                    break;

                case NavigationAction.PreviousStep:
                    if (currentStepIndex > 0) currentStepIndex--;
                    break;

                case NavigationAction.EndDemo:
                    BufferEvent(EventType.DemoCompleted, null, null);
                    await FlushEvents();
                    showLeadForm = true;
                    return;

                case NavigationAction.OpenUrl:
                    if (step.NavigationTarget != null)
                        Nav.NavigateTo(step.NavigationTarget, true);
                    return;
            }
        }

        stepStartTime = DateTime.UtcNow;
        BufferEvent(EventType.StepViewed, currentStepIndex + 1, null);
        StateHasChanged();
    }

    private Task PreviousStep()
    {
        if (currentStepIndex > 0)
        {
            currentStepIndex--;
            stepStartTime = DateTime.UtcNow;
            BufferEvent(EventType.StepViewed, currentStepIndex + 1, null);
            StateHasChanged();
        }
        return Task.CompletedTask;
    }

    private void BufferEvent(EventType type, int? stepNumber, string? data)
    {
        eventBuffer.Add(new SessionEventDto(type, stepNumber, data, DateTime.UtcNow));
    }

    private async Task FlushEvents()
    {
        if (eventBuffer.Count == 0) return;
        var batch = new EventBatchRequest(sessionId, null, [.. eventBuffer]);
        eventBuffer.Clear();
        var result = await PlayerApi.SendEventsAsync(Slug, batch);
        if (result.HasValue) sessionId = result.Value;
    }

    private async Task SubmitLead(LeadCaptureRequest request)
    {
        BufferEvent(EventType.LeadSubmitted, null, null);
        await FlushEvents();
        await PlayerApi.CaptureLead(Slug, request, sessionId);
        showLeadForm = false;
    }

    private void SkipLead()
    {
        showLeadForm = false;
    }

    public void Dispose()
    {
        flushTimer?.Dispose();
        // Fire-and-forget final flush
        _ = FlushEvents();
    }
}
```

- [ ] **Step 8: Create PlayerLayout (minimal layout for player)**

`src/NavTour.Client/Layout/PlayerLayout.razor`:
```razor
@inherits LayoutComponentBase

@Body
```

- [ ] **Step 9: Build and verify**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

- [ ] **Step 10: Commit Player**

```bash
git add src/NavTour.Server/Services/IPlayerService.cs src/NavTour.Server/Services/PlayerService.cs src/NavTour.Server/Controllers/PlayerController.cs src/NavTour.Client/
git commit -m "feat: demo player — manifest endpoint, frame rendering, overlays, lead capture"
```

---

## Chunk 4: Task 6 — Analytics Engine + Final Integration

### Task 6: Analytics Engine (Agent 6)

**Owner:** Agent 6 (Analytics)
**Blocked by:** Task 1
**Files to create:**
- `src/NavTour.Server/Services/IAnalyticsService.cs`
- `src/NavTour.Server/Services/AnalyticsService.cs`
- `src/NavTour.Server/Services/ILeadService.cs`
- `src/NavTour.Server/Services/LeadService.cs`
- `src/NavTour.Server/Controllers/AnalyticsController.cs`
- `src/NavTour.Server/Controllers/LeadsController.cs`
- `src/NavTour.Client/Services/AnalyticsApiService.cs`
- `src/NavTour.Client/Pages/DemoAnalytics.razor`

---

- [ ] **Step 1: Create AnalyticsService**

`src/NavTour.Server/Services/IAnalyticsService.cs`:
```csharp
using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Server.Services;

public interface IAnalyticsService
{
    Task<EventBatchResponse> IngestEventsAsync(string slug, EventBatchRequest request, string? ipAddress, string? userAgent);
    Task<AnalyticsSummaryResponse> GetSummaryAsync(Guid demoId);
    Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId);
}
```

`src/NavTour.Server/Services/AnalyticsService.cs`:
```csharp
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly NavTourDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public AnalyticsService(NavTourDbContext db, ITenantProvider tenantProvider)
    {
        _db = db;
        _tenantProvider = tenantProvider;
    }

    public async Task<EventBatchResponse> IngestEventsAsync(string slug, EventBatchRequest request, string? ipAddress, string? userAgent)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

        _tenantProvider.SetTenantId(demo.TenantId);

        // Find or create session
        DemoSession? session = null;
        if (request.SessionId.HasValue && request.SessionId != Guid.Empty)
        {
            session = await _db.DemoSessions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value);
        }

        if (session == null)
        {
            var fingerprint = request.ViewerFingerprint ?? GenerateFingerprint(ipAddress, userAgent, demo.Id);

            // Check for existing session within 30 min window
            var cutoff = DateTime.UtcNow.AddMinutes(-30);
            session = await _db.DemoSessions
                .IgnoreQueryFilters()
                .Where(s => s.DemoId == demo.Id && s.ViewerFingerprint == fingerprint && s.StartedAt > cutoff)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                session = new DemoSession
                {
                    TenantId = demo.TenantId,
                    DemoId = demo.Id,
                    ViewerFingerprint = fingerprint,
                    Source = request.Events.FirstOrDefault()?.EventData
                };
                _db.DemoSessions.Add(session);
            }
        }

        // Add events
        foreach (var evt in request.Events)
        {
            _db.SessionEvents.Add(new SessionEvent
            {
                TenantId = demo.TenantId,
                SessionId = session.Id,
                EventType = evt.EventType,
                StepNumber = evt.StepNumber,
                EventData = evt.EventData,
                OccurredAt = evt.OccurredAt
            });

            if (evt.EventType == EventType.DemoCompleted)
            {
                session.CompletedAt = evt.OccurredAt;
            }
        }

        await _db.SaveChangesAsync();
        return new EventBatchResponse(session.Id);
    }

    public async Task<AnalyticsSummaryResponse> GetSummaryAsync(Guid demoId)
    {
        var sessions = await _db.DemoSessions
            .Where(s => s.DemoId == demoId)
            .ToListAsync();

        var totalViews = sessions.Count;
        var completions = sessions.Count(s => s.CompletedAt.HasValue);
        var avgTime = sessions
            .Where(s => s.CompletedAt.HasValue)
            .Select(s => (s.CompletedAt!.Value - s.StartedAt).TotalSeconds)
            .DefaultIfEmpty(0)
            .Average();
        var completionRate = totalViews > 0 ? (double)completions / totalViews * 100 : 0;

        // Views over time (last 30 days)
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;
        var viewsOverTime = sessions
            .Where(s => s.StartedAt >= thirtyDaysAgo)
            .GroupBy(s => s.StartedAt.Date)
            .Select(g => new DailyViewCount(g.Key, g.Count()))
            .OrderBy(d => d.Date)
            .ToList();

        // Step funnel
        var events = await _db.SessionEvents
            .Where(e => _db.DemoSessions.Any(s => s.DemoId == demoId && s.Id == e.SessionId))
            .Where(e => e.StepNumber.HasValue)
            .ToListAsync();

        var funnel = events
            .GroupBy(e => e.StepNumber!.Value)
            .Select(g => new StepFunnelEntry(
                g.Key,
                g.Count(e => e.EventType == EventType.StepViewed),
                g.Count(e => e.EventType == EventType.StepCompleted)))
            .OrderBy(f => f.StepNumber)
            .ToList();

        // Top sources
        var topSources = sessions
            .Where(s => s.Source != null)
            .GroupBy(s => s.Source!)
            .Select(g => new SourceEntry(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .Take(10)
            .ToList();

        return new AnalyticsSummaryResponse(totalViews, completions, avgTime, completionRate, viewsOverTime, funnel, topSources);
    }

    public async Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId)
    {
        var query = _db.DemoSessions.AsQueryable();
        if (demoId.HasValue)
            query = query.Where(s => s.DemoId == demoId.Value);

        return await query
            .OrderByDescending(s => s.StartedAt)
            .Take(100)
            .Select(s => new SessionListResponse(
                s.Id, s.StartedAt, s.CompletedAt,
                s.Events.Count(e => e.EventType == EventType.StepViewed),
                _db.Steps.Count(st => st.DemoId == s.DemoId),
                s.CompletedAt.HasValue,
                s.Source))
            .ToListAsync();
    }

    private static string GenerateFingerprint(string? ip, string? ua, Guid demoId)
    {
        var raw = $"{ip ?? "unknown"}|{ua ?? "unknown"}|{demoId}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexStringLower(hash)[..32];
    }
}
```

- [ ] **Step 2: Create LeadService**

`src/NavTour.Server/Services/ILeadService.cs`:
```csharp
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public interface ILeadService
{
    Task<List<LeadResponse>> GetAllAsync();
}
```

`src/NavTour.Server/Services/LeadService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public class LeadService : ILeadService
{
    private readonly NavTourDbContext _db;

    public LeadService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<LeadResponse>> GetAllAsync()
    {
        return await _db.Leads
            .Include(l => l.Session)
            .Select(l => new LeadResponse(
                l.Id, l.Email, l.Name, l.Company, l.CustomData,
                l.Session.DemoId,
                _db.Demos.Where(d => d.Id == l.Session.DemoId).Select(d => d.Name).FirstOrDefault() ?? "",
                l.CreatedAt))
            .OrderByDescending(l => l.CapturedAt)
            .ToListAsync();
    }
}
```

- [ ] **Step 3: Create AnalyticsController**

`src/NavTour.Server/Controllers/AnalyticsController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Server.Controllers;

[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpPost("api/v1/player/{slug}/events")]
    public async Task<ActionResult<EventBatchResponse>> IngestEvents(string slug, EventBatchRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = HttpContext.Request.Headers.UserAgent.ToString();
        var result = await _analyticsService.IngestEventsAsync(slug, request, ip, ua);
        return Ok(result);
    }

    [HttpGet("api/v1/demos/{demoId:guid}/analytics")]
    [Authorize]
    public async Task<ActionResult<AnalyticsSummaryResponse>> GetSummary(Guid demoId)
    {
        return Ok(await _analyticsService.GetSummaryAsync(demoId));
    }

    [HttpGet("api/v1/analytics/sessions")]
    [Authorize]
    public async Task<ActionResult<List<SessionListResponse>>> GetSessions([FromQuery] Guid? demoId)
    {
        return Ok(await _analyticsService.GetSessionsAsync(demoId));
    }
}
```

- [ ] **Step 4: Create LeadsController**

`src/NavTour.Server/Controllers/LeadsController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeadResponse>>> GetAll()
    {
        return Ok(await _leadService.GetAllAsync());
    }
}
```

- [ ] **Step 5: Create AnalyticsApiService (client)**

`src/NavTour.Client/Services/AnalyticsApiService.cs`:
```csharp
using System.Net.Http.Json;
using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Client.Services;

public class AnalyticsApiService
{
    private readonly HttpClient _http;

    public AnalyticsApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<AnalyticsSummaryResponse?> GetSummaryAsync(Guid demoId)
        => await _http.GetFromJsonAsync<AnalyticsSummaryResponse>($"api/v1/demos/{demoId}/analytics");

    public async Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId = null)
    {
        var url = demoId.HasValue ? $"api/v1/analytics/sessions?demoId={demoId}" : "api/v1/analytics/sessions";
        return await _http.GetFromJsonAsync<List<SessionListResponse>>(url) ?? [];
    }
}
```

- [ ] **Step 6: Create DemoAnalytics page**

`src/NavTour.Client/Pages/DemoAnalytics.razor`:
```razor
@page "/demos/{DemoId:guid}/analytics"
@inject AnalyticsApiService AnalyticsApi
@inject DemoApiService DemoApi
@inject HttpClient Http
@inject AuthService Auth
@inject NavigationManager Nav

<RadzenStack Gap="16px">
    <RadzenStack Orientation="Orientation.Horizontal" AlignItems="AlignItems.Center" Gap="8px">
        <RadzenButton Icon="arrow_back" ButtonStyle="ButtonStyle.Light" Size="ButtonSize.Small"
            Click='() => Nav.NavigateTo($"/demos/{DemoId}/edit")' />
        <RadzenText TextStyle="TextStyle.H4">Analytics: @(demo?.Name ?? "...")</RadzenText>
    </RadzenStack>

    @if (loading)
    {
        <RadzenProgressBarCircular ShowValue="false" Mode="ProgressBarMode.Indeterminate" />
    }
    else if (summary != null)
    {
        @* Stat cards *@
        <RadzenRow Gap="16px">
            <RadzenColumn Size="3">
                <RadzenCard Style="text-align:center">
                    <RadzenText TextStyle="TextStyle.H3">@summary.TotalViews</RadzenText>
                    <RadzenText TextStyle="TextStyle.Caption">Total Views</RadzenText>
                </RadzenCard>
            </RadzenColumn>
            <RadzenColumn Size="3">
                <RadzenCard Style="text-align:center">
                    <RadzenText TextStyle="TextStyle.H3">@summary.Completions</RadzenText>
                    <RadzenText TextStyle="TextStyle.Caption">Completions</RadzenText>
                </RadzenCard>
            </RadzenColumn>
            <RadzenColumn Size="3">
                <RadzenCard Style="text-align:center">
                    <RadzenText TextStyle="TextStyle.H3">@summary.CompletionRate.ToString("F1")%</RadzenText>
                    <RadzenText TextStyle="TextStyle.Caption">Completion Rate</RadzenText>
                </RadzenCard>
            </RadzenColumn>
            <RadzenColumn Size="3">
                <RadzenCard Style="text-align:center">
                    <RadzenText TextStyle="TextStyle.H3">@TimeSpan.FromSeconds(summary.AvgTimeSeconds).ToString(@"m\:ss")</RadzenText>
                    <RadzenText TextStyle="TextStyle.Caption">Avg Time</RadzenText>
                </RadzenCard>
            </RadzenColumn>
        </RadzenRow>

        @* Views over time chart *@
        <RadzenCard>
            <RadzenText TextStyle="TextStyle.H6">Views Over Time</RadzenText>
            <RadzenChart Style="height:250px">
                <RadzenLineSeries Data="@summary.ViewsOverTime" CategoryProperty="Date" ValueProperty="Count" Title="Views" />
                <RadzenCategoryAxis FormatString="{0:MMM dd}" />
                <RadzenValueAxis />
            </RadzenChart>
        </RadzenCard>

        @* Step funnel *@
        @if (summary.Funnel.Count > 0)
        {
            <RadzenCard>
                <RadzenText TextStyle="TextStyle.H6">Step Funnel</RadzenText>
                <RadzenChart Style="height:250px">
                    <RadzenBarSeries Data="@summary.Funnel" CategoryProperty="StepNumber" ValueProperty="ViewCount" Title="Viewed" />
                    <RadzenBarSeries Data="@summary.Funnel" CategoryProperty="StepNumber" ValueProperty="CompletionCount" Title="Completed" />
                    <RadzenCategoryAxis />
                    <RadzenValueAxis />
                    <RadzenLegend Visible="true" />
                </RadzenChart>
            </RadzenCard>
        }

        @* Top sources *@
        @if (summary.TopSources.Count > 0)
        {
            <RadzenCard>
                <RadzenText TextStyle="TextStyle.H6">Top Sources</RadzenText>
                <RadzenDataGrid Data="@summary.TopSources" TItem="SourceEntry">
                    <Columns>
                        <RadzenDataGridColumn Property="Source" Title="Source" />
                        <RadzenDataGridColumn Property="Count" Title="Views" Width="100px" />
                    </Columns>
                </RadzenDataGrid>
            </RadzenCard>
        }

        @* Leads count *@
        <RadzenCard>
            <RadzenStack Orientation="Orientation.Horizontal" JustifyContent="JustifyContent.SpaceBetween" AlignItems="AlignItems.Center">
                <RadzenStack>
                    <RadzenText TextStyle="TextStyle.H6">Leads Captured</RadzenText>
                    <RadzenText TextStyle="TextStyle.H3">@leadCount</RadzenText>
                </RadzenStack>
                <RadzenButton Text="View All Leads" ButtonStyle="ButtonStyle.Light" Click='() => Nav.NavigateTo("/leads")' />
            </RadzenStack>
        </RadzenCard>

        @* Recent sessions *@
        <RadzenCard>
            <RadzenText TextStyle="TextStyle.H6">Recent Sessions</RadzenText>
            <RadzenDataGrid Data="@sessions" TItem="SessionListResponse" AllowPaging="true" PageSize="10">
                <Columns>
                    <RadzenDataGridColumn Property="StartedAt" Title="Started" FormatString="{0:g}" />
                    <RadzenDataGridColumn Property="StepsViewed" Title="Steps Viewed" Width="120px" />
                    <RadzenDataGridColumn Property="Completed" Title="Completed" Width="100px">
                        <Template Context="session">
                            <RadzenBadge Text="@(session.Completed ? "Yes" : "No")"
                                BadgeStyle="@(session.Completed ? BadgeStyle.Success : BadgeStyle.Light)" />
                        </Template>
                    </RadzenDataGridColumn>
                    <RadzenDataGridColumn Property="Source" Title="Source" />
                </Columns>
            </RadzenDataGrid>
        </RadzenCard>
    }
</RadzenStack>

@code {
    [Parameter] public Guid DemoId { get; set; }

    private DemoResponse? demo;
    private AnalyticsSummaryResponse? summary;
    private List<SessionListResponse> sessions = [];
    private int leadCount;
    private bool loading = true;

    protected override async Task OnInitializedAsync()
    {
        if (!Auth.IsAuthenticated) { Nav.NavigateTo("/login"); return; }
        demo = await DemoApi.GetDemoAsync(DemoId);
        summary = await AnalyticsApi.GetSummaryAsync(DemoId);
        sessions = await AnalyticsApi.GetSessionsAsync(DemoId);
        var leads = await Http.GetFromJsonAsync<List<LeadResponse>>("api/v1/leads");
        leadCount = leads?.Count ?? 0;
        loading = false;
    }
}
```

- [ ] **Step 7: Register analytics services**

Add to `src/NavTour.Server/Program.cs`:
```csharp
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ILeadService, LeadService>();
```

Add to `src/NavTour.Client/Program.cs`:
```csharp
builder.Services.AddScoped<AnalyticsApiService>();
```

- [ ] **Step 8: Build and verify**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

- [ ] **Step 9: Commit Analytics**

```bash
git add src/NavTour.Server/Services/IAnalyticsService.cs src/NavTour.Server/Services/AnalyticsService.cs src/NavTour.Server/Services/ILeadService.cs src/NavTour.Server/Services/LeadService.cs src/NavTour.Server/Controllers/AnalyticsController.cs src/NavTour.Server/Controllers/LeadsController.cs src/NavTour.Client/Services/AnalyticsApiService.cs src/NavTour.Client/Pages/DemoAnalytics.razor src/NavTour.Server/Program.cs src/NavTour.Client/Program.cs
git commit -m "feat: analytics engine — event ingestion, summary dashboard, session tracking, leads"
```

---

### Task 7: Final Integration & Smoke Test

**Owner:** Main orchestrator (you)
**Blocked by:** Tasks 1-6
**No files to create — integration verification only**

**Important:** Since Agents 2-6 all modify `Program.cs` (adding service registrations and middleware), the orchestrator must merge these changes. Each agent adds registrations in clearly marked blocks. Resolve any conflicts in `Program.cs` before building.

Also: Agent 4 must delete `src/NavTour.Client/Pages/Index.razor` (created by Task 1 as placeholder) since `Dashboard.razor` takes over the `/` route.

- [ ] **Step 1: Full build verification**

```bash
cd D:/V3/Navtour
dotnet build NavTour.sln
```

Expected: 0 errors, 0 warnings (warnings acceptable for MVP)

- [ ] **Step 2: Run the application**

```bash
cd D:/V3/Navtour/src/NavTour.Server
dotnet run
```

Expected: App starts, database migrates and seeds, accessible at `https://localhost:5001`

- [ ] **Step 3: Smoke test checklist**

Verify in browser:
1. Home page loads with NavTour landing
2. Register a new account → redirects to dashboard
3. Login with `admin@navtour.io` / `NavTour123!` → see "Product Tour Example" in demo list
4. Click into demo editor → frame strip, preview, step panel render
5. Navigate to `/demo/product-tour-example` → player loads with 3 steps
6. Click through all 3 steps → lead capture form appears at end
7. Check analytics page for the demo → shows view count

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: NavTour MVP — complete interactive demo platform with builder, player, and analytics"
```
