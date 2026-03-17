using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Step : TenantEntity
{
    public Guid DemoId { get; set; }
    public Guid FrameId { get; set; }
    public int StepNumber { get; set; }
    public string? ClickTargetSelector { get; set; }
    public NavigationAction NavigationAction { get; set; } = NavigationAction.NextStep;
    public string? NavigationTarget { get; set; }

    public Demo Demo { get; set; } = null!;
    public Frame Frame { get; set; } = null!;
    public List<Annotation> Annotations { get; set; } = [];
}
