# NavTour — Interactive Demo Platform

**SaaS Product Architecture & Technical Specification**
P4 Software | Grupo Barrdega | Version 1.0 | March 2026
CONFIDENTIAL

---

## 1. Executive Summary

NavTour is an interactive product demo platform built as a true multi-tenant SaaS application on the P4 Software technology stack. It enables B2B SaaS companies to create, manage, and share interactive product demos that prospects can experience without logging into the actual product.

The interactive demo market is growing rapidly — Navattic reported over 40,000 demos built on their platform in 2025 (35% YoY growth). Today 18% of B2B SaaS websites feature an interactive demo CTA. Yet leading platforms charge $500–$1,000+/month with rigid annual contracts, creating a massive opportunity for a competitively priced, technically superior alternative.

NavTour differentiates through aggressive pricing, API-first architecture, multi-language support (English/Spanish with extensibility), and tight integration with the Grupo Barrdega ecosystem while serving the broader SaaS market.

| Metric | Value |
|--------|-------|
| Target Market | B2B SaaS Companies |
| Technology | .NET 10 / Blazor / MS SQL Server |
| MVP Timeline | 16 Weeks |
| Entry Price | $99/month |

---

## 2. Market Analysis & Competitive Positioning

### 2.1 Competitive Landscape

| Platform | Base Price | Seats | API | Multi-Lang | Multi-Tenant |
|----------|-----------|-------|-----|------------|-------------|
| Navattic | $500/mo | 5 | No | Paid tier | No |
| Storylane | $200/mo | 1 | Limited | AI-based | No |
| Arcade | $129/mo | 3 | No | No | No |
| Reprise | Enterprise | Custom | Limited | No | No |
| Walnut | $500/mo | Custom | Limited | No | No |
| **NavTour** | **$99/mo** | **5** | **Yes (Full)** | **Native** | **Yes (True)** |

### 2.2 NavTour Differentiation

- **Price disruption:** Entry at $99/month vs. $500/month industry standard — 5x cheaper than Navattic Base
- **API-first architecture:** Every feature accessible via REST API, enabling automation and custom integrations
- **True multi-tenancy:** Built on proven P4 Software SOC 2-compliant infrastructure serving 5,000+ clients
- **Native multi-language:** English and Spanish from day one, with extensible translation framework
- **Self-hosted option:** Enterprise customers can deploy NavTour on their own infrastructure
- **AI-powered demo generation:** Leverages LLM integration to auto-generate demo scripts and tooltips from product screenshots

### 2.3 Pricing Strategy

| Plan | Price/mo | Seats | Demos | Views | Features |
|------|----------|-------|-------|-------|----------|
| Starter | Free | 1 | 1 | 100/mo | Basic capture |
| Pro | $99 | 5 | 25 | 10K/mo | + Analytics, API |
| Business | $299 | 15 | Unlimited | 50K/mo | + SSO, Branding |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | + Self-host, SLA |

---

## 3. System Architecture

### 3.1 High-Level Architecture

NavTour follows a layered architecture consistent with the P4 Software platform pattern: API-first backend, Syncfusion Blazor frontend, MS SQL Server persistence, and Azure cloud infrastructure.

| Layer | Technology | Responsibility |
|-------|-----------|---------------|
| Presentation | Syncfusion Blazor (.NET 10) | Demo Builder UI, Admin Portal, Demo Player (Blazor WASM) |
| API Gateway | ASP.NET Core Minimal APIs | REST endpoints, rate limiting, API key management, versioning |
| Application | C# Domain Services | Demo capture processing, step orchestration, analytics aggregation |
| AI Layer | LLM Integration (Claude API) | Auto-generate demo scripts, tooltip text, translation assistance |
| Persistence | MS SQL Server | Multi-tenant data, demo assets, analytics events, user accounts |
| Blob Storage | Azure Blob / S3 | Captured HTML/CSS snapshots, images, video assets |
| CDN | Azure Front Door / CloudFlare | Demo Player distribution, asset delivery, embed script hosting |
| Chrome Extension | Manifest V3, TypeScript | Product screen capture, HTML/CSS extraction, DOM serialization |
| Embed Runtime | Vanilla JS (<30KB gzipped) | Lightweight demo player for website/email embeds |

