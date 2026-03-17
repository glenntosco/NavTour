namespace NavTour.Shared.DTOs.Leads;

public record LeadResponse(Guid Id, string Email, string? Name, string? Company, string? CustomData, Guid DemoId, string DemoName, DateTime CapturedAt);
