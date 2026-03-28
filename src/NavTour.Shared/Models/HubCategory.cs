namespace NavTour.Shared.Models;

public class HubCategory : TenantEntity
{
    public Guid DemoHubId { get; set; }
    public string Name { get; set; } = "New Category";
    public string? Icon { get; set; }         // emoji or icon name
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public List<HubItem> Items { get; set; } = [];
}
