namespace NavTour.Shared.DTOs.Themes;

public record CreateThemeRequest(
    string Name, string BrandColor, string TextColor,
    string BackgroundColor, string FontFamily, int BorderRadius,
    string ButtonStyle, string ShadowLevel,
    string? LogoUrl = null,
    ThemeSlideSettings? CoverSlide = null,
    ThemeSlideSettings? ClosingSlide = null);
