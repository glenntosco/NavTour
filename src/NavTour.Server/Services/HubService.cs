using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Hub;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class HubService
{
    private readonly NavTourDbContext _db;
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public HubService(NavTourDbContext db) => _db = db;

    // ── Hub CRUD ──

    public async Task<List<HubResponse>> GetAllAsync()
    {
        var hubs = await _db.DemoHubs
            .Include(h => h.Categories.OrderBy(c => c.SortOrder))
                .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder))
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        var responses = new List<HubResponse>();
        foreach (var hub in hubs)
            responses.Add(await MapHubAsync(hub));
        return responses;
    }

    public async Task<HubResponse?> GetByIdAsync(Guid id)
    {
        var hub = await _db.DemoHubs
            .Include(h => h.Categories.OrderBy(c => c.SortOrder))
                .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(h => h.Id == id);

        return hub == null ? null : await MapHubAsync(hub);
    }

    public async Task<HubResponse?> GetBySlugAsync(string slug)
    {
        // IgnoreQueryFilters: public endpoint has no tenant context
        var hub = await _db.DemoHubs
            .IgnoreQueryFilters()
            .Include(h => h.Categories.OrderBy(c => c.SortOrder))
                .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(h => h.Slug == slug && !h.IsDeleted);

        return hub == null ? null : await MapHubAsync(hub);
    }

    public async Task<HubResponse> CreateAsync(CreateHubRequest request)
    {
        var hub = new DemoHub
        {
            Name = request.Name,
            Slug = GenerateSlug(request.Name)
        };

        _db.DemoHubs.Add(hub);
        await _db.SaveChangesAsync();

        // Reload with includes
        return (await GetByIdAsync(hub.Id))!;
    }

    public async Task<HubResponse?> UpdateAsync(Guid id, UpdateHubRequest request)
    {
        var hub = await _db.DemoHubs
            .Include(h => h.Categories.OrderBy(c => c.SortOrder))
                .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(h => h.Id == id);

        if (hub == null) return null;

        if (request.Name != null) hub.Name = request.Name;
        if (request.Slug != null) hub.Slug = request.Slug;
        if (request.IsPublished.HasValue) hub.IsPublished = request.IsPublished.Value;
        if (request.Appearance != null) hub.AppearanceSettings = JsonSerializer.Serialize(request.Appearance);
        if (request.Behavior != null) hub.BehaviorSettings = JsonSerializer.Serialize(request.Behavior);
        if (request.Install != null) hub.InstallSettings = JsonSerializer.Serialize(request.Install);

        await _db.SaveChangesAsync();
        return await MapHubAsync(hub);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var hub = await _db.DemoHubs.FindAsync(id);
        if (hub == null) return false;

        hub.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Category CRUD ──

    public async Task<HubCategoryResponse> AddCategoryAsync(CreateCategoryRequest request)
    {
        var maxSort = await _db.HubCategories
            .Where(c => c.DemoHubId == request.HubId)
            .MaxAsync(c => (int?)c.SortOrder) ?? -1;

        var category = new HubCategory
        {
            DemoHubId = request.HubId,
            Name = request.Name,
            Icon = request.Icon,
            Description = request.Description,
            SortOrder = maxSort + 1
        };

        _db.HubCategories.Add(category);
        await _db.SaveChangesAsync();

        return MapCategory(category);
    }

    public async Task<HubCategoryResponse?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _db.HubCategories
            .Include(c => c.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return null;

        if (request.Name != null) category.Name = request.Name;
        if (request.Icon != null) category.Icon = request.Icon;
        if (request.Description != null) category.Description = request.Description;
        if (request.SortOrder.HasValue) category.SortOrder = request.SortOrder.Value;
        if (request.IsDefault.HasValue) category.IsDefault = request.IsDefault.Value;

        await _db.SaveChangesAsync();
        return await MapCategoryWithDemosAsync(category);
    }

    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        var category = await _db.HubCategories.FindAsync(id);
        if (category == null) return false;

        category.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Item CRUD ──

    public async Task<HubItemResponse> AddItemAsync(AddItemRequest request)
    {
        var maxSort = await _db.HubItems
            .Where(i => i.HubCategoryId == request.CategoryId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var item = new HubItem
        {
            HubCategoryId = request.CategoryId,
            ItemType = request.ItemType,
            DemoId = request.DemoId,
            ExternalUrl = request.ExternalUrl,
            TitleOverride = request.TitleOverride,
            DescriptionOverride = request.DescriptionOverride,
            SortOrder = maxSort + 1
        };

        _db.HubItems.Add(item);
        await _db.SaveChangesAsync();

        return await MapItemAsync(item);
    }

    public async Task<HubItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request)
    {
        var item = await _db.HubItems.FindAsync(id);
        if (item == null) return null;

        if (request.TitleOverride != null) item.TitleOverride = request.TitleOverride;
        if (request.DescriptionOverride != null) item.DescriptionOverride = request.DescriptionOverride;
        if (request.ThumbnailOverride != null) item.ThumbnailOverride = request.ThumbnailOverride;
        if (request.SortOrder.HasValue) item.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync();
        return await MapItemAsync(item);
    }

    public async Task<bool> DeleteItemAsync(Guid id)
    {
        var item = await _db.HubItems.FindAsync(id);
        if (item == null) return false;

        item.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Mapping helpers ──

    private async Task<HubResponse> MapHubAsync(DemoHub hub)
    {
        var categories = new List<HubCategoryResponse>();
        foreach (var cat in hub.Categories)
            categories.Add(await MapCategoryWithDemosAsync(cat));

        return new HubResponse(
            hub.Id,
            hub.Name,
            hub.Slug,
            hub.IsPublished,
            ParseJson<HubAppearanceSettings>(hub.AppearanceSettings),
            ParseJson<HubBehaviorSettings>(hub.BehaviorSettings),
            ParseJson<HubInstallSettings>(hub.InstallSettings),
            categories,
            hub.CreatedAt
        );
    }

    private async Task<HubCategoryResponse> MapCategoryWithDemosAsync(HubCategory category)
    {
        var items = new List<HubItemResponse>();
        foreach (var item in category.Items)
            items.Add(await MapItemAsync(item));

        return new HubCategoryResponse(
            category.Id, category.Name, category.Icon, category.Description,
            category.SortOrder, category.IsDefault, items);
    }

    private HubCategoryResponse MapCategory(HubCategory category) =>
        new(category.Id, category.Name, category.Icon, category.Description,
            category.SortOrder, category.IsDefault, []);

    private async Task<HubItemResponse> MapItemAsync(HubItem item)
    {
        string? demoName = null;
        string? demoSlug = null;
        long demoViewCount = 0;
        int demoStepCount = 0;

        if (item.ItemType == "demo" && item.DemoId.HasValue)
        {
            var demo = await _db.Demos
                .Include(d => d.Steps)
                .FirstOrDefaultAsync(d => d.Id == item.DemoId.Value);

            if (demo != null)
            {
                demoName = demo.Name;
                demoSlug = demo.Slug;
                demoViewCount = demo.ViewCount;
                demoStepCount = demo.Steps.Count;
            }
        }

        return new HubItemResponse(
            item.Id, item.ItemType, item.DemoId,
            item.ExternalUrl, item.TitleOverride,
            item.DescriptionOverride, item.ThumbnailOverride,
            item.SortOrder,
            demoName, demoSlug, demoViewCount, demoStepCount);
    }

    private static T ParseJson<T>(string? json) where T : new()
    {
        if (string.IsNullOrEmpty(json)) return new T();
        try { return JsonSerializer.Deserialize<T>(json, _jsonOptions) ?? new T(); }
        catch { return new T(); }
    }

    private static string GenerateSlug(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}
