using System.Net.Http.Json;
using NavTour.Shared.DTOs.Analytics;

namespace NavTour.Client.Services;

public class AnalyticsApiService
{
    private readonly HttpClient _http;

    public AnalyticsApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<AnalyticsSummaryResponse?> GetSummaryAsync(Guid demoId)
        => await _http.GetFromJsonAsync<AnalyticsSummaryResponse>($"api/v1/demos/{demoId}/analytics");

    public async Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId = null)
    {
        var url = demoId.HasValue ? $"api/v1/analytics/sessions?demoId={demoId}" : "api/v1/analytics/sessions";
        return await _http.GetFromJsonAsync<List<SessionListResponse>>(url) ?? [];
    }
}
