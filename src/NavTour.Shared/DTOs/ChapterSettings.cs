namespace NavTour.Shared.DTOs;

public class ChapterSettings
{
    public string Layout { get; set; } = "center";        // left | center | right
    public string Theme { get; set; } = "dark";            // dark | light | custom
    public string? CustomOverlayColor { get; set; }        // when theme=custom
    public string? CustomTextColor { get; set; }           // when theme=custom
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public bool ShowLogo { get; set; } = true;

    // Multiple CTA buttons (replaces single CtaText/CtaAction/CtaUrl)
    public List<ChapterButton> Buttons { get; set; } = [new()];

    // Legacy single-button fields (kept for backwards compatibility)
    public string? CtaText { get; set; }
    public string? CtaAction { get; set; }
    public string? CtaUrl { get; set; }
    public string? LogoUrl { get; set; }

    // Background
    public string BackgroundType { get; set; } = "step";   // none | step | custom
    public int? BackgroundStepNumber { get; set; }          // which step to use as background (null = first content step)
    public string? BackgroundUrl { get; set; }              // custom image URL or position hint
    public int BackdropOpacity { get; set; } = 60;          // 0-100, controls both opacity and blur
    public bool ShowBrowserChrome { get; set; } = true;     // macOS-style traffic lights + title bar

    // Closing slide options
    public bool ShowForm { get; set; }                      // show lead capture form

    // Chapter type
    public string ChapterType { get; set; } = "default";   // default | form | embed | password
    public string? EmbedUrl { get; set; }                   // URL for embed type (Calendly, etc.)
    public string? Password { get; set; }                   // Password for password-gated type
}

public class ChapterButton
{
    public string Text { get; set; } = "Get Started";
    public string Color { get; set; } = "#4361ee";
    public string Style { get; set; } = "filled";          // filled | outline | ghost
    public string ActionType { get; set; } = "step";       // step | url
    public int? ActionStepNumber { get; set; }              // which step to navigate to
    public string? ActionUrl { get; set; }                  // URL when actionType=url
    public bool Bold { get; set; }
    public bool Italic { get; set; }
}
