namespace NavTour.Shared.Models;

public class LeadEmailTemplate : TenantEntity
{
    public string Subject { get; set; } = "Thanks for checking out {{demo_name}}!";
    public string Heading { get; set; } = "Thanks for your interest!";
    public string Body { get; set; } = "We're glad you took the time to explore {{demo_name}}. We'd love to show you more of what we can do for your team.";
    public string CtaText { get; set; } = "Visit Our Website";
    public string? CtaUrl { get; set; }
    public string AccentColor { get; set; } = "#4361ee";
    public bool IsEnabled { get; set; } = true;
}
