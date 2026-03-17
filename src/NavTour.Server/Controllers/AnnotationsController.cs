using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Annotations;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/steps/{stepId:guid}/annotations")]
[Authorize]
public class AnnotationsController : ControllerBase
{
    private readonly IAnnotationService _annotationService;

    public AnnotationsController(IAnnotationService annotationService)
    {
        _annotationService = annotationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AnnotationResponse>>> GetAll(Guid stepId)
    {
        return Ok(await _annotationService.GetByStepAsync(stepId));
    }

    [HttpPost]
    public async Task<ActionResult<AnnotationResponse>> Create(Guid stepId, CreateAnnotationRequest request)
    {
        var annotation = await _annotationService.CreateAsync(stepId, request);
        return Created($"api/v1/steps/{stepId}/annotations/{annotation.Id}", annotation);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AnnotationResponse>> Update(Guid id, CreateAnnotationRequest request)
    {
        var annotation = await _annotationService.UpdateAsync(id, request);
        return annotation == null ? NotFound() : Ok(annotation);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _annotationService.DeleteAsync(id) ? NoContent() : NotFound();
    }
}
