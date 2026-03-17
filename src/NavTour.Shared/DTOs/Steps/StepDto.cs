using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Steps;

public record StepDto(Guid? Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<AnnotationDto> Annotations);
