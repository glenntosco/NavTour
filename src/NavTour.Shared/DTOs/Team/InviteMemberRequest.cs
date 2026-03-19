using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Team;

public record InviteMemberRequest(string Email, UserRole Role, string? FullName);
