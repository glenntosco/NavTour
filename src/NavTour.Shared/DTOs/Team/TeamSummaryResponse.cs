namespace NavTour.Shared.DTOs.Team;

public record TeamSummaryResponse(
    List<TeamMemberResponse> Members,
    int SeatsUsed,
    int SeatsTotal,
    string Plan,
    string CurrentUserRole);
