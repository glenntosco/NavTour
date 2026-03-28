namespace NavTour.Shared.Models;

public class HubEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid HubId { get; set; }
    public string EventType { get; set; } = "";  // open, search, categoryClick, demoStart, demoComplete
    public string? EventData { get; set; }        // JSON: { query: "...", demoSlug: "...", category: "..." }
    public string? VisitorId { get; set; }         // Anonymous fingerprint from localStorage
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
