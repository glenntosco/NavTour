# CLAUDE.md


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Design Standards
For any public-facing page, website, landing page, login screen, blog, 
or documentation site — ALWAYS load the `premium-website-design` skill 
before writing any CSS or layout code. Never use Bootstrap.

## Build & Run Commands

```bash
# Build
dotnet build                                                    # Build all projects
dotnet build src/NavTour.Server/NavTour.Server.csproj           # Build server only

# Run (serves at http://localhost:5017)
dotnet run --project src/NavTour.Server/NavTour.Server.csproj

# Test
dotnet test src/NavTour.Tests/NavTour.Tests.csproj              # Run all tests
dotnet test --filter "FullyQualifiedName~TestName"              # Run single test

# Database migrations (from src/NavTour.Server/)
dotnet ef migrations add MigrationName
dotnet ef database update

# Chrome Extension (from src/NavTour.Extension/)
npm run build                                                   # Bundle TypeScript with esbuild
npm run watch                                                   # Watch mode
```

## Architecture

**NavTour** is an interactive product demo platform (Navattic/Storylane competitor). .NET 10, Blazor, SQL Server, Radzen components.

### Project Structure

- **NavTour.Server** — ASP.NET Core backend: REST API controllers, EF Core services, Blazor SSR host, marketing pages
- **NavTour.Client** — Blazor interactive UI: demo builder, player, dashboard (all app pages)
- **NavTour.Shared** — DTOs, entities, enums shared between Server and Client
- **NavTour.Tests** — xUnit integration tests
- **NavTour.Extension** — Chrome Manifest V3 extension (TypeScript/esbuild) for capturing product screenshots as HTML/CSS snapshots

### Render Mode Split

This is critical to understand — the app has two rendering strategies:

- **App pages** (NavTour.Client/Pages/): Each page declares `@rendermode InteractiveServer` individually. Uses `MainLayout` with Radzen components. Requires auth.
- **Marketing pages** (NavTour.Server/Pages/Marketing/): Static SSR with no render mode (no SignalR circuit, no WASM download). Uses `MarketingLayout` with custom CSS.
- **App.razor** has `<Routes />` and `<HeadOutlet />` with NO global render mode — render mode is per-page/per-layout.

### Multi-Tenancy

Shared database with `TenantId` column on every entity. EF Core global query filters auto-scope all queries. `ITenantProvider` (scoped service) resolves current tenant from JWT claims. All entities inherit `TenantEntity` base class (TenantId, CreatedAt, ModifiedAt, IsDeleted).

### Authentication

Hybrid JWT + Cookie auth. Cookie name: `navtour_auth`. JWT Bearer header OR cookie fallback — `OnMessageReceived` in Program.cs reads the cookie and sets the token. `ApiKeyMiddleware` handles public player access.

### API Pattern

Controllers at `api/v1/{resource}` with `[Authorize]`. DTOs follow: `CreateXyzRequest`, `UpdateXyzRequest`, `XyzResponse`. Services layer between controllers and DbContext. `NavTourDbContext` extends `IdentityDbContext`.

### CSS/Styling

- **App**: Radzen Material theme with overrides in `NavTour.Client/wwwroot/css/app.css` (primary: `#4361ee`)
- **Marketing**: Custom `marketing.css` at `NavTour.Server/wwwroot/css/` with `.mkt` prefix and `--nt-*` CSS variables. Loaded only in `MarketingLayout.razor`.
- No Tailwind or utility framework.

### Key Domain Models

Demo → Frames (HTML/CSS snapshots) → Steps (guided interactions) → Annotations (tooltips, modals, hotspots, blur). DemoSession tracks viewer engagement. Lead captures form submissions. PersonalizationVariable enables `{{company}}`-style tokens.

### MCP Tools

- **Radzen Blazor MCP** (`mcp__radzen-blazor__search`): Use this to look up Radzen component APIs, properties, and usage patterns before guessing. Query it for correct component configuration (e.g., sidebar toggle, data grid features, form validation).

## Conventions

- Route Dashboard at `/dashboard` (not `/`). Marketing landing page owns `/`.
- All marketing pages use `@layout MarketingLayout` and `[AllowAnonymous]`.
- Soft deletes via `IsDeleted` flag — never hard-delete entities.
- DTO naming: `Create*Request`, `Update*Request`, `*Response`, `*ListItemResponse`.
- API versioning: all routes prefixed with `/api/v1/`.
- SSR forms on marketing pages use `[SupplyParameterFromForm]` pattern (not `@bind`).

## Deploy

GitHub Actions (`.github/workflows/main_navtour.yml`) builds on push to main and deploys to Azure Web App via `Azure/webapps-deploy@v3`.
