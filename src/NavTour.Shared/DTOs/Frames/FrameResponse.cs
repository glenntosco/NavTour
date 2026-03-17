namespace NavTour.Shared.DTOs.Frames;

public record FrameResponse(Guid Id, int SequenceOrder, string? ThumbnailUrl, DateTime CreatedAt);
