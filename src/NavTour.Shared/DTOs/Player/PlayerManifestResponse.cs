using NavTour.Shared.DTOs.Forms;

namespace NavTour.Shared.DTOs.Player;

public record PlayerManifestResponse(
    string DemoName,
    string Slug,
    string? Settings,
    List<PlayerFrameDto> Frames,
    List<PlayerStepDto> Steps,
    List<FormFieldDefinition>? FormFields = null,
    FormSettingsDto? FormSettings = null);
