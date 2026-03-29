using NavTour.Shared.Enums;

namespace NavTour.Shared.Models;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "Starter";
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string? StripePriceId { get; set; }
    public DateTime? SubscriptionEndsAt { get; set; }
    public int SeatCount { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
