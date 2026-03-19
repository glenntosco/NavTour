using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Team;
using NavTour.Shared.Enums;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/team")]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<TeamSummaryResponse>> GetTeam()
    {
        return Ok(await _teamService.GetTeamAsync(GetUserId()));
    }

    [HttpPost("invite")]
    public async Task<IActionResult> Invite(InviteMemberRequest request)
    {
        if (!IsOwnerOrAdmin())
            return Forbid();

        var userId = GetUserId();
        var (member, tempPassword, error) = await _teamService.InviteAsync(request, userId);
        if (error != null)
            return BadRequest(new { message = error });

        return Ok(new { member, tempPassword });
    }

    [HttpPut("{memberId:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid memberId, UpdateMemberRoleRequest request)
    {
        if (!IsOwnerOrAdmin())
            return Forbid();

        var (member, error) = await _teamService.UpdateRoleAsync(memberId, request);
        if (error != null)
            return BadRequest(new { message = error });

        return Ok(member);
    }

    [HttpPost("{memberId:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid memberId)
    {
        if (!IsOwnerOrAdmin())
            return Forbid();

        var (success, error) = await _teamService.DeactivateAsync(memberId);
        if (!success)
            return BadRequest(new { message = error });

        return Ok();
    }

    [HttpPost("{memberId:guid}/reactivate")]
    public async Task<IActionResult> Reactivate(Guid memberId)
    {
        if (!IsOwnerOrAdmin())
            return Forbid();

        var (success, error) = await _teamService.ReactivateAsync(memberId);
        if (!success)
            return BadRequest(new { message = error });

        return Ok();
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private bool IsOwnerOrAdmin()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return role == nameof(UserRole.Owner) || role == nameof(UserRole.Admin);
    }
}
