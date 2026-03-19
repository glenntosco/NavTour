namespace NavTour.Shared.DTOs.Frames;

public record FrameResponse(Guid Id, string? Name, int SequenceOrder, string? ThumbnailUrl, DateTime CreatedAt);
