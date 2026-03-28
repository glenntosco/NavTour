using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Forms;
using NavTour.Shared.DTOs.Player;
using NavTour.Shared.DTOs.Leads;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class PlayerService : IPlayerService
{
    private readonly NavTourDbContext _db;
    private readonly ITenantProvider _tenantProvider;
    private readonly IPersonalizationService _personalization;
    private readonly IEmailService _emailService;
    private readonly ILogger<PlayerService> _logger;

    public PlayerService(NavTourDbContext db, ITenantProvider tenantProvider, IPersonalizationService personalization, IEmailService emailService, ILogger<PlayerService> logger)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _personalization = personalization;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<PlayerManifestResponse?> GetManifestAsync(string slug, IReadOnlyDictionary<string, string?>? queryParams = null)
    {
        // Player queries bypass tenant filter — find demo by slug across all tenants
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .Include(d => d.Form)
            .Where(d => d.Slug == slug && d.Status == DemoStatus.Published && !d.IsDeleted)
            .FirstOrDefaultAsync();

        if (demo == null) return null;

        // Increment view count
        demo.ViewCount++;
        await _db.SaveChangesAsync();

        // Set tenant context for subsequent queries
        _tenantProvider.SetTenantId(demo.TenantId);

        var frames = await _db.Frames
            .Where(f => f.DemoId == demo.Id)
            .OrderBy(f => f.SequenceOrder)
            .Select(f => new PlayerFrameDto(f.Id, f.SequenceOrder, f.HtmlContent, f.CssContent))
            .ToListAsync();

        var steps = await _db.Steps
            .Where(s => s.DemoId == demo.Id)
            .Include(s => s.Annotations)
            .OrderBy(s => s.StepNumber)
            .Select(s => new PlayerStepDto(
                s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
                s.NavigationAction, s.NavigationTarget,
                s.Annotations.Where(a => !a.IsDeleted).Select(a => new PlayerAnnotationDto(
                    a.Type, a.Title, a.Content,
                    a.PositionX, a.PositionY, a.Width, a.Height, a.Style,
                    a.TargetSelector, a.ArrowDirection, a.BadgeNumber
                )).ToList(),
                s.TriggerType, s.TriggerDurationMs, s.BackdropLevel, s.VoiceoverText,
                s.VoiceoverAudio != null ? $"/api/v1/steps/{s.Id}/audio" : null,
                s.Type, s.ChapterSettings))
            .ToListAsync();

        // Resolve personalization variables
        var variables = await _db.PersonalizationVariables
            .IgnoreQueryFilters()
            .Where(v => v.DemoId == demo.Id && !v.IsDeleted)
            .ToDictionaryAsync(v => v.Key, v => v.DefaultValue);

        if (variables.Count > 0 || queryParams?.Count > 0)
        {
            // Resolve in frame HTML
            for (var i = 0; i < frames.Count; i++)
            {
                var f = frames[i];
                var resolvedHtml = _personalization.ResolveVariables(f.HtmlContent, variables, queryParams);
                var resolvedCss = f.CssContent != null
                    ? _personalization.ResolveVariables(f.CssContent, variables, queryParams)
                    : null;
                frames[i] = f with { HtmlContent = resolvedHtml, CssContent = resolvedCss };
            }

            // Resolve in annotation titles and content
            for (var i = 0; i < steps.Count; i++)
            {
                var s = steps[i];
                var resolvedAnnotations = s.Annotations.Select(a =>
                {
                    var title = a.Title != null ? _personalization.ResolveVariables(a.Title, variables, queryParams) : null;
                    var content = a.Content != null ? _personalization.ResolveVariables(a.Content, variables, queryParams) : null;
                    return a with { Title = title, Content = content };
                }).ToList();
                var voiceoverText = s.VoiceoverText != null ? _personalization.ResolveVariables(s.VoiceoverText, variables, queryParams) : null;
                steps[i] = s with { Annotations = resolvedAnnotations, VoiceoverText = voiceoverText };
            }
        }

        // Deserialize form fields and settings if a custom form is assigned
        List<FormFieldDefinition>? formFields = null;
        FormSettingsDto? formSettings = null;
        if (demo.Form != null)
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            try { formFields = JsonSerializer.Deserialize<List<FormFieldDefinition>>(demo.Form.FieldsJson, jsonOptions); } catch { }
            if (!string.IsNullOrEmpty(demo.Form.SettingsJson))
            {
                try { formSettings = JsonSerializer.Deserialize<FormSettingsDto>(demo.Form.SettingsJson, jsonOptions); } catch { }
            }
        }

        return new PlayerManifestResponse(demo.Name, demo.Slug, demo.Settings, frames, steps, formFields, formSettings);
    }

    public async Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

        // Ensure session exists (may not if events failed to flush before lead capture)
        var sessionExists = await _db.DemoSessions
            .IgnoreQueryFilters()
            .AnyAsync(s => s.Id == sessionId);

        if (!sessionExists)
        {
            _db.DemoSessions.Add(new DemoSession
            {
                Id = sessionId,
                TenantId = demo.TenantId,
                DemoId = demo.Id,
                StartedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        var lead = new Lead
        {
            TenantId = demo.TenantId,
            SessionId = sessionId,
            Email = request.Email,
            Name = request.Name,
            Company = request.Company,
            CustomData = request.CustomData
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        // Fire-and-forget lead notification email
        _ = Task.Run(async () =>
        {
            try
            {
                var template = await _db.LeadEmailTemplates
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.TenantId == demo.TenantId && !t.IsDeleted);

                if (template is { IsEnabled: true })
                {
                    await _emailService.SendLeadEmailAsync(
                        request.Email,
                        request.Name,
                        demo.Name,
                        template);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send lead notification email for demo {Slug}", slug);
            }
        });

        return lead.Id;
    }

    public async Task<Guid> RecordFormSubmissionAsync(string slug, FormSubmissionRequest request, Guid sessionId)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .Include(d => d.Form)
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

        // Ensure session exists
        var sessionExists = await _db.DemoSessions
            .IgnoreQueryFilters()
            .AnyAsync(s => s.Id == sessionId);

        if (!sessionExists)
        {
            _db.DemoSessions.Add(new DemoSession
            {
                Id = sessionId,
                TenantId = demo.TenantId,
                DemoId = demo.Id,
                StartedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        // Extract denormalized fields from FieldValues
        var fv = request.FieldValues;
        var email = fv.TryGetValue("email", out var e) ? e : "";
        var name = fv.TryGetValue("name", out var n) ? n
            : fv.TryGetValue("first_name", out var fn) ? fn
            : fv.TryGetValue("full_name", out var fuln) ? fuln : null;
        var company = fv.TryGetValue("company", out var c) ? c
            : fv.TryGetValue("company_name", out var cn) ? cn : null;

        var lead = new Lead
        {
            TenantId = demo.TenantId,
            SessionId = sessionId,
            FormId = demo.FormId,
            Email = email,
            Name = name,
            Company = company,
            CustomData = JsonSerializer.Serialize(fv)
        };

        _db.Leads.Add(lead);

        // Increment form submission count
        if (demo.Form != null)
        {
            demo.Form.SubmissionCount++;
        }

        await _db.SaveChangesAsync();

        // Fire-and-forget lead notification email
        _ = Task.Run(async () =>
        {
            try
            {
                var template = await _db.LeadEmailTemplates
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.TenantId == demo.TenantId && !t.IsDeleted);

                if (template is { IsEnabled: true })
                {
                    await _emailService.SendLeadEmailAsync(
                        email,
                        name,
                        demo.Name,
                        template);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send lead notification email for demo {Slug}", slug);
            }
        });

        return lead.Id;
    }
}
