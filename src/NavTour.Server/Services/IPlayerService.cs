using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public interface IPlayerService
{
    Task<PlayerManifestResponse?> GetManifestAsync(string slug, IReadOnlyDictionary<string, string?>? queryParams = null);
    Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId);
}
