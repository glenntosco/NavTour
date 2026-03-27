using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Auth;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtService;
    private readonly NavTourDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtService,
        NavTourDbContext dbContext,
        ITenantProvider tenantProvider)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
    {
        if (!request.AcceptedTerms)
            return BadRequest("You must accept the Terms of Use to create an account.");

        var tenant = new Tenant
        {
            Name = request.CompanyName,
            Slug = request.CompanyName.ToLowerInvariant().Replace(" ", "-"),
            Plan = "Starter",
            IsActive = true
        };
        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync();

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            TenantId = tenant.Id,
            Role = UserRole.Owner,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            _dbContext.Tenants.Remove(tenant);
            await _dbContext.SaveChangesAsync();
            return BadRequest(result.Errors);
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        SetAuthCookie(accessToken);
        return Ok(new LoginResponse(accessToken, refreshToken, DateTime.UtcNow.AddHours(24), tenant.Id, false));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { message = "Invalid email or password" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account deactivated" });

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        SetAuthCookie(accessToken);
        return Ok(new LoginResponse(accessToken, refreshToken, DateTime.UtcNow.AddHours(24), user.TenantId, user.HasCompletedOnboarding));
    }

    [HttpPost("logout")]
    public IActionResult LogoutApi()
    {
        Response.Cookies.Delete("navtour_auth");
        return Ok();
    }

    [HttpPost("refresh")]
    public ActionResult<LoginResponse> Refresh(RefreshRequest request)
    {
        return BadRequest(new { message = "Refresh not yet implemented — re-login required" });
    }

    [HttpPost("complete-onboarding")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> CompleteOnboarding()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.HasCompletedOnboarding = true;
        await _userManager.UpdateAsync(user);
        return Ok();
    }

    private void SetAuthCookie(string token)
    {
        Response.Cookies.Append("navtour_auth", token, new CookieOptions
        {
            HttpOnly = false,
            SameSite = SameSiteMode.Lax,
            Secure = false, // Set true in production with HTTPS
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddHours(24),
        });
    }
}
