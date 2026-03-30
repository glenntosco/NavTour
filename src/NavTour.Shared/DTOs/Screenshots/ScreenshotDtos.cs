using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Screenshots;

public record CreateScreenshotRequest(string Name, string? Description);
public record UpdateScreenshotRequest(string? Name, string? Description, string? Settings);
public record ScreenshotResponse(
    Guid Id, string Name, string Slug, string? Description,
    DemoStatus Status, string? Settings, long ViewCount,
    int SlideCount, DateTime CreatedAt);
public record ScreenshotListItemResponse(
    Guid Id, string Name, string Slug, DemoStatus Status,
    long ViewCount, int SlideCount, string? ThumbnailUrl, DateTime CreatedAt);
public record ScreenshotSlideResponse(
    Guid Id, string? Name, int SequenceOrder, string ImageData,
    string? ThumbnailUrl, string? AnnotationData, string? CropData,
    string? DisplaySettings);
public record UpdateSlideRequest(
    string? Name, string? AnnotationData, string? CropData, string? DisplaySettings);
public record ReorderSlidesRequest(List<Guid> SlideIds);
