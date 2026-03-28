using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Themes;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class ThemeService
{
    private readonly NavTourDbContext _db;

    public ThemeService(NavTourDbContext db) => _db = db;

    public async Task<List<ThemeResponse>> GetAllAsync()
    {
        return await _db.DemoThemes
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.CreatedAt)
            .Select(t => new ThemeResponse(t.Id, t.Name, t.BrandColor, t.TextColor, t.BackgroundColor, t.FontFamily, t.BorderRadius, t.ButtonStyle, t.ShadowLevel, t.CreatedAt))
            .ToListAsync();
    }

    public async Task<ThemeResponse?> GetByIdAsync(Guid id)
    {
        var t = await _db.DemoThemes.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        if (t == null) return null;
        return new ThemeResponse(t.Id, t.Name, t.BrandColor, t.TextColor, t.BackgroundColor, t.FontFamily, t.BorderRadius, t.ButtonStyle, t.ShadowLevel, t.CreatedAt);
    }

    public async Task<ThemeResponse> CreateAsync(CreateThemeRequest request)
    {
        var theme = new DemoTheme
        {
            Name = request.Name,
            BrandColor = request.BrandColor,
            TextColor = request.TextColor,
            BackgroundColor = request.BackgroundColor,
            FontFamily = request.FontFamily,
            BorderRadius = request.BorderRadius,
            ButtonStyle = request.ButtonStyle,
            ShadowLevel = request.ShadowLevel
        };
        _db.DemoThemes.Add(theme);
        await _db.SaveChangesAsync();
        return new ThemeResponse(theme.Id, theme.Name, theme.BrandColor, theme.TextColor, theme.BackgroundColor, theme.FontFamily, theme.BorderRadius, theme.ButtonStyle, theme.ShadowLevel, theme.CreatedAt);
    }

    public async Task<ThemeResponse?> UpdateAsync(Guid id, UpdateThemeRequest request)
    {
        var theme = await _db.DemoThemes.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        if (theme == null) return null;

        if (request.Name != null) theme.Name = request.Name;
        if (request.BrandColor != null) theme.BrandColor = request.BrandColor;
        if (request.TextColor != null) theme.TextColor = request.TextColor;
        if (request.BackgroundColor != null) theme.BackgroundColor = request.BackgroundColor;
        if (request.FontFamily != null) theme.FontFamily = request.FontFamily;
        if (request.BorderRadius.HasValue) theme.BorderRadius = request.BorderRadius.Value;
        if (request.ButtonStyle != null) theme.ButtonStyle = request.ButtonStyle;
        if (request.ShadowLevel != null) theme.ShadowLevel = request.ShadowLevel;

        await _db.SaveChangesAsync();
        return new ThemeResponse(theme.Id, theme.Name, theme.BrandColor, theme.TextColor, theme.BackgroundColor, theme.FontFamily, theme.BorderRadius, theme.ButtonStyle, theme.ShadowLevel, theme.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var theme = await _db.DemoThemes.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        if (theme == null) return false;
        theme.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }
}
