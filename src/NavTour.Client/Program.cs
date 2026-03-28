using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Radzen;
using NavTour.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddRadzenComponents();
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DemoApiService>();

// Player Services (Task 5)
builder.Services.AddScoped<PlayerApiService>();

// Analytics Services
builder.Services.AddScoped<AnalyticsApiService>();

// Theme Services
builder.Services.AddScoped<ThemeApiService>();

// AI Services
builder.Services.AddScoped<AiApiService>();

await builder.Build().RunAsync();
