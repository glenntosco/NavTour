namespace NavTour.Shared.DTOs.Frames;

public record FrameDetailResponse(Guid Id, string? Name, int SequenceOrder, string HtmlContent, string? CssContent, DateTime CreatedAt);
