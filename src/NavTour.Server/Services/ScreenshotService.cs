using Microsoft.EntityFrameworkCore;
using NavTour.Shared.DTOs.Screenshots;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;
using NavTour.Server.Infrastructure.Data;
using System.Text.RegularExpressions;

namespace NavTour.Server.Services;

public class ScreenshotService(NavTourDbContext db)
{
    public async Task<List<ScreenshotListItemResponse>> GetAllAsync()
    {
        return await db.Screenshots
            .Include(s => s.Slides.Where(sl => !sl.IsDeleted))
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ScreenshotListItemResponse(
                s.Id, s.Name, s.Slug, s.Status, s.ViewCount,
                s.Slides.Count(sl => !sl.IsDeleted),
                s.Slides.Where(sl => !sl.IsDeleted).OrderBy(sl => sl.SequenceOrder).Select(sl => sl.ThumbnailUrl ?? sl.ImageData.Substring(0, Math.Min(sl.ImageData.Length, 200))).FirstOrDefault(),
                s.CreatedAt))
            .ToListAsync();
    }

    public async Task<ScreenshotResponse?> GetByIdAsync(Guid id)
    {
        var s = await db.Screenshots
            .Include(s => s.Slides.Where(sl => !sl.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return null;
        return new ScreenshotResponse(s.Id, s.Name, s.Slug, s.Description, s.Status,
            s.Settings, s.ViewCount, s.Slides.Count, s.CreatedAt);
    }

    public async Task<ScreenshotResponse> CreateAsync(CreateScreenshotRequest req, Guid userId)
    {
        var slug = await GenerateSlugAsync(req.Name);
        var s = new Screenshot
        {
            Name = req.Name,
            Slug = slug,
            Description = req.Description,
            CreatedBy = userId
        };
        db.Screenshots.Add(s);
        await db.SaveChangesAsync();
        return new ScreenshotResponse(s.Id, s.Name, s.Slug, s.Description, s.Status,
            s.Settings, s.ViewCount, 0, s.CreatedAt);
    }

    public async Task<ScreenshotResponse?> UpdateAsync(Guid id, UpdateScreenshotRequest req)
    {
        var s = await db.Screenshots.FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return null;
        if (req.Name != null) s.Name = req.Name;
        if (req.Description != null) s.Description = req.Description;
        if (req.Settings != null) s.Settings = req.Settings;
        s.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var s = await db.Screenshots.FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return false;
        s.IsDeleted = true;
        s.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var s = await db.Screenshots.FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return false;
        s.Status = DemoStatus.Published;
        s.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UnpublishAsync(Guid id)
    {
        var s = await db.Screenshots.FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return false;
        s.Status = DemoStatus.Draft;
        s.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ScreenshotSlideResponse>> GetSlidesAsync(Guid screenshotId)
    {
        return await db.ScreenshotSlides
            .Where(sl => sl.ScreenshotId == screenshotId)
            .OrderBy(sl => sl.SequenceOrder)
            .Select(sl => new ScreenshotSlideResponse(
                sl.Id, sl.Name, sl.SequenceOrder, sl.ImageData,
                sl.ThumbnailUrl, sl.AnnotationData, sl.CropData, sl.DisplaySettings))
            .ToListAsync();
    }

    public async Task<ScreenshotSlideResponse> AddSlideAsync(Guid screenshotId, IFormFile imageFile, string? name)
    {
        var maxOrder = await db.ScreenshotSlides
            .Where(sl => sl.ScreenshotId == screenshotId)
            .MaxAsync(sl => (int?)sl.SequenceOrder) ?? 0;

        string imageData;
        using (var ms = new MemoryStream())
        {
            await imageFile.CopyToAsync(ms);
            var bytes = ms.ToArray();
            var base64 = Convert.ToBase64String(bytes);
            var mimeType = imageFile.ContentType ?? "image/png";
            imageData = $"data:{mimeType};base64,{base64}";
        }

        var slide = new ScreenshotSlide
        {
            ScreenshotId = screenshotId,
            Name = name,
            SequenceOrder = maxOrder + 1,
            ImageData = imageData
        };
        db.ScreenshotSlides.Add(slide);
        await db.SaveChangesAsync();
        return new ScreenshotSlideResponse(slide.Id, slide.Name, slide.SequenceOrder,
            slide.ImageData, slide.ThumbnailUrl, slide.AnnotationData, slide.CropData, slide.DisplaySettings);
    }

    public async Task<ScreenshotSlideResponse?> UpdateSlideAsync(Guid slideId, UpdateSlideRequest req)
    {
        var slide = await db.ScreenshotSlides.FirstOrDefaultAsync(sl => sl.Id == slideId);
        if (slide == null) return null;
        if (req.Name != null) slide.Name = req.Name;
        if (req.AnnotationData != null) slide.AnnotationData = req.AnnotationData;
        if (req.CropData != null) slide.CropData = req.CropData;
        if (req.DisplaySettings != null) slide.DisplaySettings = req.DisplaySettings;
        slide.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return new ScreenshotSlideResponse(slide.Id, slide.Name, slide.SequenceOrder,
            slide.ImageData, slide.ThumbnailUrl, slide.AnnotationData, slide.CropData, slide.DisplaySettings);
    }

    public async Task<bool> DeleteSlideAsync(Guid slideId)
    {
        var slide = await db.ScreenshotSlides.FirstOrDefaultAsync(sl => sl.Id == slideId);
        if (slide == null) return false;
        slide.IsDeleted = true;
        slide.ModifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task ReorderSlidesAsync(Guid screenshotId, List<Guid> slideIds)
    {
        var slides = await db.ScreenshotSlides
            .Where(sl => sl.ScreenshotId == screenshotId)
            .ToListAsync();
        for (int i = 0; i < slideIds.Count; i++)
        {
            var slide = slides.FirstOrDefault(sl => sl.Id == slideIds[i]);
            if (slide != null) slide.SequenceOrder = i + 1;
        }
        await db.SaveChangesAsync();
    }

    private async Task<string> GenerateSlugAsync(string name)
    {
        var baseSlug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "screenshot";
        var slug = baseSlug;
        var counter = 1;
        while (await db.Screenshots.AnyAsync(s => s.Slug == slug))
            slug = $"{baseSlug}-{counter++}";
        return slug;
    }
}
