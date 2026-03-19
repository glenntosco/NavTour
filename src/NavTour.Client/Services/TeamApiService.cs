using System.Net.Http.Json;
using NavTour.Shared.DTOs.Team;

namespace NavTour.Client.Services;

public class TeamApiService
{
    private readonly HttpClient _http;

    public TeamApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<TeamSummaryResponse?> GetTeamAsync()
        => await _http.GetFromJsonAsync<TeamSummaryResponse>("api/v1/team");

    public async Task<InviteResult?> InviteAsync(InviteMemberRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/team/invite", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<InviteResult>();

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        return new InviteResult(null, null, error?.Message ?? "Failed to invite member");
    }

    public async Task<TeamMemberResponse?> UpdateRoleAsync(Guid memberId, UpdateMemberRoleRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/team/{memberId}/role", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<TeamMemberResponse>() : null;
    }

    public async Task<bool> DeactivateAsync(Guid memberId)
    {
        var response = await _http.PostAsync($"api/v1/team/{memberId}/deactivate", null);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> ReactivateAsync(Guid memberId)
    {
        var response = await _http.PostAsync($"api/v1/team/{memberId}/reactivate", null);
        return response.IsSuccessStatusCode;
    }

    public record InviteResult(TeamMemberResponse? Member, string? TempPassword, string? Error = null);
    private record ErrorResponse(string? Message);
}
