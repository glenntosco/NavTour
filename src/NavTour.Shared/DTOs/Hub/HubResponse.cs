namespace NavTour.Shared.DTOs.Hub;

public record HubResponse(
    Guid Id, string Name, string? Slug, bool IsPublished,
    HubAppearanceSettings Appearance,
    HubBehaviorSettings Behavior,
    HubInstallSettings Install,
    List<HubCategoryResponse> Categories,
    DateTime CreatedAt);

public record HubCategoryResponse(
    Guid Id, string Name, string? Icon, string? Description,
    int SortOrder, bool IsDefault,
    List<HubItemResponse> Items);

public record HubItemResponse(
    Guid Id, string ItemType, Guid? DemoId,
    string? ExternalUrl, string? TitleOverride,
    string? DescriptionOverride, string? ThumbnailOverride,
    int SortOrder,
    // Resolved from Demo entity when type=demo:
    string? DemoName, string? DemoSlug, long DemoViewCount, int DemoStepCount);

public record CreateHubRequest(string Name);
public record UpdateHubRequest(string? Name, string? Slug, bool? IsPublished,
    HubAppearanceSettings? Appearance, HubBehaviorSettings? Behavior, HubInstallSettings? Install);

public record CreateCategoryRequest(Guid HubId, string Name, string? Icon, string? Description);
public record UpdateCategoryRequest(string? Name, string? Icon, string? Description, int? SortOrder, bool? IsDefault);

public record AddItemRequest(Guid CategoryId, string ItemType, Guid? DemoId, string? ExternalUrl,
    string? TitleOverride, string? DescriptionOverride);
public record UpdateItemRequest(string? TitleOverride, string? DescriptionOverride, string? ThumbnailOverride, int? SortOrder);
