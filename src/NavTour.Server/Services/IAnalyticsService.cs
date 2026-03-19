using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Server.Services;

public interface IAnalyticsService
{
    Task<EventBatchResponse> IngestEventsAsync(string slug, EventBatchRequest request, string? ipAddress, string? userAgent);
    Task<AnalyticsSummaryResponse> GetSummaryAsync(Guid demoId);
    Task<AnalyticsSummaryResponse> GetGlobalSummaryAsync();
    Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId);
}
