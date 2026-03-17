using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Player;

public record PlayerStepDto(Guid Id, Guid FrameId, int StepNumber, string? ClickTargetSelector, NavigationAction NavigationAction, string? NavigationTarget, List<PlayerAnnotationDto> Annotations);
