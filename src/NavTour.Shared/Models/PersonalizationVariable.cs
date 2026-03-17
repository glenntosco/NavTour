namespace NavTour.Shared.Models;

public class PersonalizationVariable : TenantEntity
{
    public Guid DemoId { get; set; }
    public string Key { get; set; } = "";
    public string DefaultValue { get; set; } = "";
    public string? Description { get; set; }

    public Demo Demo { get; set; } = null!;
}
