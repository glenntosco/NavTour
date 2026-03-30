namespace NavTour.Shared.Models;

public class ScreenshotSlide : TenantEntity
{
    public Guid ScreenshotId { get; set; }
    public int SequenceOrder { get; set; }
    public string? Name { get; set; }
    public string ImageData { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? AnnotationData { get; set; }
    public string? CropData { get; set; }
    public string? DisplaySettings { get; set; }
    public Screenshot Screenshot { get; set; } = null!;
}
