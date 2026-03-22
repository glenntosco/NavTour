using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Steps;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
public class StepsController : ControllerBase
{
    private readonly IStepService _stepService;
    private readonly NavTourDbContext _db;

    private readonly ElevenLabsService _elevenLabs;

    public StepsController(IStepService stepService, NavTourDbContext db, ElevenLabsService elevenLabs)
    {
        _stepService = stepService;
        _db = db;
        _elevenLabs = elevenLabs;
    }

    [HttpGet("api/v1/demos/{demoId:guid}/steps")]
    public async Task<ActionResult<List<StepResponse>>> GetAll(Guid demoId)
    {
        return Ok(await _stepService.GetAllByDemoAsync(demoId));
    }

    [HttpPut("api/v1/demos/{demoId:guid}/steps")]
    public async Task<IActionResult> UpdateSteps(Guid demoId, UpdateStepsRequest request)
    {
        return await _stepService.UpdateStepsAsync(demoId, request) ? Ok() : NotFound();
    }

    [HttpGet("api/v1/steps/{stepId:guid}/audio")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAudio(Guid stepId)
    {
        var step = await _db.Steps.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == stepId && !s.IsDeleted);
        if (step?.VoiceoverAudio == null) return NotFound();
        return File(step.VoiceoverAudio, "audio/mpeg");
    }

    [HttpGet("api/v1/voices")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVoices()
    {
        var voices = await _elevenLabs.GetVoicesAsync();
        return Ok(voices);
    }

    [HttpPost("api/v1/voice-preview")]
    [AllowAnonymous]
    public async Task<IActionResult> PreviewVoice([FromBody] VoicePreviewRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text)) return BadRequest("Text is required");
        var audio = await _elevenLabs.GenerateSpeechAsync(request.Text, request.VoiceId);
        if (audio == null) return StatusCode(500, "Failed to generate audio");
        return File(audio, "audio/mpeg");
    }

    public record VoicePreviewRequest(string Text, string? VoiceId);
}
