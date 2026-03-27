using Microsoft.AspNetCore.Identity;
using NavTour.Shared.Enums;

namespace NavTour.Server.Infrastructure.Auth;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Viewer;
    public bool IsActive { get; set; } = true;
    public Guid? InvitedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool HasCompletedOnboarding { get; set; }
}
