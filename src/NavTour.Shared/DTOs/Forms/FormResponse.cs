namespace NavTour.Shared.DTOs.Forms;

public record FormResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    List<FormFieldDefinition> Fields,
    FormSettingsDto? Settings,
    bool IsStandalone,
    long SubmissionCount,
    long ViewCount,
    int AssignedDemoCount,
    DateTime CreatedAt
);
