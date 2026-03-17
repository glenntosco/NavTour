using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Server.Controllers;

[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpPost("api/v1/player/{slug}/events")]
    public async Task<ActionResult<EventBatchResponse>> IngestEvents(string slug, EventBatchRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = HttpContext.Request.Headers.UserAgent.ToString();
        var result = await _analyticsService.IngestEventsAsync(slug, request, ip, ua);
        return Ok(result);
    }

    [HttpGet("api/v1/demos/{demoId:guid}/analytics")]
    [Authorize]
    public async Task<ActionResult<AnalyticsSummaryResponse>> GetSummary(Guid demoId)
    {
        return Ok(await _analyticsService.GetSummaryAsync(demoId));
    }

    [HttpGet("api/v1/analytics/sessions")]
    [Authorize]
    public async Task<ActionResult<List<SessionListResponse>>> GetSessions([FromQuery] Guid? demoId)
    {
        return Ok(await _analyticsService.GetSessionsAsync(demoId));
    }
}
