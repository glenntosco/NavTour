using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Showcase : TenantEntity
{
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public DemoStatus Status { get; set; } = DemoStatus.Draft;
    public string LayoutTheme { get; set; } = "checklist"; // checklist | sidebar
    public bool Autoplay { get; set; }
    public string? Settings { get; set; }
    public long ViewCount { get; set; }
    public List<ShowcaseSection> Sections { get; set; } = [];
}

public class ShowcaseSection : TenantEntity
{
    public Guid ShowcaseId { get; set; }
    public string Name { get; set; } = "New Section";
    public int SortOrder { get; set; }
    public List<ShowcaseItem> Items { get; set; } = [];
}

public class ShowcaseItem : TenantEntity
{
    public Guid SectionId { get; set; }
    public Guid DemoId { get; set; }
    public int SortOrder { get; set; }
    public string? TitleOverride { get; set; }
}
