using System.Net.Http.Json;
using NavTour.Shared.DTOs.Showcases;

namespace NavTour.Client.Services;

public class ShowcaseApiService
{
    private readonly HttpClient _http;

    public ShowcaseApiService(HttpClient http) => _http = http;

    // Showcase CRUD
    public async Task<List<ShowcaseResponse>> GetAllAsync()
        => await _http.GetFromJsonAsync<List<ShowcaseResponse>>("api/v1/showcases") ?? [];

    public async Task<ShowcaseResponse?> GetByIdAsync(Guid id)
        => await _http.GetFromJsonAsync<ShowcaseResponse>($"api/v1/showcases/{id}");

    public async Task<ShowcaseResponse?> CreateAsync(CreateShowcaseRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/showcases", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseResponse>() : null;
    }

    public async Task<ShowcaseResponse?> UpdateAsync(Guid id, UpdateShowcaseRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/showcases/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseResponse>() : null;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/showcases/{id}");
        return response.IsSuccessStatusCode;
    }

    // Sections
    public async Task<ShowcaseSectionResponse?> AddSectionAsync(CreateSectionRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/showcases/sections", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseSectionResponse>() : null;
    }

    public async Task<ShowcaseSectionResponse?> UpdateSectionAsync(Guid id, UpdateSectionRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/showcases/sections/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseSectionResponse>() : null;
    }

    public async Task<bool> DeleteSectionAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/showcases/sections/{id}");
        return response.IsSuccessStatusCode;
    }

    // Items
    public async Task<ShowcaseItemResponse?> AddItemAsync(AddShowcaseItemRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/showcases/items", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseItemResponse>() : null;
    }

    public async Task<ShowcaseItemResponse?> UpdateItemAsync(Guid id, UpdateShowcaseItemRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/showcases/items/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<ShowcaseItemResponse>() : null;
    }

    public async Task<bool> DeleteItemAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/showcases/items/{id}");
        return response.IsSuccessStatusCode;
    }

    // Public
    public async Task<ShowcaseResponse?> GetBySlugAsync(string slug)
        => await _http.GetFromJsonAsync<ShowcaseResponse>($"api/v1/showcases/public/{slug}");
}
