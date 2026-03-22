using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Server.Services;
using NavTour.Client.Services;
using Microsoft.AspNetCore.Localization;
using Radzen;
using Syncfusion.Blazor;

var builder = WebApplication.CreateBuilder(args);

// Localization
builder.Services.AddLocalization();

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

// JWT Authentication — supports both Bearer header and cookie
var jwtKey = builder.Configuration["Jwt:Key"] ?? "NavTourDevelopmentSecretKey2026!@#$%^&*()";
var tokenParams = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "NavTour",
    ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NavTour",
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
};
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = tokenParams;
    // Read JWT from cookie if no Authorization header present
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token) && context.Request.Cookies.TryGetValue("navtour_auth", out var cookie))
            {
                context.Token = cookie;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();

// Blazor
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddHubOptions(options => options.MaximumReceiveMessageSize = 10 * 1024 * 1024)
    .AddInteractiveWebAssemblyComponents();

// Extend circuit timeout for dev
builder.Services.AddServerSideBlazor().AddCircuitOptions(options =>
{
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(10);
    options.DetailedErrors = builder.Environment.IsDevelopment();
});

// Controllers + Radzen + Syncfusion
builder.Services.AddControllers();
builder.Services.AddRadzenComponents();
builder.Services.AddSyncfusionBlazor();
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdlWXxfeXVRQmBZU0ZzV0BWYEo=");
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ElevenLabsService>();
builder.Services.AddHttpClient<AnthropicService>();

// CORS for player embeds and extension
builder.Services.AddCors(options =>
{
    options.AddPolicy("PlayerCors", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
    options.AddPolicy("AppCors", policy =>
        policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());
});

// Auth Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Player & Personalization
builder.Services.AddScoped<IPersonalizationService, PersonalizationService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();

// Demo Services
builder.Services.AddScoped<IDemoService, DemoService>();
builder.Services.AddScoped<IFrameService, FrameService>();
builder.Services.AddScoped<IStepService, StepService>();
builder.Services.AddScoped<IAnnotationService, AnnotationService>();

// Analytics Services
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ILeadService, LeadService>();

// Team & Email Services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITeamService, TeamService>();

// Client Services (needed for SSR pre-rendering of Blazor components)
// HttpClient that forwards auth cookie for server-side rendering
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped(sp =>
{
    var httpContext = sp.GetService<IHttpContextAccessor>()?.HttpContext;
    var baseAddress = httpContext != null
        ? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}"
        : "http://localhost:5017";

    var handler = new HttpClientHandler { UseCookies = true };
    if (httpContext?.Request.Cookies.TryGetValue("navtour_auth", out var cookie) == true)
    {
        handler.CookieContainer.Add(new Uri(baseAddress), new System.Net.Cookie("navtour_auth", cookie));
    }

    var client = new HttpClient(handler) { BaseAddress = new Uri(baseAddress) };

    // Also set the Authorization header directly from the cookie JWT
    if (httpContext?.Request.Cookies.TryGetValue("navtour_auth", out var token) == true)
    {
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    return client;
});
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DemoApiService>();
builder.Services.AddScoped<PlayerApiService>();
builder.Services.AddScoped<AnalyticsApiService>();
builder.Services.AddScoped<TeamApiService>();

var app = builder.Build();

// Seed database
await DbSeeder.SeedAsync(app.Services);

// Forward headers from Azure reverse proxy so Request.Scheme is correct
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
        | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.UseAntiforgery();

// Localization middleware
var supportedCultures = new[] { "en", "es" };
app.UseRequestLocalization(options =>
{
    options.SetDefaultCulture("en");
    options.AddSupportedCultures(supportedCultures);
    options.AddSupportedUICultures(supportedCultures);
    options.RequestCultureProviders.Clear();
    options.RequestCultureProviders.Add(new QueryStringRequestCultureProvider());
    options.RequestCultureProviders.Add(new CookieRequestCultureProvider());
});

app.Use(async (context, next) =>
{
    var culture = context.Request.Query["culture"].FirstOrDefault();
    if (!string.IsNullOrEmpty(culture))
    {
        context.Response.Cookies.Append(
            CookieRequestCultureProvider.DefaultCookieName,
            CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(culture)),
            new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1) });
    }
    await next();
});

app.UseCors("AppCors");
app.UseAuthentication();
app.UseMiddleware<ApiKeyMiddleware>();
app.UseAuthorization();

// Redirect unauthenticated users to login for app pages
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";
    var protectedPaths = new[] { "/dashboard", "/analytics", "/leads", "/team", "/settings", "/demos/" };
    var isProtected = protectedPaths.Any(p => path.StartsWith(p));

    if (isProtected && context.User?.Identity?.IsAuthenticated != true)
    {
        context.Response.Redirect("/login");
        return;
    }

    await next();
});

app.MapStaticAssets();
app.MapControllers();
app.MapRazorComponents<NavTour.Server.Components.App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(NavTour.Client._Imports).Assembly);

app.Run();
