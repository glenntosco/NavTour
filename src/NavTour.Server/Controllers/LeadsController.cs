using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeadResponse>>> GetAll()
    {
        return Ok(await _leadService.GetAllAsync());
    }
}
