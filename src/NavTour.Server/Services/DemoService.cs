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
