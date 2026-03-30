using System.Net.Http.Json;
using NavTour.Shared.DTOs.Screenshots;

namespace NavTour.Client.Services;

public class ScreenshotApiService(HttpClient http)
{
    public async Task<List<ScreenshotListItemResponse>> GetAllAsync() =>
        await http.GetFromJsonAsync<List<ScreenshotListItemResponse>>("api/v1/screenshots") ?? [];

    public async Task<ScreenshotResponse?> GetByIdAsync(Guid id) =>
        await http.GetFromJsonAsync<ScreenshotResponse>($"api/v1/screenshots/{id}");

    public async Task<ScreenshotResponse?> CreateAsync(CreateScreenshotRequest request)
    {
        var response = await http.PostAsJsonAsync("api/v1/screenshots", request);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<ScreenshotResponse>()
            : null;
    }

    public async Task<ScreenshotResponse?> UpdateAsync(Guid id, UpdateScreenshotRequest request)
    {
        var response = await http.PutAsJsonAsync($"api/v1/screenshots/{id}", request);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<ScreenshotResponse>()
            : null;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var response = await http.DeleteAsync($"api/v1/screenshots/{id}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var response = await http.PostAsync($"api/v1/screenshots/{id}/publish", null);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> UnpublishAsync(Guid id)
    {
        var response = await http.PostAsync($"api/v1/screenshots/{id}/unpublish", null);
        return response.IsSuccessStatusCode;
    }

    public async Task<List<ScreenshotSlideResponse>> GetSlidesAsync(Guid screenshotId) =>
        await http.GetFromJsonAsync<List<ScreenshotSlideResponse>>($"api/v1/screenshots/{screenshotId}/slides") ?? [];

    public async Task<ScreenshotSlideResponse?> UploadSlideAsync(Guid screenshotId, Stream imageStream, string fileName, string contentType, string? name = null)
    {
        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(imageStream), "image", fileName);
        if (name != null) content.Add(new StringContent(name), "name");
        var response = await http.PostAsync($"api/v1/screenshots/{screenshotId}/slides", content);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<ScreenshotSlideResponse>()
            : null;
    }

    public async Task<ScreenshotSlideResponse?> UpdateSlideAsync(Guid slideId, UpdateSlideRequest request)
    {
        var response = await http.PutAsJsonAsync($"api/v1/screenshots/slides/{slideId}", request);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<ScreenshotSlideResponse>()
            : null;
    }

    public async Task<bool> DeleteSlideAsync(Guid slideId)
    {
        var response = await http.DeleteAsync($"api/v1/screenshots/slides/{slideId}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> ReorderSlidesAsync(Guid screenshotId, List<Guid> slideIds)
    {
        var response = await http.PutAsJsonAsync($"api/v1/screenshots/{screenshotId}/slides/reorder",
            new ReorderSlidesRequest(slideIds));
        return response.IsSuccessStatusCode;
    }

    public async Task<ScreenshotResponse?> GetPublicBySlugAsync(string slug) =>
        await http.GetFromJsonAsync<ScreenshotResponse>($"api/v1/screenshots/view/{slug}");

    public async Task<List<ScreenshotSlideResponse>> GetPublicSlidesAsync(string slug) =>
        await http.GetFromJsonAsync<List<ScreenshotSlideResponse>>($"api/v1/screenshots/view/{slug}/slides") ?? [];
}
