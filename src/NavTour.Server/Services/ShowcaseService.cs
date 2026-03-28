using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Showcases;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class ShowcaseService
{
    private readonly NavTourDbContext _db;

    public ShowcaseService(NavTourDbContext db) => _db = db;

    // ── Showcase CRUD ──

    public async Task<List<ShowcaseResponse>> GetAllAsync()
    {
        var showcases = await _db.Showcases
            .Include(s => s.Sections.OrderBy(sec => sec.SortOrder))
                .ThenInclude(sec => sec.Items.OrderBy(i => i.SortOrder))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var responses = new List<ShowcaseResponse>();
        foreach (var sc in showcases)
            responses.Add(await MapShowcaseAsync(sc));
        return responses;
    }

    public async Task<ShowcaseResponse?> GetByIdAsync(Guid id)
    {
        var sc = await _db.Showcases
            .Include(s => s.Sections.OrderBy(sec => sec.SortOrder))
                .ThenInclude(sec => sec.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == id);

        return sc == null ? null : await MapShowcaseAsync(sc);
    }

    public async Task<ShowcaseResponse?> GetBySlugAsync(string slug)
    {
        var sc = await _db.Showcases
            .IgnoreQueryFilters()
            .Include(s => s.Sections.OrderBy(sec => sec.SortOrder))
                .ThenInclude(sec => sec.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.Slug == slug && !s.IsDeleted);

        return sc == null ? null : await MapShowcaseAsync(sc);
    }

    public async Task<ShowcaseResponse> CreateAsync(CreateShowcaseRequest request)
    {
        var name = request.Name;
        if (string.IsNullOrWhiteSpace(name))
            name = GenerateAztecName();

        var slug = GenerateSlug(name);
        var baseSlug = slug;
        var counter = 1;
        while (await _db.Showcases.AnyAsync(s => s.Slug == slug))
            slug = $"{baseSlug}-{counter++}";

        var showcase = new Showcase
        {
            Name = name,
            Slug = slug
        };

        _db.Showcases.Add(showcase);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(showcase.Id))!;
    }

    public async Task<ShowcaseResponse?> UpdateAsync(Guid id, UpdateShowcaseRequest request)
    {
        var sc = await _db.Showcases
            .Include(s => s.Sections.OrderBy(sec => sec.SortOrder))
                .ThenInclude(sec => sec.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sc == null) return null;

        if (request.Name != null) sc.Name = request.Name;
        if (request.Description != null) sc.Description = request.Description;
        if (request.Status != null && Enum.TryParse<DemoStatus>(request.Status, true, out var status))
            sc.Status = status;
        if (request.LayoutTheme != null) sc.LayoutTheme = request.LayoutTheme;
        if (request.Autoplay.HasValue) sc.Autoplay = request.Autoplay.Value;

        await _db.SaveChangesAsync();
        return await MapShowcaseAsync(sc);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var sc = await _db.Showcases.FindAsync(id);
        if (sc == null) return false;

        sc.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Section CRUD ──

    public async Task<ShowcaseSectionResponse> AddSectionAsync(CreateSectionRequest request)
    {
        var maxSort = await _db.ShowcaseSections
            .Where(s => s.ShowcaseId == request.ShowcaseId)
            .MaxAsync(s => (int?)s.SortOrder) ?? -1;

        var section = new ShowcaseSection
        {
            ShowcaseId = request.ShowcaseId,
            Name = request.Name,
            SortOrder = maxSort + 1
        };

        _db.ShowcaseSections.Add(section);
        await _db.SaveChangesAsync();

        return new ShowcaseSectionResponse(section.Id, section.Name, section.SortOrder, []);
    }

    public async Task<ShowcaseSectionResponse?> UpdateSectionAsync(Guid id, UpdateSectionRequest request)
    {
        var section = await _db.ShowcaseSections
            .Include(s => s.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (section == null) return null;

        if (request.Name != null) section.Name = request.Name;
        if (request.SortOrder.HasValue) section.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync();
        return await MapSectionAsync(section);
    }

    public async Task<bool> DeleteSectionAsync(Guid id)
    {
        var section = await _db.ShowcaseSections.FindAsync(id);
        if (section == null) return false;

        section.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Item CRUD ──

    public async Task<ShowcaseItemResponse> AddItemAsync(AddShowcaseItemRequest request)
    {
        var maxSort = await _db.ShowcaseItems
            .Where(i => i.SectionId == request.SectionId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var item = new ShowcaseItem
        {
            SectionId = request.SectionId,
            DemoId = request.DemoId,
            TitleOverride = request.TitleOverride,
            SortOrder = maxSort + 1
        };

        _db.ShowcaseItems.Add(item);
        await _db.SaveChangesAsync();

        return await MapItemAsync(item);
    }

    public async Task<ShowcaseItemResponse?> UpdateItemAsync(Guid id, UpdateShowcaseItemRequest request)
    {
        var item = await _db.ShowcaseItems.FindAsync(id);
        if (item == null) return null;

        if (request.TitleOverride != null) item.TitleOverride = request.TitleOverride;
        if (request.SortOrder.HasValue) item.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync();
        return await MapItemAsync(item);
    }

    public async Task<bool> DeleteItemAsync(Guid id)
    {
        var item = await _db.ShowcaseItems.FindAsync(id);
        if (item == null) return false;

        item.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Mapping helpers ──

    private async Task<ShowcaseResponse> MapShowcaseAsync(Showcase sc)
    {
        var sections = new List<ShowcaseSectionResponse>();
        foreach (var section in sc.Sections)
            sections.Add(await MapSectionAsync(section));

        return new ShowcaseResponse(
            sc.Id, sc.Name, sc.Slug, sc.Description,
            sc.Status.ToString(), sc.LayoutTheme, sc.Autoplay, sc.ViewCount,
            sections, sc.CreatedAt);
    }

    private async Task<ShowcaseSectionResponse> MapSectionAsync(ShowcaseSection section)
    {
        var items = new List<ShowcaseItemResponse>();
        foreach (var item in section.Items)
            items.Add(await MapItemAsync(item));

        return new ShowcaseSectionResponse(section.Id, section.Name, section.SortOrder, items);
    }

    private async Task<ShowcaseItemResponse> MapItemAsync(ShowcaseItem item)
    {
        string? demoName = null;
        string? demoSlug = null;
        int demoStepCount = 0;
        long demoViewCount = 0;

        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .Include(d => d.Steps)
            .FirstOrDefaultAsync(d => d.Id == item.DemoId && !d.IsDeleted);

        if (demo != null)
        {
            demoName = demo.Name;
            demoSlug = demo.Slug;
            demoStepCount = demo.Steps.Count;
            demoViewCount = demo.ViewCount;
        }

        return new ShowcaseItemResponse(
            item.Id, item.DemoId, item.SortOrder, item.TitleOverride,
            demoName, demoSlug, demoStepCount, demoViewCount);
    }

    // ── Utilities ──

    private static string GenerateAztecName()
    {
        var prefixes = new[] {
            "Quetzal", "Tlaloc", "Tonali", "Xochitl", "Itzel",
            "Citlali", "Nahui", "Coatl", "Tezca", "Mictlan",
            "Chimalli", "Atl", "Centeotl", "Ehecatl", "Ixchel",
            "Kukulkan", "Ocelotl", "Tepetl", "Xiuhtl", "Yolotl"
        };
        var suffixes = new[] {
            "Showcase", "Gallery", "Collection", "Codex", "Mosaic",
            "Tapestry", "Obsidian", "Jade", "Temple", "Pyramid",
            "Serpent", "Eagle", "Jaguar", "Sun", "Star"
        };
        var rng = Random.Shared;
        return $"{prefixes[rng.Next(prefixes.Length)]}-{suffixes[rng.Next(suffixes.Length)]}-{rng.Next(100, 999)}";
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant().Replace(" ", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = Regex.Replace(slug, @"-{2,}", "-");
        return slug.Trim('-');
    }
}
