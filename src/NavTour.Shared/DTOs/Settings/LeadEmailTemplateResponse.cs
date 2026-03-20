namespace NavTour.Shared.DTOs.Settings;

public record LeadEmailTemplateResponse(
    string Subject,
    string Heading,
    string Body,
    string CtaText,
    string? CtaUrl,
    string AccentColor,
    bool IsEnabled
);
