using NavTour.Shared.Models;

namespace NavTour.Shared.Models;

public class DemoTheme : TenantEntity
{
    public string Name { get; set; } = "Default";
    public string BrandColor { get; set; } = "#4361ee";
    public string TextColor { get; set; } = "#ffffff";
    public string BackgroundColor { get; set; } = "#1a1a2e";
    public string FontFamily { get; set; } = "Segoe UI";
    public int BorderRadius { get; set; } = 8;
    public string ButtonStyle { get; set; } = "filled"; // filled, outline, ghost
    public string ShadowLevel { get; set; } = "medium"; // none, light, medium, heavy
}
