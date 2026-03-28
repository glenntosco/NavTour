namespace NavTour.Shared.DTOs.Showcases;

public record ShowcaseResponse(
    Guid Id, string Name, string Slug, string? Description,
    string Status, string LayoutTheme, bool Autoplay, long ViewCount,
    List<ShowcaseSectionResponse> Sections, DateTime CreatedAt);

public record ShowcaseSectionResponse(
    Guid Id, string Name, int SortOrder,
    List<ShowcaseItemResponse> Items);

public record ShowcaseItemResponse(
    Guid Id, Guid DemoId, int SortOrder, string? TitleOverride,
    string? DemoName, string? DemoSlug, int DemoStepCount, long DemoViewCount);

public record CreateShowcaseRequest(string? Name);
public record UpdateShowcaseRequest(string? Name, string? Description, string? Status, string? LayoutTheme, bool? Autoplay);
public record CreateSectionRequest(Guid ShowcaseId, string Name);
public record UpdateSectionRequest(string? Name, int? SortOrder);
public record AddShowcaseItemRequest(Guid SectionId, Guid DemoId, string? TitleOverride);
public record UpdateShowcaseItemRequest(string? TitleOverride, int? SortOrder);
