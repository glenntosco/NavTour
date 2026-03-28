using System.Net.Http.Json;
using NavTour.Shared.DTOs.Ai;

namespace NavTour.Client.Services;

public class AiApiService
{
    private readonly HttpClient _http;
    public AiApiService(HttpClient http) => _http = http;

    public async Task<StepContent?> WriteContentAsync(string title, string context, string tone = "professional")
    {
        var response = await _http.PostAsJsonAsync("api/v1/ai/write-content", new { title, context, tone });
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<StepContent>() : null;
    }

    public async Task<List<TranslatedStep>?> TranslateAsync(List<TranslatableStep> steps, string targetLanguage)
    {
        var response = await _http.PostAsJsonAsync("api/v1/ai/translate", new { steps, targetLanguage });
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<List<TranslatedStep>>() : null;
    }

    public async Task<DemoQualityScore?> ScoreAsync(List<StepSummary> steps, int frameCount)
    {
        var response = await _http.PostAsJsonAsync("api/v1/ai/score", new { steps, frameCount });
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<DemoQualityScore>() : null;
    }
}
