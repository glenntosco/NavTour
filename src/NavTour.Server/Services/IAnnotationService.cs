using NavTour.Shared.DTOs.Annotations;

namespace NavTour.Server.Services;

public interface IAnnotationService
{
    Task<List<AnnotationResponse>> GetByStepAsync(Guid stepId);
    Task<AnnotationResponse> CreateAsync(Guid stepId, CreateAnnotationRequest request);
    Task<AnnotationResponse?> UpdateAsync(Guid id, CreateAnnotationRequest request);
    Task<bool> DeleteAsync(Guid id);
}
