using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public interface ILeadService
{
    Task<List<LeadResponse>> GetAllAsync();
    Task<bool> DeleteAsync(Guid id);
}
