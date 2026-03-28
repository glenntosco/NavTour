namespace NavTour.Shared.DTOs;

public class ChapterSettings
{
    public string Layout { get; set; } = "center";
    public string Theme { get; set; } = "dark";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string CtaText { get; set; } = "Get Started";
    public string CtaAction { get; set; } = "next";
    public string? CtaUrl { get; set; }
    public bool ShowLogo { get; set; } = true;
    public string? LogoUrl { get; set; }
    public string BackgroundType { get; set; } = "frame";
    public string? BackgroundUrl { get; set; }
    public int BackdropOpacity { get; set; } = 60;
    public bool ShowForm { get; set; }  // Show lead capture form on closing slide
}
