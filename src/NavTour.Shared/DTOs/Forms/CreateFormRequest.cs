namespace NavTour.Shared.DTOs.Forms;

public record CreateFormRequest(
    string Name,
    string? Description,
    List<FormFieldDefinition> Fields,
    FormSettingsDto? Settings,
    bool IsStandalone
);
