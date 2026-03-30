using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Screenshot : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DemoStatus Status { get; set; } = DemoStatus.Draft;
    public string? Settings { get; set; }
    public long ViewCount { get; set; }
    public Guid CreatedBy { get; set; }
    public List<ScreenshotSlide> Slides { get; set; } = [];
}
