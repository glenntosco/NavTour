using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Themes;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class ThemeService
{
    private readonly NavTourDbContext _db;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ThemeService(NavTourDbContext db) => _db = db;

    public async Task<List<ThemeResponse>> GetAllAsync()
    {
        var themes = await _db.DemoThemes
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        return themes.Select(MapToResponse).ToList();
    }

    public async Task<ThemeResponse?> GetByIdAsync(Guid id)
    {
        var t = await _db.DemoThemes.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        return t == null ? null : MapToResponse(t);
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
            ShadowLevel = request.ShadowLevel,
            LogoUrl = request.LogoUrl,
            CoverSlideSettings = request.CoverSlide != null ? JsonSerializer.Serialize(request.CoverSlide) : null,
            ClosingSlideSettings = request.ClosingSlide != null ? JsonSerializer.Serialize(request.ClosingSlide) : null
        };
        _db.DemoThemes.Add(theme);
        await _db.SaveChangesAsync();
        return MapToResponse(theme);
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
        if (request.LogoUrl != null) theme.LogoUrl = request.LogoUrl;
        if (request.CoverSlide != null) theme.CoverSlideSettings = JsonSerializer.Serialize(request.CoverSlide);
        if (request.ClosingSlide != null) theme.ClosingSlideSettings = JsonSerializer.Serialize(request.ClosingSlide);

        await _db.SaveChangesAsync();
        return MapToResponse(theme);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var theme = await _db.DemoThemes.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        if (theme == null) return false;
        theme.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    private ThemeResponse MapToResponse(DemoTheme t) => new(
        t.Id, t.Name, t.BrandColor, t.TextColor, t.BackgroundColor,
        t.FontFamily, t.BorderRadius, t.ButtonStyle, t.ShadowLevel, t.LogoUrl,
        ParseJson<ThemeSlideSettings>(t.CoverSlideSettings),
        ParseJson<ThemeSlideSettings>(t.ClosingSlideSettings),
        t.CreatedAt);

    private static T? ParseJson<T>(string? json) where T : class
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonSerializer.Deserialize<T>(json, _jsonOpts); }
        catch { return null; }
    }
}
