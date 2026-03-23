using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Forms;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/forms")]
[Authorize]
public class FormsController : ControllerBase
{
    private readonly IFormService _formService;

    public FormsController(IFormService formService)
    {
        _formService = formService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FormListItemResponse>>> GetAll()
    {
        return Ok(await _formService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FormResponse>> GetById(Guid id)
    {
        var form = await _formService.GetByIdAsync(id);
        return form == null ? NotFound() : Ok(form);
    }

    [HttpPost]
    public async Task<ActionResult<FormResponse>> Create(CreateFormRequest request)
    {
        var form = await _formService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FormResponse>> Update(Guid id, UpdateFormRequest request)
    {
        var form = await _formService.UpdateAsync(id, request);
        return form == null ? NotFound() : Ok(form);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _formService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpGet("by-slug/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<FormResponse>> GetBySlug(string slug)
    {
        var form = await _formService.GetBySlugPublicAsync(slug);
        return form == null ? NotFound() : Ok(form);
    }

    [HttpPost("{id:guid}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> IncrementViewCount(Guid id)
    {
        await _formService.IncrementViewCountAsync(id);
        return Ok();
    }

    [HttpPost("{id:guid}/submission")]
    [AllowAnonymous]
    public async Task<IActionResult> IncrementSubmissionCount(Guid id)
    {
        await _formService.IncrementSubmissionCountAsync(id);
        return Ok();
    }
}
