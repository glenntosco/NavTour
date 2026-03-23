using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Forms;

public record FormSettingsDto(
    string? Title,
    string? Subtitle,
    string? SubmitButtonText,
    bool ShowLogo,
    bool ShowConfirmation,
    RepeatVisitorBehavior RepeatBehavior
);
