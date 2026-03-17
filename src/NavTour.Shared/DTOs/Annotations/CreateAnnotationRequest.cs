using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Annotations;

public record CreateAnnotationRequest(
    AnnotationType Type, string? Title, string? Content,
    double PositionX, double PositionY, double Width, double Height,
    string? Style, string? TargetSelector = null, string? ArrowDirection = null, int? BadgeNumber = null);
