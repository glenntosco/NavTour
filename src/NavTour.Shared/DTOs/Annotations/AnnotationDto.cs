using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Annotations;

public record AnnotationDto(Guid? Id, AnnotationType Type, string? Title, string? Content, double PositionX, double PositionY, double Width, double Height, string? Style);
