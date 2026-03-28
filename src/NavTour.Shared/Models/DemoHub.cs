namespace NavTour.Shared.Models;

public class DemoHub : TenantEntity
{
    public string Name { get; set; } = "Demo Hub";
    public string? Slug { get; set; }
    public string? AppearanceSettings { get; set; }  // JSON
    public string? BehaviorSettings { get; set; }     // JSON
    public string? InstallSettings { get; set; }      // JSON
    public bool IsPublished { get; set; }
    public List<HubCategory> Categories { get; set; } = [];
}
