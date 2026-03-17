namespace NavTour.Shared.DTOs.Personalization;

public record VariableDto(Guid? Id, string Key, string DefaultValue, string? Description);

public record VariableListResponse(List<VariableDto> Variables);
