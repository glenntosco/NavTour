using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Forms;

public record FormFieldDefinition(
    string Key,
    FormFieldType FieldType,
    string Label,
    string? Placeholder,
    string? Description,
    bool IsRequired,
    int SortOrder,
    List<string>? Options
);
