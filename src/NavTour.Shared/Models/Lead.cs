namespace NavTour.Shared.Models;

public class Lead : TenantEntity
{
    public Guid SessionId { get; set; }
    public Guid? FormId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Company { get; set; }
    public string? CustomData { get; set; }

    public DemoSession Session { get; set; } = null!;
    public Form? Form { get; set; }
}