### 3.2 Multi-Tenant Data Architecture

NavTour uses the same proven multi-tenant pattern as the P4 Software platform: shared database with tenant isolation via TenantId column on every table, enforced at the query layer via global filters.

**Tenant Isolation Strategy:**

- **Shared database, shared schema:** All tenants in one database with TenantId foreign key on every entity
- **Row-Level Security (RLS):** SQL Server RLS policies ensure tenants can never access other tenants' data
- **EF Core Global Query Filters:** Automatic TenantId filtering on all LINQ queries
- **API Key Scoping:** Every API key is bound to a TenantId; requests are scoped at the middleware level
- **Blob Storage Isolation:** Tenant-prefixed blob containers (`/{tenantId}/demos/{demoId}/assets/`)

### 3.3 Demo Player Architecture

The Demo Player is the most critical component — it's what end-users (prospects) interact with. It must be lightweight, fast-loading, and work across all devices.

**Player Design Principles:**

- Vanilla JavaScript runtime, zero framework dependencies, under 30KB gzipped
- Lazy-loads demo frames on demand (first frame loads in <1 second on 3G)
- Renders captured HTML/CSS in a sandboxed iframe with controlled click handlers
- Overlay system for tooltips, modals, hotspots, and guided steps rendered outside the iframe
- PostMessage API for communication between iframe content and overlay controller
- Responsive: adapts to viewport size with configurable breakpoint behaviors
- Offline-capable: entire demo can be pre-cached for conference/trade show use

**Embed Modes:**

| Mode | Implementation | Use Case |
|------|---------------|----------|
| Inline | JS snippet injects iframe at target div | Product pages, landing pages |
| Full Page | Standalone URL (`demo.navtour.io/{id}`) | Direct share links, email campaigns |
| Pop-up/Modal | JS snippet with trigger button/CTA | Homepages, pricing pages |
| Lazy Load | Thumbnail overlay, loads on click | Performance-sensitive pages |
| In-App | SDK injection into existing SaaS apps | Onboarding tours, feature announcements |

---

## 4. Core Components Deep Dive

### 4.1 Chrome Extension (Capture Engine)

The Chrome Extension is the entry point for demo creation. It captures the HTML, CSS, and visual state of any web application and sends it to the NavTour backend for processing.

**Capture Pipeline:**

1. User navigates to their product, activates NavTour extension
2. Extension serializes the full DOM tree (innerHTML + computed styles) for the visible viewport
3. External stylesheets are inlined; external fonts and images are captured as data URIs or uploaded to NavTour CDN
4. JavaScript is stripped (demos are static HTML/CSS snapshots, not live apps)
5. Captured frame is POSTed to NavTour API as a compressed payload (typically 200KB–2MB per frame)
6. Backend processes the frame: sanitizes HTML, optimizes images, generates thumbnail, stores in blob storage
7. User clicks through their product flow; each click captures a new frame, building the demo sequence

**Technical Requirements:**

- Manifest V3 compliant (Chrome Web Store requirement)
- Content Security Policy: Minimal permissions (activeTab, storage, only NavTour API domains)
- Frame capture via DOM serialization (not screenshot — preserves interactivity of HTML elements)
- Selective capture mode: user can highlight specific regions to capture instead of full page
- Auto-detection of dynamic content regions (tables, charts, forms) for annotation suggestions

### 4.2 Demo Builder (Blazor Application)

The Demo Builder is the primary workspace where users assemble, annotate, and configure their interactive demos. Built with Syncfusion Blazor for a rich, desktop-class editing experience.

**Builder Features:**

- **Visual storyboard:** Drag-and-drop frame sequencing with thumbnail preview strip
- **Step editor:** Configure click targets, navigation flow, conditional branching between frames
- **Annotation tools:** Tooltips, modals, hotspot highlights, blur/redact regions, text overlays
- **Data masking:** Replace sensitive data in captured frames with synthetic/custom values
- **Dynamic variables:** Personalize demos with tokens (`{{company}}`, `{{name}}`, `{{industry}}`) resolved at runtime
- **Style customization:** Apply brand colors, custom fonts, logo placement to the demo wrapper/overlay
- **Multi-language:** Create demo versions in different languages with shared frame assets
- **Collaboration:** Multiple team members can edit demos simultaneously with conflict resolution
- **Version history:** Full audit trail of demo changes with rollback capability
- **Preview mode:** Test the complete demo flow before publishing

