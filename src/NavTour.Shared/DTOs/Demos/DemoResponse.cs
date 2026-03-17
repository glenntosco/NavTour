using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Demos;

public record DemoResponse(Guid Id, string Name, string Slug, string? Description, DemoStatus Status, string Locale, string? Settings, long ViewCount, DateTime CreatedAt);
