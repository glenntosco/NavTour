using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Player;

public record PlayerAnnotationDto(AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
