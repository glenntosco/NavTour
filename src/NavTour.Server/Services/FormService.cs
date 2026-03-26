using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Forms;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class FormService : IFormService
{
    private readonly NavTourDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public FormService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<FormListItemResponse>> GetAllAsync()
    {
        return await _db.Forms
            .Select(f => new FormListItemResponse(
                f.Id,
                f.Name,
                f.Slug,
                DeserializeFields(f.FieldsJson).Count,
                f.SubmissionCount,
                f.ViewCount,
                f.ViewCount > 0 ? Math.Round((decimal)f.SubmissionCount / f.ViewCount * 100, 1) : 0,
                _db.Demos.Count(d => d.FormId == f.Id && !d.IsDeleted),
                f.CreatedAt))
            .ToListAsync();
    }

    public async Task<FormResponse?> GetByIdAsync(Guid id)
    {
        return await _db.Forms
            .Where(f => f.Id == id)
            .Select(f => new FormResponse(
                f.Id,
                f.Name,
                f.Slug,
                f.Description,
                DeserializeFields(f.FieldsJson),
                DeserializeSettings(f.SettingsJson),
                f.IsStandalone,
                f.SubmissionCount,
                f.ViewCount,
                _db.Demos.Count(d => d.FormId == f.Id && !d.IsDeleted),
                f.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<FormResponse> CreateAsync(CreateFormRequest request)
    {
        // If name is empty or "Untitled Form", assign a unique Aztec-inspired name
        var name = request.Name;
        if (string.IsNullOrWhiteSpace(name) || name.Equals("Untitled Form", StringComparison.OrdinalIgnoreCase))
        {
            name = GenerateAztecName();
        }

        var slug = GenerateSlug(name);

        // Ensure unique slug within tenant
        var baseSlug = slug;
        var counter = 1;
        while (await _db.Forms.AnyAsync(f => f.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var form = new Form
        {
            Name = name,
            Slug = slug,
            Description = request.Description,
            FieldsJson = JsonSerializer.Serialize(request.Fields, JsonOptions),
            SettingsJson = request.Settings != null
                ? JsonSerializer.Serialize(request.Settings, JsonOptions)
                : null,
            IsStandalone = request.IsStandalone
        };

        _db.Forms.Add(form);
        await _db.SaveChangesAsync();

        return new FormResponse(form.Id, form.Name, form.Slug, form.Description,
            request.Fields, request.Settings, form.IsStandalone,
            form.SubmissionCount, form.ViewCount, 0, form.CreatedAt);
    }

    public async Task<FormResponse?> UpdateAsync(Guid id, UpdateFormRequest request)
    {
        var form = await _db.Forms.FindAsync(id);
        if (form == null) return null;

        if (request.Name != null) form.Name = request.Name;
        if (request.Description != null) form.Description = request.Description;
        if (request.Fields != null) form.FieldsJson = JsonSerializer.Serialize(request.Fields, JsonOptions);
        if (request.Settings != null) form.SettingsJson = JsonSerializer.Serialize(request.Settings, JsonOptions);
        if (request.IsStandalone.HasValue) form.IsStandalone = request.IsStandalone.Value;

        await _db.SaveChangesAsync();

        var assignedDemoCount = await _db.Demos.CountAsync(d => d.FormId == form.Id && !d.IsDeleted);

        return new FormResponse(form.Id, form.Name, form.Slug, form.Description,
            DeserializeFields(form.FieldsJson),
            DeserializeSettings(form.SettingsJson),
            form.IsStandalone, form.SubmissionCount, form.ViewCount,
            assignedDemoCount, form.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var form = await _db.Forms.FindAsync(id);
        if (form == null) return false;

        // Unlink demos that reference this form
        var linkedDemos = await _db.Demos.Where(d => d.FormId == id).ToListAsync();
        foreach (var demo in linkedDemos)
        {
            demo.FormId = null;
        }

        form.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<FormResponse?> GetBySlugPublicAsync(string slug)
    {
        return await _db.Forms
            .IgnoreQueryFilters()
            .Where(f => f.Slug == slug && !f.IsDeleted && f.IsStandalone)
            .Select(f => new FormResponse(
                f.Id,
                f.Name,
                f.Slug,
                f.Description,
                DeserializeFields(f.FieldsJson),
                DeserializeSettings(f.SettingsJson),
                f.IsStandalone,
                f.SubmissionCount,
                f.ViewCount,
                0,
                f.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task IncrementViewCountAsync(Guid id)
    {
        await _db.Forms
            .Where(f => f.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(f => f.ViewCount, f => f.ViewCount + 1));
    }

    public async Task IncrementSubmissionCountAsync(Guid id)
    {
        await _db.Forms
            .Where(f => f.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(f => f.SubmissionCount, f => f.SubmissionCount + 1));
    }

    public async Task<Guid?> SubmitStandaloneFormAsync(string slug, FormSubmissionRequest request)
    {
        var form = await _db.Forms
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(f => f.Slug == slug && !f.IsDeleted && f.IsStandalone);

        if (form == null) return null;

        // Extract standard fields from submission
        var values = request.FieldValues;
        var email = values.GetValueOrDefault("email") ?? values.GetValueOrDefault("Email") ?? "";
        var name2 = values.GetValueOrDefault("name") ?? values.GetValueOrDefault("full_name")
            ?? values.GetValueOrDefault("first_name") ?? values.GetValueOrDefault("Full Name")
            ?? values.GetValueOrDefault("First Name");
        var company = values.GetValueOrDefault("company") ?? values.GetValueOrDefault("company_name")
            ?? values.GetValueOrDefault("Company Name");

        var lead = new Lead
        {
            TenantId = form.TenantId,
            SessionId = null,
            FormId = form.Id,
            Email = email,
            Name = name2,
            Company = company,
            CustomData = JsonSerializer.Serialize(values, JsonOptions)
        };

        _db.Leads.Add(lead);
        form.SubmissionCount++;
        await _db.SaveChangesAsync();

        return lead.Id;
    }

    private static string GenerateAztecName()
    {
        var prefixes = new[] {
            "Quetzal", "Tlaloc", "Tonali", "Xochitl", "Itzel",
            "Citlali", "Nahui", "Coatl", "Tezca", "Mictlan",
            "Chimalli", "Atl", "Centeotl", "Ehecatl", "Ixchel",
            "Kukulkan", "Ocelotl", "Tepetl", "Xiuhtl", "Yolotl"
        };
        var suffixes = new[] {
            "Form", "Codex", "Glyph", "Stone", "Jade",
            "Obsidian", "Cacao", "Maize", "Eagle", "Jaguar",
            "Serpent", "Temple", "Sun", "Moon", "Star"
        };
        var rng = Random.Shared;
        return $"{prefixes[rng.Next(prefixes.Length)]}-{suffixes[rng.Next(suffixes.Length)]}-{rng.Next(100, 999)}";
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant()
            .Replace(" ", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = Regex.Replace(slug, @"-{2,}", "-");
        return slug.Trim('-');
    }

    private static List<FormFieldDefinition> DeserializeFields(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<FormFieldDefinition>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static FormSettingsDto? DeserializeSettings(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<FormSettingsDto>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
