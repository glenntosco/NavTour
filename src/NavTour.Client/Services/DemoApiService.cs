using System.Net.Http.Json;
using NavTour.Shared.DTOs.Demos;
using NavTour.Shared.DTOs.Frames;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Personalization;

namespace NavTour.Client.Services;

public class DemoApiService
{
    private readonly HttpClient _http;

    public DemoApiService(HttpClient http)
    {
        _http = http;
    }

    // Demos
    public async Task<List<DemoListItemResponse>> GetDemosAsync()
        => await _http.GetFromJsonAsync<List<DemoListItemResponse>>("api/v1/demos") ?? [];

    public async Task<DemoResponse?> GetDemoAsync(Guid id)
        => await _http.GetFromJsonAsync<DemoResponse>($"api/v1/demos/{id}");

    public async Task<DemoResponse?> CreateDemoAsync(CreateDemoRequest request)
    {
        var response = await _http.PostAsJsonAsync("api/v1/demos", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<DemoResponse>() : null;
    }

    public async Task<bool> UpdateDemoAsync(Guid id, UpdateDemoRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{id}", request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteDemoAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/v1/demos/{id}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> PublishDemoAsync(Guid id)
    {
        var response = await _http.PostAsync($"api/v1/demos/{id}/publish", null);
        return response.IsSuccessStatusCode;
    }

    // Frames
    public async Task<List<FrameResponse>> GetFramesAsync(Guid demoId)
        => await _http.GetFromJsonAsync<List<FrameResponse>>($"api/v1/demos/{demoId}/frames") ?? [];

    public async Task<FrameDetailResponse?> GetFrameDetailAsync(Guid frameId)
        => await _http.GetFromJsonAsync<FrameDetailResponse>($"api/v1/frames/{frameId}");

    public async Task<FrameResponse?> UploadFrameAsync(Guid demoId, Stream fileStream, string fileName)
    {
        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(fileStream), "file", fileName);
        var response = await _http.PostAsync($"api/v1/demos/{demoId}/frames", content);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<FrameResponse>() : null;
    }

    public async Task<bool> PatchFrameContentAsync(Guid frameId, string htmlContent)
    {
        var response = await _http.PatchAsJsonAsync($"api/v1/frames/{frameId}/content",
            new PatchFrameContentRequest(htmlContent, null));
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteFrameAsync(Guid frameId)
    {
        var response = await _http.DeleteAsync($"api/v1/frames/{frameId}");
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> ReorderFramesAsync(Guid demoId, List<Guid> frameIds)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/frames/reorder", new ReorderFramesRequest(frameIds));
        return response.IsSuccessStatusCode;
    }

    // Steps
    public async Task<List<StepResponse>> GetStepsAsync(Guid demoId)
        => await _http.GetFromJsonAsync<List<StepResponse>>($"api/v1/demos/{demoId}/steps") ?? [];

    public async Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/steps", request);
        return response.IsSuccessStatusCode;
    }

    // Annotations
    public async Task<AnnotationResponse?> CreateAnnotationAsync(Guid stepId, CreateAnnotationRequest request)
    {
        var response = await _http.PostAsJsonAsync($"api/v1/steps/{stepId}/annotations", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AnnotationResponse>() : null;
    }

    public async Task<AnnotationResponse?> UpdateAnnotationAsync(Guid stepId, Guid annotationId, CreateAnnotationRequest request)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/steps/{stepId}/annotations/{annotationId}", request);
        return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AnnotationResponse>() : null;
    }

    public async Task<bool> DeleteAnnotationAsync(Guid stepId, Guid annotationId)
    {
        var response = await _http.DeleteAsync($"api/v1/steps/{stepId}/annotations/{annotationId}");
        return response.IsSuccessStatusCode;
    }

    // Personalization Variables
    public async Task<List<VariableDto>> GetVariablesAsync(Guid demoId)
    {
        var response = await _http.GetFromJsonAsync<VariableListResponse>($"api/v1/demos/{demoId}/variables");
        return response?.Variables ?? [];
    }

    public async Task<bool> SaveVariablesAsync(Guid demoId, List<VariableDto> variables)
    {
        var response = await _http.PutAsJsonAsync($"api/v1/demos/{demoId}/variables", new VariableListResponse(variables));
        return response.IsSuccessStatusCode;
    }
}
