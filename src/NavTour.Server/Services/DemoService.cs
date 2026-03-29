using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Demos;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;
using System.Text.Json;

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
                d.Locale, d.Settings, d.ViewCount, d.CreatedAt, d.FormId))
            .FirstOrDefaultAsync();
    }

    public async Task<DemoResponse> CreateAsync(CreateDemoRequest request, Guid userId)
    {
        // Enforce plan demo limits
        var demoCount = await _db.Demos.CountAsync();
        var tenant = await _db.Tenants.FirstOrDefaultAsync();
        var plan = tenant?.Plan ?? "Starter";
        var maxDemos = plan switch
        {
            "Starter" => 1,
            "Growth" => 25,
            "Scale" => int.MaxValue,
            _ => 1
        };
        if (demoCount >= maxDemos)
            throw new InvalidOperationException($"Your {plan} plan allows up to {maxDemos} demo{(maxDemos != 1 ? "s" : "")}. Upgrade to create more.");

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

        // Auto-create cover slide (step 1)
        var coverSettings = JsonSerializer.Serialize(new
        {
            layout = "center",
            theme = "dark",
            title = request.Name,
            description = "Interactive product demo",
            ctaText = "Get Started",
            ctaAction = "next",
            showLogo = true,
            backgroundType = "frame",
            backdropOpacity = 60
        });

        var coverStep = new Step
        {
            DemoId = demo.Id,
            StepNumber = 1,
            Type = StepType.CoverSlide,
            TriggerType = TriggerType.ButtonClick,
            NavigationAction = NavigationAction.NextStep,
            ChapterSettings = coverSettings
        };
        _db.Steps.Add(coverStep);

        // Auto-create closing slide (step 2)
        var closingSettings = JsonSerializer.Serialize(new
        {
            layout = "center",
            theme = "dark",
            title = "Enjoyed the demo?",
            description = "Learn more about our features on our website.",
            ctaText = "Learn More",
            ctaAction = "next",
            showLogo = true,
            backgroundType = "none",
            backdropOpacity = 60
        });

        var closingStep = new Step
        {
            DemoId = demo.Id,
            StepNumber = 2,
            Type = StepType.ClosingSlide,
            TriggerType = TriggerType.ButtonClick,
            NavigationAction = NavigationAction.EndDemo,
            ChapterSettings = closingSettings
        };
        _db.Steps.Add(closingStep);
        await _db.SaveChangesAsync();

        return new DemoResponse(demo.Id, demo.Name, demo.Slug, demo.Description,
            demo.Status, demo.Locale, demo.Settings, demo.ViewCount, demo.CreatedAt, demo.FormId);
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
            demo.Status, demo.Locale, demo.Settings, demo.ViewCount, demo.CreatedAt, demo.FormId);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var demo = await _db.Demos.FindAsync(id);
        if (demo == null) return false;

        // Cascade soft-delete to ALL child entities
        var frames = await _db.Frames.Where(f => f.DemoId == id).ToListAsync();
        foreach (var f in frames) f.IsDeleted = true;

        var steps = await _db.Steps.Where(s => s.DemoId == id).ToListAsync();
        foreach (var s in steps) s.IsDeleted = true;

        var stepIds = steps.Select(s => s.Id).ToList();
        var annotations = await _db.Annotations.Where(a => stepIds.Contains(a.StepId)).ToListAsync();
        foreach (var a in annotations) a.IsDeleted = true;

        var sessions = await _db.DemoSessions.Where(s => s.DemoId == id).ToListAsync();
        foreach (var s in sessions) s.IsDeleted = true;

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var events = await _db.SessionEvents.Where(e => sessionIds.Contains(e.SessionId)).ToListAsync();
        _db.SessionEvents.RemoveRange(events);

        var leads = await _db.Leads.Where(l => l.SessionId.HasValue && sessionIds.Contains(l.SessionId.Value)).ToListAsync();
        foreach (var l in leads) l.IsDeleted = true;

        var variables = await _db.PersonalizationVariables.Where(v => v.DemoId == id).ToListAsync();
        foreach (var v in variables) v.IsDeleted = true;

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

    public async Task<bool> UnpublishAsync(Guid id)
    {
        var demo = await _db.Demos.FindAsync(id);
        if (demo == null) return false;

        demo.Status = DemoStatus.Draft;
        await _db.SaveChangesAsync();
        return true;
    }
}
