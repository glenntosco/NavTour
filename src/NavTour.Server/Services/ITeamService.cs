using NavTour.Shared.DTOs.Team;

namespace NavTour.Server.Services;

public interface ITeamService
{
    Task<TeamSummaryResponse> GetTeamAsync(Guid currentUserId);
    Task<(TeamMemberResponse? Member, string? TempPassword, string? Error)> InviteAsync(InviteMemberRequest request, Guid invitedByUserId);
    Task<(TeamMemberResponse? Member, string? Error)> UpdateRoleAsync(Guid memberId, UpdateMemberRoleRequest request);
    Task<(bool Success, string? Error)> DeactivateAsync(Guid memberId);
    Task<(bool Success, string? Error)> ReactivateAsync(Guid memberId);
}
