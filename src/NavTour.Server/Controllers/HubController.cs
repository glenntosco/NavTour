using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Hub;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/hubs")]
[Authorize]
public class HubController : ControllerBase
{
    private readonly HubService _hubService;
    public HubController(HubService hubService) => _hubService = hubService;

    [HttpGet]
    public async Task<ActionResult<List<HubResponse>>> GetAll()
        => Ok(await _hubService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<HubResponse>> Get(Guid id)
    {
        var hub = await _hubService.GetByIdAsync(id);
        return hub == null ? NotFound() : Ok(hub);
    }

    [HttpPost]
    public async Task<ActionResult<HubResponse>> Create(CreateHubRequest request)
        => Ok(await _hubService.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<HubResponse>> Update(Guid id, UpdateHubRequest request)
    {
        var hub = await _hubService.UpdateAsync(id, request);
        return hub == null ? NotFound() : Ok(hub);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _hubService.DeleteAsync(id) ? Ok() : NotFound();

    // Categories
    [HttpPost("categories")]
    public async Task<ActionResult<HubCategoryResponse>> AddCategory(CreateCategoryRequest request)
        => Ok(await _hubService.AddCategoryAsync(request));

    [HttpPut("categories/{id:guid}")]
    public async Task<ActionResult<HubCategoryResponse>> UpdateCategory(Guid id, UpdateCategoryRequest request)
    {
        var cat = await _hubService.UpdateCategoryAsync(id, request);
        return cat == null ? NotFound() : Ok(cat);
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
        => await _hubService.DeleteCategoryAsync(id) ? Ok() : NotFound();

    // Items
    [HttpPost("items")]
    public async Task<ActionResult<HubItemResponse>> AddItem(AddItemRequest request)
        => Ok(await _hubService.AddItemAsync(request));

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<HubItemResponse>> UpdateItem(Guid id, UpdateItemRequest request)
    {
        var item = await _hubService.UpdateItemAsync(id, request);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
        => await _hubService.DeleteItemAsync(id) ? Ok() : NotFound();

    // Public endpoint for widget SDK (no auth — uses hub slug)
    [HttpGet("public/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<HubResponse>> GetPublic(string slug)
    {
        var hub = await _hubService.GetBySlugAsync(slug);
        if (hub == null || !hub.IsPublished) return NotFound();
        return Ok(hub);
    }
}
