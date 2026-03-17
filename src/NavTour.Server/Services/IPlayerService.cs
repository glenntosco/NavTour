using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public interface IPlayerService
{
    Task<PlayerManifestResponse?> GetManifestAsync(string slug);
    Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId);
}
