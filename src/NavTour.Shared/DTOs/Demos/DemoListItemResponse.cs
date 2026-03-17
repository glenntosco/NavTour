using NavTour.Shared.Enums;

namespace NavTour.Shared.DTOs.Demos;

public record DemoListItemResponse(Guid Id, string Name, string Slug, DemoStatus Status, long ViewCount, int FrameCount, int StepCount, DateTime CreatedAt);
