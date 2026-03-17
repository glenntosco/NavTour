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
using Radzen;

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

// Controllers + Radzen
builder.Services.AddControllers();
builder.Services.AddRadzenComponents();
builder.Services.AddHttpClient();

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

// Client Services (needed for SSR pre-rendering of Blazor components)
// HttpClient that forwards auth cookie for server-side rendering
builder.Services.AddScoped(sp =>
{
    var httpContext = sp.GetService<IHttpContextAccessor>()?.HttpContext;
    var baseAddress = httpContext != null
        ? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}"
        : "http://localhost:5017";

    var handler = new HttpClientHandler();
    if (httpContext?.Request.Cookies.TryGetValue("navtour_auth", out var cookie) == true)
    {
        handler.CookieContainer.Add(new Uri(baseAddress), new System.Net.Cookie("navtour_auth", cookie));
    }
    return new HttpClient(handler) { BaseAddress = new Uri(baseAddress) };
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DemoApiService>();
builder.Services.AddScoped<PlayerApiService>();
builder.Services.AddScoped<AnalyticsApiService>();

var app = builder.Build();

// Seed database
await DbSeeder.SeedAsync(app.Services);

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAntiforgery();

app.UseCors("AppCors");
app.UseAuthentication();
app.UseMiddleware<ApiKeyMiddleware>();
app.UseAuthorization();

app.MapStaticAssets();
app.MapControllers();
app.MapRazorComponents<NavTour.Server.Components.App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(NavTour.Client._Imports).Assembly);

app.Run();