### 4.3 Analytics Engine

Analytics are critical for proving demo ROI and optimizing conversion. NavTour captures every interaction and provides actionable insights.

**Event Tracking:**

| Event | Data Captured | Business Value |
|-------|--------------|----------------|
| Demo Started | Viewer ID, source URL, UTM params, device | Funnel top: total reach and traffic sources |
| Step Viewed | Step number, time on step, scroll depth | Engagement: which features attract attention |
| Step Completed | Step number, completion time, click target | Flow analysis: where users progress successfully |
| Demo Completed | Total time, completion %, path taken | Conversion: full engagement rate |
| Drop-off | Last step, time before exit, drop reason | Friction: identify where demos lose users |
| CTA Clicked | CTA type, position, demo context | Sales: demo-to-lead conversion |
| Form Submitted | Lead data, demo context, engagement score | Pipeline: qualified leads from demos |
| Demo Shared | Share method, recipient (if known) | Virality: organic demo distribution |

**Analytics Dashboard Features:**

- Real-time viewer tracking with live session replay capability
- Engagement heatmaps showing which steps and regions get the most interaction
- Funnel visualization from demo start to CTA click to form submission
- A/B testing framework: test different demo versions and measure conversion impact
- Account-level analytics: identify high-intent companies viewing demos (via IP/domain reveal)
- Export to CSV/Excel and API access for custom reporting
- Webhook triggers on key events (demo completed, form submitted) for CRM/marketing automation

### 4.4 Integration Layer

**CRM & Marketing Integrations:**

| Platform | Integration Type | Data Flow |
|----------|-----------------|-----------|
| HubSpot | Native + Webhook | Demo engagement syncs as contact activity; lead scoring enrichment |
| Salesforce | Native + Webhook | Demo views create/update leads; engagement data on opportunity records |
| Slack | Webhook | Real-time notifications when high-value accounts view demos |
| Segment | Event stream | Demo events pushed to Segment for downstream analytics tools |
| Google Analytics | JS event bridge | Demo interactions fire as GA4 events for unified web analytics |
| Zapier / Make | Webhook + API | Connect NavTour to 5,000+ apps via automation platforms |
| Custom Webhook | Configurable | POST demo events to any URL with customizable payload format |

---

## 5. Data Model

### 5.1 Core Entity Relationships

The data model follows P4 Software conventions: TenantId on every table, soft deletes, audit columns, and UTC timestamps throughout.

| Entity | Description | Key Relationships |
|--------|------------|-------------------|
| Tenant | Organization/account using NavTour | Has many Users, Demos, ApiKeys |
| User | Team member who builds/manages demos | Belongs to Tenant; has Role |
| Demo | A complete interactive product demo | Belongs to Tenant; has many Frames, Steps |
| Frame | A single captured HTML/CSS snapshot | Belongs to Demo; has blob storage ref |
| Step | A guided interaction point in the demo | Belongs to Demo; references a Frame |
| Annotation | Tooltip, modal, hotspot, blur on a step | Belongs to Step; has position/style data |
| DemoSession | A single viewer's playthrough | References Demo; has many Events |
| SessionEvent | Individual interaction in a session | Belongs to DemoSession |
| Lead | Contact info from form submission | Belongs to DemoSession; linked to Tenant |
| DemoVersion | Point-in-time snapshot of a demo's config | Belongs to Demo; enables rollback |
| ApiKey | Tenant-scoped API authentication key | Belongs to Tenant; has permissions scope |
| Integration | Configured CRM/webhook connection | Belongs to Tenant; has config JSON |
| DemoTranslation | Localized annotation text for a demo | Belongs to Demo; keyed by locale |

### 5.2 Key Table Schemas

