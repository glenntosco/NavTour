namespace NavTour.Shared.DTOs.Leads;

public record LeadCaptureRequest(string Email, string? Name, string? Company, string? CustomData);
