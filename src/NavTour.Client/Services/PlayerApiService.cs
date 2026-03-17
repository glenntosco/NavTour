using System.Net.Http.Json;
using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Client.Services;

public class PlayerApiService
{
    private readonly HttpClient _http;

    public PlayerApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<PlayerManifestResponse?> GetManifestAsync(string slug)
        => await _http.GetFromJsonAsync<PlayerManifestResponse>($"api/v1/player/{slug}/manifest");

    public async Task<Guid?> SendEventsAsync(string slug, EventBatchRequest batch)
    {
        var response = await _http.PostAsJsonAsync($"api/v1/player/{slug}/events", batch);
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<EventBatchResponse>();
            return result?.SessionId;
        }
        return null;
    }

    public async Task CaptureLead(string slug, LeadCaptureRequest request, Guid? sessionId)
    {
        await _http.PostAsJsonAsync($"api/v1/player/{slug}/leads?sessionId={sessionId}", request);
    }
}
