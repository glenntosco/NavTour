using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

// NOTE: SessionEvent uses long PK for high-volume writes, not TenantEntity base.
// Services creating SessionEvent must set TenantId manually (not auto-set by SetAuditFields).
public class SessionEvent
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid SessionId { get; set; }
    public EventType EventType { get; set; }
    public int? StepNumber { get; set; }
    public string? EventData { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public DemoSession Session { get; set; } = null!;
}
