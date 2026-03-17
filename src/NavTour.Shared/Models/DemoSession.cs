namespace NavTour.Shared.Models;

public class DemoSession : TenantEntity
{
    public Guid DemoId { get; set; }
    public string? ViewerFingerprint { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Source { get; set; }

    public Demo Demo { get; set; } = null!;
    public List<SessionEvent> Events { get; set; } = [];
    public Lead? Lead { get; set; }
}
