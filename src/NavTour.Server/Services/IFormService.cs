using NavTour.Shared.DTOs.Forms;

namespace NavTour.Server.Services;

public interface IFormService
{
    Task<List<FormListItemResponse>> GetAllAsync();
    Task<FormResponse?> GetByIdAsync(Guid id);
    Task<FormResponse> CreateAsync(CreateFormRequest request);
    Task<FormResponse?> UpdateAsync(Guid id, UpdateFormRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<FormResponse?> GetBySlugPublicAsync(string slug);
    Task IncrementViewCountAsync(Guid id);
    Task IncrementSubmissionCountAsync(Guid id);
    Task<Guid?> SubmitStandaloneFormAsync(string slug, FormSubmissionRequest request);
}
