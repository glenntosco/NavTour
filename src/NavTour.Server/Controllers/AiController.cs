using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Ai;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AnthropicService _ai;

    public AiController(AnthropicService ai) => _ai = ai;

    [HttpPost("write-content")]
    public async Task<ActionResult<StepContent>> WriteContent([FromBody] WriteContentRequest request)
    {
        var result = await _ai.GenerateStepContentAsync(request.Title, request.Context, request.Tone ?? "professional");
        return result != null ? Ok(result) : StatusCode(500, "AI generation failed");
    }

    [HttpPost("translate")]
    public async Task<ActionResult<List<TranslatedStep>>> Translate([FromBody] TranslateRequest request)
    {
        var result = await _ai.TranslateStepsAsync(request.Steps, request.TargetLanguage);
        return result != null ? Ok(result) : StatusCode(500, "Translation failed");
    }

    [HttpPost("score")]
    public async Task<ActionResult<DemoQualityScore>> Score([FromBody] ScoreRequest request)
    {
        var result = await _ai.ScoreDemoQualityAsync(request.Steps, request.FrameCount);
        return result != null ? Ok(result) : StatusCode(500, "Scoring failed");
    }
}
