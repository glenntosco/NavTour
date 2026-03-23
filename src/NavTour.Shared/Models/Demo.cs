using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Demo : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DemoStatus Status { get; set; } = DemoStatus.Draft;
    public string? Settings { get; set; }
    public string Locale { get; set; } = "en";
    public long ViewCount { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid? FormId { get; set; }

    public Form? Form { get; set; }
    public List<Frame> Frames { get; set; } = [];
    public List<Step> Steps { get; set; } = [];
    public List<DemoSession> Sessions { get; set; } = [];
}
