namespace NavTour.Shared.DTOs.Player;

public record PlayerFrameDto(Guid Id, int SequenceOrder, string HtmlContent, string? CssContent);