#### Demos Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | uniqueidentifier | No | Primary key (GUID) |
| TenantId | uniqueidentifier | No | FK to Tenants; RLS filter column |
| Name | nvarchar(200) | No | Display name of the demo |
| Slug | nvarchar(100) | No | URL-safe identifier (unique per tenant) |
| Description | nvarchar(2000) | Yes | Internal description/notes |
| Status | int | No | Draft=0, Published=1, Archived=2 |
| CurrentVersionId | uniqueidentifier | Yes | FK to DemoVersions (active version) |
| Settings | nvarchar(max) | Yes | JSON: branding, embed config, gating rules |
| Locale | nvarchar(10) | No | Primary language (en, es, etc.) |
| ViewCount | bigint | No | Denormalized total view count |
| CreatedAt | datetime2 | No | UTC creation timestamp |
| CreatedBy | uniqueidentifier | No | FK to Users |
| ModifiedAt | datetime2 | Yes | UTC last modified |
| IsDeleted | bit | No | Soft delete flag |

#### SessionEvents Table (Analytics)

High-volume event storage optimized for write performance and time-range queries. Partitioned by month.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | bigint IDENTITY | No | Auto-increment PK for fast inserts |
| TenantId | uniqueidentifier | No | FK to Tenants |
| SessionId | uniqueidentifier | No | FK to DemoSessions |
| EventType | smallint | No | Started=1, StepView=2, Complete=3, etc. |
| StepNumber | int | Yes | Which step triggered this event |
| EventData | nvarchar(max) | Yes | JSON payload (click coords, form data, etc.) |
| OccurredAt | datetime2 | No | UTC event timestamp (partition key) |
| IpAddress | varbinary(16) | Yes | Viewer IP (for company identification) |
| UserAgent | nvarchar(500) | Yes | Browser/device info |

---

## 6. API Specification

### 6.1 API Design Principles

- RESTful with JSON payloads; API versioning via URL prefix (`/api/v1/`)
- Authentication: API Key in `X-NavTour-Key` header or OAuth 2.0 Bearer token
- Rate limiting: Tier-based (Starter: 100 req/hr, Pro: 1,000 req/hr, Business: 10,000 req/hr)
- Pagination: Cursor-based for list endpoints; page size defaults to 25, max 100
- Webhooks: Configurable event subscriptions with HMAC-SHA256 signature verification
- OpenAPI 3.1 specification auto-generated and published at `/api/docs`

### 6.2 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/demos` | Create a new demo |
| GET | `/api/v1/demos` | List all demos (with filters, search) |
| GET | `/api/v1/demos/{id}` | Get demo details |
| PUT | `/api/v1/demos/{id}` | Update demo settings |
| DELETE | `/api/v1/demos/{id}` | Soft-delete a demo |
| POST | `/api/v1/demos/{id}/publish` | Publish a draft demo |
| POST | `/api/v1/demos/{id}/frames` | Upload a captured frame |
| PUT | `/api/v1/demos/{id}/steps` | Update step sequence and annotations |
| GET | `/api/v1/demos/{id}/analytics` | Get demo analytics summary |
| GET | `/api/v1/analytics/sessions` | List demo sessions with filters |
| GET | `/api/v1/analytics/sessions/{id}` | Get session detail with event timeline |
| GET | `/api/v1/leads` | List captured leads |
| POST | `/api/v1/integrations` | Configure a new integration |
| POST | `/api/v1/embed/{slug}` | Generate embed code for a demo |
| POST | `/api/v1/ai/generate-script` | AI: Generate demo script from frames |
| POST | `/api/v1/ai/translate` | AI: Translate annotations to target locale |

---

