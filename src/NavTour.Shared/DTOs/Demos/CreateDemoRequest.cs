namespace NavTour.Shared.DTOs.Demos;

public record CreateDemoRequest(string Name, string? Description, string Locale = "en");
