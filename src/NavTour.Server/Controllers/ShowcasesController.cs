using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Showcases;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/showcases")]
[Authorize]
public class ShowcasesController : ControllerBase
{
    private readonly ShowcaseService _showcaseService;

    public ShowcasesController(ShowcaseService showcaseService)
        => _showcaseService = showcaseService;

    [HttpGet]
    public async Task<ActionResult<List<ShowcaseResponse>>> GetAll()
        => Ok(await _showcaseService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ShowcaseResponse>> Get(Guid id)
    {
        var sc = await _showcaseService.GetByIdAsync(id);
        return sc == null ? NotFound() : Ok(sc);
    }

    [HttpPost]
    public async Task<ActionResult<ShowcaseResponse>> Create(CreateShowcaseRequest request)
        => Ok(await _showcaseService.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ShowcaseResponse>> Update(Guid id, UpdateShowcaseRequest request)
    {
        var sc = await _showcaseService.UpdateAsync(id, request);
        return sc == null ? NotFound() : Ok(sc);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _showcaseService.DeleteAsync(id) ? Ok() : NotFound();

    // Sections
    [HttpPost("sections")]
    public async Task<ActionResult<ShowcaseSectionResponse>> AddSection(CreateSectionRequest request)
        => Ok(await _showcaseService.AddSectionAsync(request));

    [HttpPut("sections/{id:guid}")]
    public async Task<ActionResult<ShowcaseSectionResponse>> UpdateSection(Guid id, UpdateSectionRequest request)
    {
        var section = await _showcaseService.UpdateSectionAsync(id, request);
        return section == null ? NotFound() : Ok(section);
    }

    [HttpDelete("sections/{id:guid}")]
    public async Task<IActionResult> DeleteSection(Guid id)
        => await _showcaseService.DeleteSectionAsync(id) ? Ok() : NotFound();

    // Items
    [HttpPost("items")]
    public async Task<ActionResult<ShowcaseItemResponse>> AddItem(AddShowcaseItemRequest request)
        => Ok(await _showcaseService.AddItemAsync(request));

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<ShowcaseItemResponse>> UpdateItem(Guid id, UpdateShowcaseItemRequest request)
    {
        var item = await _showcaseService.UpdateItemAsync(id, request);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
        => await _showcaseService.DeleteItemAsync(id) ? Ok() : NotFound();

    // Public endpoint
    [HttpGet("public/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ShowcaseResponse>> GetPublic(string slug)
    {
        var sc = await _showcaseService.GetBySlugAsync(slug);
        return sc == null ? NotFound() : Ok(sc);
    }
}
