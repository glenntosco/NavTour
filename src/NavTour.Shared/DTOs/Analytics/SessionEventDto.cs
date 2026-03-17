using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Analytics;

public record SessionEventDto(EventType EventType, int? StepNumber, string? EventData, DateTime OccurredAt);
