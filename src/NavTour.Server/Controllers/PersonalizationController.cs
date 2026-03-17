using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Personalization;

namespace NavTour.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/demos/{demoId:guid}/variables")]
public class PersonalizationController : ControllerBase
{
    private readonly IPersonalizationService _service;

    public PersonalizationController(IPersonalizationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<VariableListResponse>> Get(Guid demoId)
    {
        var vars = await _service.GetVariablesAsync(demoId);
        return Ok(new VariableListResponse(vars));
    }

    [HttpPut]
    public async Task<IActionResult> Save(Guid demoId, VariableListResponse request)
    {
        await _service.SaveVariablesAsync(demoId, request.Variables);
        return Ok();
    }
}
