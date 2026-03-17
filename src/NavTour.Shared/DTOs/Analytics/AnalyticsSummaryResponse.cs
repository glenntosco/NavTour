namespace NavTour.Shared.DTOs.Analytics;

public record AnalyticsSummaryResponse(long TotalViews, long Completions, double AvgTimeSeconds, double CompletionRate, List<DailyViewCount> ViewsOverTime, List<StepFunnelEntry> Funnel, List<SourceEntry> TopSources);

public record DailyViewCount(DateTime Date, int Count);

public record StepFunnelEntry(int StepNumber, int ViewCount, int CompletionCount);

public record SourceEntry(string Source, int Count);
