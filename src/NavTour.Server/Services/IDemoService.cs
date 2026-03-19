using NavTour.Shared.DTOs.Demos;

namespace NavTour.Server.Services;

public interface IDemoService
{
    Task<List<DemoListItemResponse>> GetAllAsync();
    Task<DemoResponse?> GetByIdAsync(Guid id);
    Task<DemoResponse> CreateAsync(CreateDemoRequest request, Guid userId);
    Task<DemoResponse?> UpdateAsync(Guid id, UpdateDemoRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> PublishAsync(Guid id);
    Task<bool> UnpublishAsync(Guid id);
}
