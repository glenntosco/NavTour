namespace NavTour.Shared.DTOs.Forms;

public record FormListItemResponse(
    Guid Id,
    string Name,
    string Slug,
    int FieldCount,
    long SubmissionCount,
    long ViewCount,
    decimal ConversionRate,
    int AssignedDemoCount,
    DateTime CreatedAt
);
