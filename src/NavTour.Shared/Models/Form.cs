namespace NavTour.Shared.Models;

public class Form : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FieldsJson { get; set; } = "[]";
    public string? SettingsJson { get; set; }
    public bool IsStandalone { get; set; }
    public long SubmissionCount { get; set; }
    public long ViewCount { get; set; }

    public List<Demo> Demos { get; set; } = [];
}
