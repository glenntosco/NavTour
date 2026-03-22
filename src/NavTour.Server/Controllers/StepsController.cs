using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public StepsController(IStepService stepService, NavTourDbContext db)
    {
        _stepService = stepService;
        _db = db;
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
        var step = await _db.Steps.FindAsync(stepId);
        if (step?.VoiceoverAudio == null) return NotFound();
        return File(step.VoiceoverAudio, "audio/mpeg");
    }
}