## 7. Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Runtime | .NET 10 | P4 platform standard; performance, AOT compilation |
| Web Framework | ASP.NET Core Minimal APIs | Fast startup, low overhead, OpenAPI native |
| Frontend | Syncfusion Blazor (Server + WASM) | Builder = Server; Player = WASM for CDN delivery |
| Database | MS SQL Server 2022 | P4 platform standard; RLS, JSON columns, partitioning |
| ORM | Entity Framework Core 10 | Global query filters for multi-tenancy |
| Caching | Redis (Azure Cache) | Session data, rate limiting, real-time analytics buffers |
| Blob Storage | Azure Blob Storage | Captured frames, images, exported demos |
| CDN | Azure Front Door | Global demo player delivery, custom domains per tenant |
| Message Queue | Azure Service Bus | Async frame processing, webhook delivery, analytics ingestion |
| Search | SQL Server Full-Text + Elastic (v2) | Demo search; upgrade to Elasticsearch for scale |
| AI/LLM | Anthropic Claude API | Script generation, translation, content suggestions |
| Auth | ASP.NET Identity + JWT | User auth; API keys for machine-to-machine |
| CI/CD | GitHub Actions + Azure DevOps | Automated testing, build, and deployment pipelines |
| Monitoring | Application Insights + Serilog | Distributed tracing, structured logging, alerting |
| Chrome Extension | TypeScript + Manifest V3 | Modern Chrome extension platform |
| Embed Player | Vanilla TypeScript | Zero-dependency, framework-agnostic runtime |

---

## 8. Development Roadmap

### 8.1 Phase 1: MVP (Weeks 1–16)

Deliver the core capture-build-share-analyze loop. Enough to onboard design partners and validate product-market fit.

**Sprint 1–4: Foundation (Weeks 1–8)**

- Multi-tenant database schema, EF Core context with global filters, RLS policies
- User authentication (ASP.NET Identity + JWT), tenant provisioning, role-based access
- Chrome Extension v1: full-page DOM capture, frame upload to API, basic multi-frame recording
- Frame processing pipeline: HTML sanitization, image optimization, blob storage upload
- Core API: CRUD for demos, frames, and steps with OpenAPI documentation

**Sprint 5–8: Builder & Player (Weeks 9–16)**

- Demo Builder UI: storyboard view, step configuration, tooltip/modal/hotspot annotations
- Demo Player (Blazor WASM): sandboxed frame rendering, overlay system, step navigation
- Embed system: inline, full-page, and pop-up embed code generation
- Basic analytics: demo views, completion rates, step-level engagement, lead capture forms
- Publish flow: draft → preview → publish with shareable URL
- Stripe billing integration: Starter (free) and Pro ($99) plans
- Admin portal: tenant dashboard, user management, billing overview

### 8.2 Phase 2: Growth Features (Weeks 17–28)

- AI Copilot: auto-generate demo scripts, tooltip text, and suggested flows from captured frames
- A/B testing framework: create demo variants, split traffic, measure conversion differences
- Advanced analytics: funnel visualization, engagement heatmaps, account identification (IP reveal)
- CRM integrations: HubSpot, Salesforce native connectors with bi-directional sync
- Dynamic variables and personalization tokens for account-based demos
- Multi-language support: translation management UI, AI-assisted translation
- Custom domains: tenants can serve demos from their own subdomain (`demo.theircompany.com`)
- Team collaboration: simultaneous editing, comments on steps, review workflows
- Demo Center: create curated collections of demos organized by persona/use case
- Webhook system: configurable event subscriptions with retry logic and delivery monitoring

### 8.3 Phase 3: Enterprise & Scale (Weeks 29–40)

- SSO/SAML: Enterprise single sign-on integration
- Audit logs: Complete activity trail for compliance requirements
- Self-hosted deployment: Docker + Kubernetes packaging for on-premise customers
- Sandbox demos: Live, interactive product environments with pre-seeded data (not just screenshots)
- Agent Demos: AI agent-driven demos that respond to viewer questions in real-time
- Video/voiceover integration: AI-generated narration layered onto demo walkthroughs
- Advanced security: SOC 2 Type II certification, GDPR compliance tools, data residency options
- White-label: Complete branding removal for enterprise customers and resellers
- Offline mode: Downloadable demo packages for trade shows and field sales
- Public marketplace: Template library where users can share/sell demo templates

---

## 9. Infrastructure & Deployment

### 9.1 Azure Architecture

