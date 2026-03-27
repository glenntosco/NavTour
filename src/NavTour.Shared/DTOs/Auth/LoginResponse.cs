namespace NavTour.Shared.DTOs.Auth;

public record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, Guid TenantId, bool HasCompletedOnboarding);
