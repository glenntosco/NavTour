namespace NavTour.Shared.Models;

public class HubItem : TenantEntity
{
    public Guid HubCategoryId { get; set; }
    public string ItemType { get; set; } = "demo";  // demo, video, link
    public Guid? DemoId { get; set; }                // FK to Demo (when type=demo)
    public string? ExternalUrl { get; set; }         // for type=link or video
    public string? TitleOverride { get; set; }
    public string? DescriptionOverride { get; set; }
    public string? ThumbnailOverride { get; set; }
    public int SortOrder { get; set; }
}
