namespace NavTour.Shared.DTOs.Forms;

public record FormSubmissionRequest(
    Dictionary<string, string> FieldValues
);
