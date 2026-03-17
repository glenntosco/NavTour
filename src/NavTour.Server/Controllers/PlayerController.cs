using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.DTOs.Leads;
using NavTour.Shared.DTOs.Player;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/player")]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayerController(IPlayerService playerService)
    {
        _playerService = playerService;
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
}
