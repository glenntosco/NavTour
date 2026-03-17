using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Annotation : TenantEntity
{
    public Guid StepId { get; set; }
    public AnnotationType Type { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string? Style { get; set; }
    public string? TargetSelector { get; set; }
    public string? ArrowDirection { get; set; }
    public int? BadgeNumber { get; set; }

    public Step Step { get; set; } = null!;
}
