using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Team;

public record TeamMemberResponse(
    Guid Id,
    string Email,
    string FullName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt);
