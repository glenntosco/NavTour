using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Steps;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
public class StepsController : ControllerBase
{
    private readonly IStepService _stepService;

    public StepsController(IStepService stepService)
    {
        _stepService = stepService;
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
}
