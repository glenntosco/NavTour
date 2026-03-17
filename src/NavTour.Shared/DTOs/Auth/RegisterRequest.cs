namespace NavTour.Shared.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string CompanyName, string FullName);
