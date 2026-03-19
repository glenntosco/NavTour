using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Frames;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
public class FramesController : ControllerBase
{
    private readonly IFrameService _frameService;

    public FramesController(IFrameService frameService)
    {
        _frameService = frameService;
    }

    [HttpGet("api/v1/demos/{demoId:guid}/frames")]
    public async Task<ActionResult<List<FrameResponse>>> GetAll(Guid demoId)
    {
        return Ok(await _frameService.GetAllByDemoAsync(demoId));
    }

    [HttpGet("api/v1/frames/{id:guid}")]
    public async Task<ActionResult<FrameDetailResponse>> GetById(Guid id)
    {
        var frame = await _frameService.GetByIdAsync(id);
        return frame == null ? NotFound() : Ok(frame);
    }

    [HttpPost("api/v1/demos/{demoId:guid}/frames")]
    public async Task<ActionResult<FrameResponse>> Upload(Guid demoId, IFormFile file)
    {
        var frame = await _frameService.UploadAsync(demoId, file);
        return CreatedAtAction(nameof(GetById), new { id = frame.Id }, frame);
    }

    [HttpPut("api/v1/frames/{id:guid}")]
    public async Task<ActionResult<FrameDetailResponse>> Update(Guid id, IFormFile file)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var htmlContent = await reader.ReadToEndAsync();
        string? cssContent = null;
        var styleMatches = System.Text.RegularExpressions.Regex.Matches(htmlContent, @"<style[^>]*>([\s\S]*?)</style>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (styleMatches.Count > 0)
            cssContent = string.Join("\n", styleMatches.Select(m => m.Groups[1].Value));

        var frame = await _frameService.UpdateAsync(id, htmlContent, cssContent);
        return frame == null ? NotFound() : Ok(frame);
    }

    [HttpPatch("api/v1/frames/{id:guid}/content")]
    public async Task<ActionResult<FrameDetailResponse>> PatchContent(Guid id, PatchFrameContentRequest request)
    {
        var frame = await _frameService.UpdateAsync(id, request.HtmlContent, request.CssContent);
        return frame == null ? NotFound() : Ok(frame);
    }

    [HttpPatch("api/v1/frames/{id:guid}/rename")]
    public async Task<IActionResult> Rename(Guid id, RenameFrameRequest request)
    {
        return await _frameService.RenameAsync(id, request.Name) ? Ok() : NotFound();
    }

    [HttpDelete("api/v1/frames/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _frameService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpPut("api/v1/demos/{demoId:guid}/frames/reorder")]
    public async Task<IActionResult> Reorder(Guid demoId, ReorderFramesRequest request)
    {
        return await _frameService.ReorderAsync(demoId, request) ? Ok() : NotFound();
    }
}
