using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Demos;

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
}
