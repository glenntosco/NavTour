using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.MultiTenancy;
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
