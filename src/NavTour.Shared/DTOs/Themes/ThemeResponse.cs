namespace NavTour.Shared.DTOs.Themes;

public record ThemeResponse(
    Guid Id, string Name, string BrandColor, string TextColor,
    string BackgroundColor, string FontFamily, int BorderRadius,
    string ButtonStyle, string ShadowLevel, DateTime CreatedAt);
