using System.Net.Http.Json;
using NavTour.Shared.DTOs.Forms;

namespace NavTour.Client.Services;

public class FormApiService
{
    private readonly HttpClient _http;

    public FormApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<FormListItemResponse>> GetFormsAsync()
        => await _http.GetFromJsonAsync<List<FormListItemResponse>>("api/v1/forms") ?? [];

    public async Task<FormResponse?> GetFormAsync(Guid id)
        => await _http.GetFromJsonAsync<FormResponse>($"api/v1/forms/{id}");

    public async Task<FormResponse?> CreateFormAsync(CreateFormRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/forms", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<FormResponse>() : null;
    }

    public async Task<bool> UpdateFormAsync(Guid id, UpdateFormRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/forms/{id}", request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteFormAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/forms/{id}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> AssignFormToDemoAsync(Guid demoId, AssignFormRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/form", request);
        return response.IsSuccessStatusCode;
    }
}
