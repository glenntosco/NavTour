namespace NavTour.Shared.DTOs.Analytics;

public record EventBatchRequest(Guid? SessionId, string? ViewerFingerprint, List<SessionEventDto> Events);
