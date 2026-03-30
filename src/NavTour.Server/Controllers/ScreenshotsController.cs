using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Screenshots;
using System.Security.Claims;



namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/screenshots")]
[Authorize]
public class ScreenshotsController(ScreenshotService screenshotService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await screenshotService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await screenshotService.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScreenshotRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await screenshotService.CreateAsync(request, userId));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateScreenshotRequest request)
    {
        var result = await screenshotService.UpdateAsync(id, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await screenshotService.DeleteAsync(id);
        return deleted ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var ok = await screenshotService.PublishAsync(id);
        return ok ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id)
    {
        var ok = await screenshotService.UnpublishAsync(id);
        return ok ? Ok() : NotFound();
    }

    [HttpGet("{id:guid}/slides")]
    public async Task<IActionResult> GetSlides(Guid id) =>
        Ok(await screenshotService.GetSlidesAsync(id));

    [HttpPost("{id:guid}/slides")]
    public async Task<IActionResult> AddSlide(Guid id, IFormFile image, [FromForm] string? name)
    {
        var slide = await screenshotService.AddSlideAsync(id, image, name);
        return Ok(slide);
    }

    [HttpPut("slides/{slideId:guid}")]
    public async Task<IActionResult> UpdateSlide(Guid slideId, [FromBody] UpdateSlideRequest request)
    {
        var result = await screenshotService.UpdateSlideAsync(slideId, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("slides/{slideId:guid}")]
    public async Task<IActionResult> DeleteSlide(Guid slideId)
    {
        var deleted = await screenshotService.DeleteSlideAsync(slideId);
        return deleted ? Ok() : NotFound();
    }

    [HttpPut("{id:guid}/slides/reorder")]
    public async Task<IActionResult> ReorderSlides(Guid id, [FromBody] ReorderSlidesRequest request)
    {
        await screenshotService.ReorderSlidesAsync(id, request.SlideIds);
        return Ok();
    }

    [HttpGet("view/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicBySlug(string slug)
    {
        var result = await screenshotService.GetPublicBySlugAsync(slug);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("view/{slug}/slides")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicSlides(string slug)
    {
        var slides = await screenshotService.GetPublicSlidesAsync(slug);
        return Ok(slides);
    }
}
