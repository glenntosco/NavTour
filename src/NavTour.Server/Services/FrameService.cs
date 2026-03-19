using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Frames;
using NavTour.Shared.Models;
using System.Text.RegularExpressions;

namespace NavTour.Server.Services;

public class FrameService : IFrameService
{
    private readonly NavTourDbContext _db;

    public FrameService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<FrameResponse>> GetAllByDemoAsync(Guid demoId)
    {
        return await _db.Frames
            .Where(f => f.DemoId == demoId)
            .OrderBy(f => f.SequenceOrder)
            .Select(f => new FrameResponse(f.Id, f.Name, f.SequenceOrder, f.ThumbnailUrl, f.CreatedAt))
            .ToListAsync();
    }

    public async Task<FrameDetailResponse?> GetByIdAsync(Guid id)
    {
        return await _db.Frames
            .Where(f => f.Id == id)
            .Select(f => new FrameDetailResponse(f.Id, f.Name, f.SequenceOrder, f.HtmlContent, f.CssContent, f.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<FrameResponse> UploadAsync(Guid demoId, IFormFile file)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var htmlContent = await reader.ReadToEndAsync();

        // Extract <style> blocks as CSS
        string? cssContent = null;
        var styleMatches = Regex.Matches(htmlContent, @"<style[^>]*>([\s\S]*?)</style>", RegexOptions.IgnoreCase);
        if (styleMatches.Count > 0)
        {
            cssContent = string.Join("\n", styleMatches.Select(m => m.Groups[1].Value));
        }

        var maxOrder = await _db.Frames
            .Where(f => f.DemoId == demoId)
            .MaxAsync(f => (int?)f.SequenceOrder) ?? 0;

        var frame = new Frame
        {
            DemoId = demoId,
            SequenceOrder = maxOrder + 1,
            HtmlContent = htmlContent,
            CssContent = cssContent
        };

        _db.Frames.Add(frame);
        await _db.SaveChangesAsync();

        return new FrameResponse(frame.Id, frame.Name, frame.SequenceOrder, frame.ThumbnailUrl, frame.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var frame = await _db.Frames.FindAsync(id);
        if (frame == null) return false;

        frame.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<FrameDetailResponse?> UpdateAsync(Guid id, string htmlContent, string? cssContent)
    {
        var frame = await _db.Frames.FindAsync(id);
        if (frame == null) return null;

        frame.HtmlContent = htmlContent;
        frame.CssContent = cssContent;
        await _db.SaveChangesAsync();

        return new FrameDetailResponse(frame.Id, frame.Name, frame.SequenceOrder, frame.HtmlContent, frame.CssContent, frame.CreatedAt);
    }

    public async Task<bool> RenameAsync(Guid id, string name)
    {
        var frame = await _db.Frames.FindAsync(id);
        if (frame == null) return false;

        frame.Name = name;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderAsync(Guid demoId, ReorderFramesRequest request)
    {
        var frames = await _db.Frames
            .Where(f => f.DemoId == demoId)
            .ToListAsync();

        for (int i = 0; i < request.FrameIdsInOrder.Count; i++)
        {
            var frame = frames.FirstOrDefault(f => f.Id == request.FrameIdsInOrder[i]);
            if (frame != null) frame.SequenceOrder = i + 1;
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
