using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Server.Services;
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

// Auth Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Player Services (Task 5)
builder.Services.AddScoped<IPlayerService, PlayerService>();

// Demo Services
builder.Services.AddScoped<IDemoService, DemoService>();
builder.Services.AddScoped<IFrameService, FrameService>();
builder.Services.AddScoped<IStepService, StepService>();
builder.Services.AddScoped<IAnnotationService, AnnotationService>();

// Analytics Services
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ILeadService, LeadService>();

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
app.UseMiddleware<ApiKeyMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapRazorComponents<NavTour.Server.Components.App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(NavTour.Client._Imports).Assembly);

app.Run();