| Service | Azure Resource | Configuration |
|---------|---------------|--------------|
| Application | Azure App Service (Linux) | P2v3 plan; auto-scale 2–10 instances |
| Database | Azure SQL Managed Instance | Gen5, 8 vCores; geo-replicated |
| Cache | Azure Cache for Redis | C2 Standard; persistence enabled |
| Blob Storage | Azure Blob (Hot tier) | RA-GRS replication; CDN integration |
| CDN | Azure Front Door Premium | Global POP distribution; WAF rules |
| Queue | Azure Service Bus | Standard tier; topic/subscription model |
| Monitoring | Application Insights | Smart detection; custom dashboards |
| Key Vault | Azure Key Vault | API keys, connection strings, secrets |
| DNS | Azure DNS | Wildcard for custom tenant domains |

### 9.2 Estimated Monthly Infrastructure Cost

| Resource | MVP | Growth | Scale |
|----------|-----|--------|-------|
| App Service (2–10 instances) | $200 | $600 | $2,000 |
| Azure SQL Managed Instance | $400 | $800 | $2,500 |
| Redis Cache | $100 | $200 | $500 |
| Blob Storage + CDN | $50 | $300 | $1,500 |
| Service Bus + Monitoring | $50 | $150 | $400 |
| **Total Estimated** | **$800** | **$2,050** | **$6,900** |

At $99/month Pro pricing, NavTour reaches infrastructure break-even at approximately 9 paying customers in MVP phase. At 100 customers, monthly revenue ($9,900) comfortably exceeds Growth-phase infrastructure costs ($2,050).

---

## 10. Security & Compliance

- Tenant isolation via Row-Level Security (RLS) enforced at the database level — not just application code
- All API keys encrypted at rest with Azure Key Vault; API key hashing (SHA-256) in database
- TLS 1.3 everywhere: API, CDN, embed player, Chrome Extension communication
- Content Security Policy on demo player iframes prevents script injection in captured content
- OWASP Top 10 protections: input validation, parameterized queries, rate limiting, CSRF tokens
- Penetration testing before public launch; ongoing automated vulnerability scanning
- SOC 2 Type II certification path (leveraging existing P4 Software SOC 2 controls)
- GDPR compliance: data processing agreements, right-to-erasure support, cookie consent for demo viewers

---

## 11. Go-to-Market Strategy

### 11.1 Launch Strategy

- **Internal dogfooding:** Build NavTour demos for P4 Warehouse, P4 Books, P4 Customs, and OpenDocs immediately
- **Design partners:** Recruit 10–20 B2B SaaS companies in LATAM for beta access at discounted pricing
- **Content marketing:** Publish comparison articles (NavTour vs. Navattic, Storylane, Arcade) targeting long-tail SEO
- **Product Hunt launch:** Timed with Phase 1 completion for maximum early-adopter visibility
- **OpenClaw/Rex integration:** Use Rex to demo NavTour itself — an interactive demo of the interactive demo platform
- **Partner channel:** Offer reseller margins to existing Barrdega/P4 partner network (Nerv Corp, EDITY SA, RealCore)

### 11.2 Revenue Projections (Conservative)

| Quarter | Customers | MRR | ARR | Infra Cost | Margin |
|---------|-----------|-----|-----|------------|--------|
| Q3 2026 | 15 | $1,200 | $14,400 | $800 | 33% |
| Q4 2026 | 50 | $5,500 | $66,000 | $1,200 | 78% |
| Q1 2027 | 120 | $14,000 | $168,000 | $2,000 | 86% |
| Q2 2027 | 250 | $30,000 | $360,000 | $3,500 | 88% |
| Q4 2027 | 500 | $65,000 | $780,000 | $5,500 | 92% |

---

## 12. Next Steps

1. Approve NavTour product name and branding (logo, domain: navtour.io)
2. Allocate development team: 2 senior .NET developers, 1 frontend/Blazor specialist, 1 Chrome extension developer
3. Provision Azure infrastructure for development environment
4. Begin Phase 1 Sprint 1: database schema, authentication, Chrome Extension prototype
5. Recruit 5 design partners for early feedback (target: LATAM SaaS companies in Barrdega network)
6. File trademark for NavTour in US and Panama jurisdictions

---

*NavTour — Powering the Next Generation of Product Demos*
*P4 Software | Grupo Barrdega | navtour.io*
