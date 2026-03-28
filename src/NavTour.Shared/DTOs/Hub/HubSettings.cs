namespace NavTour.Shared.DTOs.Hub;

public class HubAppearanceSettings
{
    public string DisplayType { get; set; } = "title";  // title | logo
    public string? Title { get; set; } = "Help Center";
    public string? Subtitle { get; set; }
    public string? LogoUrl { get; set; }
    public string Alignment { get; set; } = "left";     // left | center | right
    public string BackgroundType { get; set; } = "solid"; // solid | gradient | image
    public string BackgroundColor1 { get; set; } = "#4361ee";
    public string? BackgroundColor2 { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public int BackgroundOverlay { get; set; } = 0;
    public string TextColor { get; set; } = "#ffffff";
    public bool ShowCloseButton { get; set; } = true;
    public string ContentTheme { get; set; } = "light";  // light | dark | auto
    public string CardStyle { get; set; } = "grid";       // grid | list
    public bool ShowThumbnails { get; set; } = true;
    public bool ShowDescriptions { get; set; } = true;
    public bool ShowDuration { get; set; } = true;
    public bool ShowStepCount { get; set; } = true;
    public string? FontFamily { get; set; }
    public int BorderRadius { get; set; } = 12;
    public string? AccentColor { get; set; }
    public string FooterMenuLabel { get; set; } = "Resources";
    public List<FooterLink> FooterLinks { get; set; } = [];
    public FooterCta? FooterCta { get; set; }
    public string PoweredBy { get; set; } = "show";  // show | hide | custom
    public string? PoweredByText { get; set; }
}

public class FooterLink
{
    public string Text { get; set; } = "";
    public string Url { get; set; } = "";
}

public class FooterCta
{
    public string Text { get; set; } = "Book a Demo";
    public string Url { get; set; } = "";
    public string Color { get; set; } = "#4361ee";
}

public class HubBehaviorSettings
{
    public string OpenTrigger { get; set; } = "launcher";  // launcher | custom | hash | api
    public string AutoOpen { get; set; } = "off";           // off | firstVisit | always
    public int AutoOpenDelay { get; set; } = 3000;
    public bool RememberState { get; set; } = true;
    public bool SearchEnabled { get; set; } = true;
    public string SearchPlaceholder { get; set; } = "Search demos...";
    public string? KeyboardShortcut { get; set; }
    public string MobileBehavior { get; set; } = "drawer";  // drawer | fullscreen | redirect
    public string NotificationBadge { get; set; } = "off";  // off | count | dot
    public bool NewContentIndicator { get; set; } = true;
    public bool CompletionTracking { get; set; } = true;
}

public class HubInstallSettings
{
    public string DisplayMode { get; set; } = "launcher";    // launcher | customTrigger
    public string LauncherStyle { get; set; } = "icon";      // icon | iconText | text
    public string? LauncherIcon { get; set; }
    public string LauncherText { get; set; } = "Help";
    public string LauncherColor { get; set; } = "#4361ee";
    public string Position { get; set; } = "bottomRight";    // bottomRight | bottomLeft | topRight | topLeft
    public int OffsetX { get; set; } = 20;
    public int OffsetY { get; set; } = 20;
    public int ZIndex { get; set; } = 9999;
    public List<string> HideOnPages { get; set; } = [];
    public List<string> AllowedDomains { get; set; } = [];
}
