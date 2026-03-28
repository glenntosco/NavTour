namespace NavTour.Shared.DTOs.Themes;

/// <summary>
/// Settings for a theme's cover slide or closing slide.
/// Same fields as ChapterSettings but at the theme level (defaults for new demos).
/// </summary>
public class ThemeSlideSettings
{
    public string Layout { get; set; } = "center";       // left | center | right
    public string Theme { get; set; } = "dark";           // dark | light
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string CtaText { get; set; } = "Get Started";
    public string CtaAction { get; set; } = "next";       // next | url
    public string? CtaUrl { get; set; }
    public bool ShowLogo { get; set; } = true;
    public string BackgroundType { get; set; } = "frame";  // none | frame | custom
    public string? BackgroundUrl { get; set; }
    public int BackdropOpacity { get; set; } = 60;
}
