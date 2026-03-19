using NavTour.Shared.DTOs.Frames;

namespace NavTour.Server.Services;

public interface IFrameService
{
    Task<List<FrameResponse>> GetAllByDemoAsync(Guid demoId);
    Task<FrameDetailResponse?> GetByIdAsync(Guid id);
    Task<FrameResponse> UploadAsync(Guid demoId, IFormFile file);
    Task<bool> DeleteAsync(Guid id);
    Task<FrameDetailResponse?> UpdateAsync(Guid id, string htmlContent, string? cssContent);
    Task<bool> RenameAsync(Guid id, string name);
    Task<bool> ReorderAsync(Guid demoId, ReorderFramesRequest request);
}
