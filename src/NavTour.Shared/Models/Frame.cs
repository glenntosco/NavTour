namespace NavTour.Shared.Models;

public class Frame : TenantEntity
{
    public Guid DemoId { get; set; }
    public int SequenceOrder { get; set; }
    public string HtmlContent { get; set; } = string.Empty;
    public string? CssContent { get; set; }
    public string? ThumbnailUrl { get; set; }

    public Demo Demo { get; set; } = null!;
}
