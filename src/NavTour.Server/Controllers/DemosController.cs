using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Demos;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.Enums;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/demos")]
[Authorize]
public class DemosController : ControllerBase
{
    private readonly IDemoService _demoService;

    public DemosController(IDemoService demoService)
    {
        _demoService = demoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DemoListItemResponse>>> GetAll()
    {
        return Ok(await _demoService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DemoResponse>> GetById(Guid id)
    {
        var demo = await _demoService.GetByIdAsync(id);
        return demo == null ? NotFound() : Ok(demo);
    }

    [HttpPost]
    public async Task<ActionResult<DemoResponse>> Create(CreateDemoRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var demo = await _demoService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = demo.Id }, demo);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DemoResponse>> Update(Guid id, UpdateDemoRequest request)
    {
        var demo = await _demoService.UpdateAsync(id, request);
        return demo == null ? NotFound() : Ok(demo);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _demoService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        return await _demoService.PublishAsync(id) ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id)
    {
        return await _demoService.UnpublishAsync(id) ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/generate-tour")]
    public async Task<IActionResult> GenerateTour(Guid id, [FromBody] GenerateTourRequest? request,
        [FromServices] AnthropicService anthropic, [FromServices] IFrameService frameService, [FromServices] IStepService stepService)
    {
        // 1. Get all frames for this demo
        var frames = await frameService.GetAllByDemoAsync(id);
        if (frames == null || frames.Count == 0)
            return BadRequest("Demo has no frames. Capture pages first.");

        // 2. Build frame content list
        var frameContents = new List<FrameContent>();
        foreach (var frame in frames.OrderBy(f => f.SequenceOrder))
        {
            var detail = await frameService.GetByIdAsync(frame.Id);
            if (detail != null)
                frameContents.Add(new FrameContent(frame.Id, detail.HtmlContent));
        }

        // 3. Call Claude to generate tour
        var generatedSteps = await anthropic.GenerateTourAsync(frameContents, request?.Prompt);
        if (generatedSteps == null || generatedSteps.Count == 0)
            return StatusCode(500, "AI failed to generate tour. Please try again.");

        // 4. Map generated steps to StepDto format
        var orderedFrames = frames.OrderBy(f => f.SequenceOrder).ToList();
        var stepDtos = generatedSteps.Select(gs =>
        {
            var frameId = gs.FrameIndex >= 0 && gs.FrameIndex < orderedFrames.Count
                ? orderedFrames[gs.FrameIndex].Id
                : orderedFrames[0].Id;

            return new StepDto(
                null, frameId, gs.StepNumber, null,
                NavigationAction.NextStep, null,
                new List<AnnotationDto>
                {
                    new(null, AnnotationType.NumberedTooltip,
                        gs.Title, gs.Content,
                        gs.PositionX, gs.PositionY, 22, 25,
                        "{\"backgroundColor\":\"#ffffff\",\"textColor\":\"#000000\",\"opacity\":\"100\"}",
                        null, gs.ArrowDirection, gs.StepNumber)
                },
                TriggerType.ButtonClick, null, null,
                gs.VoiceoverText);
        }).ToList();

        // Set last step to EndDemo
        if (stepDtos.Count > 0)
        {
            var last = stepDtos[^1];
            stepDtos[^1] = last with { NavigationAction = NavigationAction.EndDemo };
        }

        // 5. Save via existing step service
        await stepService.UpdateStepsAsync(id, new UpdateStepsRequest(stepDtos));

        return Ok(new { stepsGenerated = stepDtos.Count });
    }

    public record GenerateTourRequest(string? Prompt);
}
