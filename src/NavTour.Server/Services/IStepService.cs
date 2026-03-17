using NavTour.Shared.DTOs.Steps;

namespace NavTour.Server.Services;

public interface IStepService
{
    Task<List<StepResponse>> GetAllByDemoAsync(Guid demoId);
    Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request);
}
