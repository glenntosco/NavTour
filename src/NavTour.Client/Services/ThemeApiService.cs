using System.Net.Http.Json;
using NavTour.Shared.DTOs.Themes;

namespace NavTour.Client.Services;

public class ThemeApiService
{
    private readonly HttpClient _http;
    public ThemeApiService(HttpClient http) => _http = http;

    public async Task<List<ThemeResponse>> GetAllAsync()
        => await _http.GetFromJsonAsync<List<ThemeResponse>>("api/v1/themes") ?? [];

    public async Task<ThemeResponse?> GetByIdAsync(Guid id)
        => await _http.GetFromJsonAsync<ThemeResponse>($"api/v1/themes/{id}");

    public async Task<ThemeResponse?> CreateAsync(CreateThemeRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/themes", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ThemeResponse>() : null;
    }

    public async Task<ThemeResponse?> UpdateAsync(Guid id, UpdateThemeRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/themes/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ThemeResponse>() : null;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/themes/{id}");
        return response.IsSuccessStatusCode;
    }
}
