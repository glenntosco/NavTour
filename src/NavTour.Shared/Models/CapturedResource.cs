namespace NavTour.Shared.Models;

/// <summary>
/// Content-addressed resource store (CSS, fonts, images) captured by the extension.
/// NOT a TenantEntity — resources are shared/deduped across tenants by SHA-256 hash.
/// </summary>
public class CapturedResource
{
    public string Hash { get; set; } = ""; // SHA-256 hex, also the PK
    public string ContentType { get; set; } = "";
    public byte[] Data { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
