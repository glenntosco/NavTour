using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Hub;
using NavTour.Shared.Models;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/hubs")]
[Authorize]
public class HubController : ControllerBase
{
    private readonly HubService _hubService;
    private readonly NavTourDbContext _db;
    public HubController(HubService hubService, NavTourDbContext db)
    {
        _hubService = hubService;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<HubResponse>>> GetAll()
        => Ok(await _hubService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<HubResponse>> Get(Guid id)
    {
        var hub = await _hubService.GetByIdAsync(id);
        return hub == null ? NotFound() : Ok(hub);
    }

    [HttpPost]
    public async Task<ActionResult<HubResponse>> Create(CreateHubRequest request)
        => Ok(await _hubService.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<HubResponse>> Update(Guid id, UpdateHubRequest request)
    {
        var hub = await _hubService.UpdateAsync(id, request);
        return hub == null ? NotFound() : Ok(hub);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _hubService.DeleteAsync(id) ? Ok() : NotFound();

    // Categories
    [HttpPost("categories")]
    public async Task<ActionResult<HubCategoryResponse>> AddCategory(CreateCategoryRequest request)
        => Ok(await _hubService.AddCategoryAsync(request));

    [HttpPut("categories/{id:guid}")]
    public async Task<ActionResult<HubCategoryResponse>> UpdateCategory(Guid id, UpdateCategoryRequest request)
    {
        var cat = await _hubService.UpdateCategoryAsync(id, request);
        return cat == null ? NotFound() : Ok(cat);
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
        => await _hubService.DeleteCategoryAsync(id) ? Ok() : NotFound();

    // Items
    [HttpPost("items")]
    public async Task<ActionResult<HubItemResponse>> AddItem(AddItemRequest request)
        => Ok(await _hubService.AddItemAsync(request));

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<HubItemResponse>> UpdateItem(Guid id, UpdateItemRequest request)
    {
        var item = await _hubService.UpdateItemAsync(id, request);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
        => await _hubService.DeleteItemAsync(id) ? Ok() : NotFound();

    // Public endpoint for widget SDK (no auth — uses hub slug)
    [HttpGet("public/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<HubResponse>> GetPublic(string slug)
    {
        var hub = await _hubService.GetBySlugAsync(slug);
        if (hub == null || !hub.IsPublished) return NotFound();
        return Ok(hub);
    }

    // Public endpoint — widget sends events (no auth)
    [HttpPost("public/{slug}/events")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackEvent(string slug, [FromBody] HubEventRequest request)
    {
        // Look up hub by slug (bypass tenant filter since this is public)
        var hub = await _db.DemoHubs.IgnoreQueryFilters().FirstOrDefaultAsync(h => h.Slug == slug && !h.IsDeleted);
        if (hub == null) return NotFound();

        var evt = new HubEvent
        {
            HubId = hub.Id,
            EventType = request.EventType,
            EventData = request.EventData,
            VisitorId = request.VisitorId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.FirstOrDefault()
        };

        _db.HubEvents.Add(evt);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // Authenticated endpoint — hub owner views analytics
    [HttpGet("{id:guid}/analytics")]
    public async Task<ActionResult<HubAnalyticsResponse>> GetAnalytics(Guid id)
    {
        var hub = await _db.DemoHubs.FirstOrDefaultAsync(h => h.Id == id && !h.IsDeleted);
        if (hub == null) return NotFound();

        var events = await _db.HubEvents
            .Where(e => e.HubId == id && e.CreatedAt > DateTime.UtcNow.AddDays(-30))
            .ToListAsync();

        var opens = events.Count(e => e.EventType == "open");
        var uniqueVisitors = events.Where(e => e.VisitorId != null).Select(e => e.VisitorId).Distinct().Count();
        var demoStarts = events.Count(e => e.EventType == "demoStart");
        var demoCompletes = events.Count(e => e.EventType == "demoComplete");
        var bounceRate = opens > 0 ? (double)(opens - demoStarts) / opens * 100 : 0;

        var topSearches = events.Where(e => e.EventType == "search" && e.EventData != null)
            .Select(e => { try { return System.Text.Json.JsonDocument.Parse(e.EventData!).RootElement.GetProperty("query").GetString(); } catch { return null; } })
            .Where(q => q != null)
            .GroupBy(q => q!)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .Select(g => new SearchQueryEntry(g.Key, g.Count()))
            .ToList();

        var topDemos = events.Where(e => e.EventType == "demoStart" && e.EventData != null)
            .Select(e => { try { var doc = System.Text.Json.JsonDocument.Parse(e.EventData!); return new { slug = doc.RootElement.GetProperty("slug").GetString(), name = doc.RootElement.GetProperty("name").GetString() }; } catch { return null; } })
            .Where(d => d != null)
            .GroupBy(d => d!.slug)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .Select(g => new DemoClickEntry(g.First()!.name ?? "", g.Key, g.Count()))
            .ToList();

        return Ok(new HubAnalyticsResponse(opens, uniqueVisitors, demoStarts, demoCompletes, bounceRate, topSearches, [], topDemos));
    }
}
