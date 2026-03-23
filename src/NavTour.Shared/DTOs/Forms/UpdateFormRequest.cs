namespace NavTour.Shared.DTOs.Forms;

public record UpdateFormRequest(
    string? Name,
    string? Description,
    List<FormFieldDefinition>? Fields,
    FormSettingsDto? Settings,
    bool? IsStandalone
);
