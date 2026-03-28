using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Steps;

public record StepResponse(
    Guid Id, Guid? FrameId, int StepNumber, string? ClickTargetSelector,
    NavigationAction NavigationAction, string? NavigationTarget,
    List<AnnotationResponse> Annotations,
    TriggerType TriggerType = TriggerType.ButtonClick,
    int? TriggerDurationMs = null,
    string? BackdropLevel = null,
    string? VoiceoverText = null,
    string? VoiceId = null,
    StepType Type = StepType.Content,
    string? ChapterSettings = null);
