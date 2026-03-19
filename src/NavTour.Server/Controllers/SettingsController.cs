using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Shared.Models;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly NavTourDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITenantProvider _tenantProvider;

    public SettingsController(NavTourDbContext db, UserManager<ApplicationUser> userManager, ITenantProvider tenantProvider)
    {
        _db = db;
        _userManager = userManager;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var userId = _userManager.GetUserId(User);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        var tenant = await _db.Tenants.FindAsync(_tenantProvider.TenantId);

        return Ok(new
        {
            CompanyName = tenant?.Name ?? "",
            Slug = tenant?.Slug ?? "",
            Plan = tenant?.Plan ?? "Starter",
            Email = user.Email ?? "",
            FullName = user.FullName ?? ""
        });
    }

    [HttpPut("workspace")]
    public async Task<IActionResult> UpdateWorkspace([FromBody] UpdateWorkspaceRequest request)
    {
        var tenant = await _db.Tenants.FindAsync(_tenantProvider.TenantId);
        if (tenant == null) return NotFound();

        tenant.Name = request.Name;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = _userManager.GetUserId(User);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        user.FullName = request.FullName;
        await _userManager.UpdateAsync(user);
        return Ok();
    }

    public record UpdateWorkspaceRequest(string Name);
    public record UpdateProfileRequest(string FullName);
}
