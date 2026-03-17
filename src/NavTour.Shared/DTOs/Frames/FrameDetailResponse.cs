namespace NavTour.Shared.DTOs.Frames;

public record FrameDetailResponse(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent, DateTime CreatedAt);
