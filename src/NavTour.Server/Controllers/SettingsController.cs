using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Settings;
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
    private readonly IEmailService _emailService;

    public SettingsController(NavTourDbContext db, UserManager<ApplicationUser> userManager, ITenantProvider tenantProvider, IEmailService emailService)
    {
        _db = db;
        _userManager = userManager;
        _tenantProvider = tenantProvider;
        _emailService = emailService;
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

    [HttpGet("lead-email")]
    public async Task<IActionResult> GetLeadEmailTemplate()
    {
        var template = await _db.LeadEmailTemplates.FirstOrDefaultAsync();

        // Return defaults if no template exists yet
        var defaults = template ?? new LeadEmailTemplate();
        return Ok(new LeadEmailTemplateResponse(
            defaults.Subject, defaults.Heading, defaults.Body,
            defaults.CtaText, defaults.CtaUrl, defaults.AccentColor, defaults.IsEnabled));
    }

    [HttpPut("lead-email")]
    public async Task<IActionResult> UpdateLeadEmailTemplate([FromBody] UpdateLeadEmailTemplateRequest request)
    {
        var template = await _db.LeadEmailTemplates.FirstOrDefaultAsync();

        if (template == null)
        {
            template = new LeadEmailTemplate();
            _db.LeadEmailTemplates.Add(template);
        }

        template.Subject = request.Subject;
        template.Heading = request.Heading;
        template.Body = request.Body;
        template.CtaText = request.CtaText;
        template.CtaUrl = request.CtaUrl;
        template.AccentColor = request.AccentColor;
        template.IsEnabled = request.IsEnabled;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("lead-email/test")]
    public async Task<IActionResult> SendTestLeadEmail()
    {
        var userId = _userManager.GetUserId(User);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user?.Email == null) return BadRequest("No email on account");

        var template = await _db.LeadEmailTemplates.FirstOrDefaultAsync() ?? new LeadEmailTemplate();

        await _emailService.SendLeadEmailAsync(user.Email, user.FullName ?? "Test User", "Sample Demo", template);
        return Ok();
    }

    public record UpdateWorkspaceRequest(string Name);
    public record UpdateProfileRequest(string FullName);
}
