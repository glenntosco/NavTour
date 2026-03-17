namespace NavTour.Shared.DTOs.Player;

public record PlayerManifestResponse(string DemoName, string Slug, string? Settings, List<PlayerFrameDto> Frames, List<PlayerStepDto> Steps);
