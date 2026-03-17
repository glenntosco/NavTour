using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Personalization;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public interface IPersonalizationService
{
    Task<List<VariableDto>> GetVariablesAsync(Guid demoId);
    Task SaveVariablesAsync(Guid demoId, List<VariableDto> variables);
    string ResolveVariables(string content, Dictionary<string, string> defaults, IReadOnlyDictionary<string, string?>? overrides);
    HashSet<string> ExtractTokens(string content);
}

public partial class PersonalizationService : IPersonalizationService
{
    private readonly NavTourDbContext _db;

    public PersonalizationService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<VariableDto>> GetVariablesAsync(Guid demoId)
    {
        return await _db.PersonalizationVariables
            .Where(v => v.DemoId == demoId)
            .OrderBy(v => v.Key)
            .Select(v => new VariableDto(v.Id, v.Key, v.DefaultValue, v.Description))
            .ToListAsync();
    }

    public async Task SaveVariablesAsync(Guid demoId, List<VariableDto> variables)
    {
        var existing = await _db.PersonalizationVariables
            .Where(v => v.DemoId == demoId)
            .ToListAsync();

        _db.PersonalizationVariables.RemoveRange(existing);

        foreach (var dto in variables)
        {
            _db.PersonalizationVariables.Add(new PersonalizationVariable
            {
                DemoId = demoId,
                Key = dto.Key.Trim(),
                DefaultValue = dto.DefaultValue,
                Description = dto.Description,
            });
        }

        await _db.SaveChangesAsync();
    }

    public string ResolveVariables(string content, Dictionary<string, string> defaults, IReadOnlyDictionary<string, string?>? overrides)
    {
        return VariablePattern().Replace(content, match =>
        {
            var key = match.Groups[1].Value;
            // Override from URL params takes precedence
            if (overrides != null && overrides.TryGetValue(key, out var overrideVal) && overrideVal != null)
                return overrideVal;
            // Fall back to default
            if (defaults.TryGetValue(key, out var defaultVal))
                return defaultVal;
            // Leave unresolved token as-is
            return match.Value;
        });
    }

    public HashSet<string> ExtractTokens(string content)
    {
        var tokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match match in VariablePattern().Matches(content))
        {
            tokens.Add(match.Groups[1].Value);
        }
        return tokens;
    }

    [GeneratedRegex(@"\{\{(\w+)\}\}")]
    private static partial Regex VariablePattern();
}
