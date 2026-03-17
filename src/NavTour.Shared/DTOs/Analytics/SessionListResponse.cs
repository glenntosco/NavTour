namespace NavTour.Shared.DTOs.Analytics;

public record SessionListResponse(Guid Id, DateTime StartedAt, DateTime? CompletedAt, int StepsViewed, int TotalSteps, bool Completed, string? Source);
