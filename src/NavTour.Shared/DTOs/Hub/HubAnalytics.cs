namespace NavTour.Shared.DTOs.Hub;

public record HubAnalyticsResponse(
    long HubOpens,
    long UniqueVisitors,
    long DemoStarts,
    long DemoCompletes,
    double BounceRate,
    List<SearchQueryEntry> TopSearches,
    List<CategoryClickEntry> TopCategories,
    List<DemoClickEntry> TopDemos);

public record SearchQueryEntry(string Query, int Count);
public record CategoryClickEntry(string CategoryName, int Count);
public record DemoClickEntry(string DemoName, string? DemoSlug, int Count);
public record HubEventRequest(string EventType, string? EventData, string? VisitorId);
