using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.DTOs.Forms;
using NavTour.Shared.DTOs.Leads;
using NavTour.Shared.DTOs.Player;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/player")]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;
    private readonly NavTourDbContext _db;

    public PlayerController(IPlayerService playerService, NavTourDbContext db)
    {
        _playerService = playerService;
        _db = db;
    }

    [HttpGet("{slug}/manifest")]
    public async Task<ActionResult<PlayerManifestResponse>> GetManifest(string slug)
    {
        // Pass query params for personalization variable resolution
        var queryParams = HttpContext.Request.Query
            .ToDictionary(q => q.Key, q => (string?)q.Value.ToString());
        var manifest = await _playerService.GetManifestAsync(slug, queryParams);
        return manifest == null ? NotFound() : Ok(manifest);
    }

    [HttpPost("{slug}/leads")]
    public async Task<ActionResult> CaptureLead(string slug, LeadCaptureRequest request, [FromQuery] Guid? sessionId)
    {
        var leadId = await _playerService.RecordLeadAsync(slug, request, sessionId ?? Guid.NewGuid());
        return Ok(new { leadId });
    }

    /// <summary>
    /// Serve a frame's HTML directly as text/html.
    /// Used by the player iframe (same-origin, no CORS issues, resources load from /api/v1/resources/{hash}).
    /// </summary>
    [HttpGet("frames/{frameId:guid}/html")]
    public async Task<IActionResult> GetFrameHtml(Guid frameId)
    {
        var html = await _db.Frames.IgnoreQueryFilters()
            .Where(f => f.Id == frameId && !f.IsDeleted)
            .Select(f => f.HtmlContent)
            .FirstOrDefaultAsync();
        if (html == null) return NotFound();
        return Content(html, "text/html");
    }

    [HttpPost("{slug}/form-submit")]
    public async Task<ActionResult> SubmitForm(string slug, FormSubmissionRequest request, [FromQuery] Guid? sessionId)
    {
        var leadId = await _playerService.RecordFormSubmissionAsync(slug, request, sessionId ?? Guid.NewGuid());
        return Ok(new { leadId });
    }
}
