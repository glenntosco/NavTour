using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Annotations;
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

    public PlayerService(NavTourDbContext db, ITenantProvider tenantProvider, IPersonalizationService personalization)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _personalization = personalization;
    }

    public async Task<PlayerManifestResponse?> GetManifestAsync(string slug, IReadOnlyDictionary<string, string?>? queryParams = null)
    {
        // Player queries bypass tenant filter — find demo by slug across all tenants
        var demo = await _db.Demos
            .IgnoreQueryFilters()
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
                s.TriggerType, s.TriggerDurationMs, s.BackdropLevel))
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
                steps[i] = s with { Annotations = resolvedAnnotations };
            }
        }

        return new PlayerManifestResponse(demo.Name, demo.Slug, demo.Settings, frames, steps);
    }

    public async Task<Guid> RecordLeadAsync(string slug, LeadCaptureRequest request, Guid sessionId)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

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
        return lead.Id;
    }
}
