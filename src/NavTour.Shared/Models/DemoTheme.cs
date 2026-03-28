namespace NavTour.Shared.Models;

public class DemoTheme : TenantEntity
{
    // ── Tooltip/Annotation Styling ──
    public string Name { get; set; } = "Default";
    public string BrandColor { get; set; } = "#4361ee";
    public string TextColor { get; set; } = "#ffffff";
    public string BackgroundColor { get; set; } = "#1a1a2e";
    public string FontFamily { get; set; } = "Segoe UI";
    public int BorderRadius { get; set; } = 8;
    public string ButtonStyle { get; set; } = "filled"; // filled, outline, ghost
    public string ShadowLevel { get; set; } = "medium"; // none, light, medium, heavy

    // ── Branding ──
    public string? LogoUrl { get; set; }  // base64 data URL or external URL

    // ── Cover Slide (first frame) Settings — JSON ──
    public string? CoverSlideSettings { get; set; }

    // ── Closing Slide (last frame) Settings — JSON ──
    public string? ClosingSlideSettings { get; set; }
}
