using System.Net.Http.Json;
using NavTour.Shared.DTOs.Hub;

namespace NavTour.Client.Services;

public class HubApiService
{
    private readonly HttpClient _http;

    public HubApiService(HttpClient http) => _http = http;

    // Hub CRUD
    public async Task<List<HubResponse>> GetAllAsync()
        => await _http.GetFromJsonAsync<List<HubResponse>>("api/v1/hubs") ?? [];

    public async Task<HubResponse?> GetByIdAsync(Guid id)
        => await _http.GetFromJsonAsync<HubResponse>($"api/v1/hubs/{id}");

    public async Task<HubResponse?> CreateAsync(CreateHubRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/hubs", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubResponse>() : null;
    }

    public async Task<HubResponse?> UpdateAsync(Guid id, UpdateHubRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/hubs/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubResponse>() : null;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/hubs/{id}");
        return response.IsSuccessStatusCode;
    }

    // Categories
    public async Task<HubCategoryResponse?> AddCategoryAsync(CreateCategoryRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/hubs/categories", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubCategoryResponse>() : null;
    }

    public async Task<HubCategoryResponse?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/hubs/categories/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubCategoryResponse>() : null;
    }

    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/hubs/categories/{id}");
        return response.IsSuccessStatusCode;
    }

    // Items
    public async Task<HubItemResponse?> AddItemAsync(AddItemRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/hubs/items", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubItemResponse>() : null;
    }

    public async Task<HubItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/hubs/items/{id}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<HubItemResponse>() : null;
    }

    public async Task<bool> DeleteItemAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/hubs/items/{id}");
        return response.IsSuccessStatusCode;
    }
}
