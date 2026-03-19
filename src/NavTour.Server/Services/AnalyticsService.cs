using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Analytics;
using NavTour.Shared.Enums;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly NavTourDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public AnalyticsService(NavTourDbContext db, ITenantProvider tenantProvider)
    {
        _db = db;
        _tenantProvider = tenantProvider;
    }

    public async Task<EventBatchResponse> IngestEventsAsync(string slug, EventBatchRequest request, string? ipAddress, string? userAgent)
    {
        var demo = await _db.Demos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Slug == slug && !d.IsDeleted);

        if (demo == null) throw new InvalidOperationException("Demo not found");

        _tenantProvider.SetTenantId(demo.TenantId);

        // Find or create session
        DemoSession? session = null;
        if (request.SessionId.HasValue && request.SessionId != Guid.Empty)
        {
            session = await _db.DemoSessions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value);
        }

        if (session == null)
        {
            var fingerprint = request.ViewerFingerprint ?? GenerateFingerprint(ipAddress, userAgent, demo.Id);

            // Check for existing session within 30 min window
            var cutoff = DateTime.UtcNow.AddMinutes(-30);
            session = await _db.DemoSessions
                .IgnoreQueryFilters()
                .Where(s => s.DemoId == demo.Id && s.ViewerFingerprint == fingerprint && s.StartedAt > cutoff)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                session = new DemoSession
                {
                    TenantId = demo.TenantId,
                    DemoId = demo.Id,
                    ViewerFingerprint = fingerprint,
                    Source = request.Events.FirstOrDefault()?.EventData
                };
                _db.DemoSessions.Add(session);
            }
        }

        // Add events
        foreach (var evt in request.Events)
        {
            _db.SessionEvents.Add(new SessionEvent
            {
                TenantId = demo.TenantId,
                SessionId = session.Id,
                EventType = evt.EventType,
                StepNumber = evt.StepNumber,
                EventData = evt.EventData,
                OccurredAt = evt.OccurredAt
            });

            if (evt.EventType == EventType.DemoCompleted)
            {
                session.CompletedAt = evt.OccurredAt;
            }
        }

        await _db.SaveChangesAsync();
        return new EventBatchResponse(session.Id);
    }

    public async Task<AnalyticsSummaryResponse> GetSummaryAsync(Guid demoId)
    {
        var sessions = await _db.DemoSessions
            .Where(s => s.DemoId == demoId)
            .ToListAsync();

        var totalViews = sessions.Count;
        var completions = sessions.Count(s => s.CompletedAt.HasValue);
        var avgTime = sessions
            .Where(s => s.CompletedAt.HasValue)
            .Select(s => (s.CompletedAt!.Value - s.StartedAt).TotalSeconds)
            .DefaultIfEmpty(0)
            .Average();
        var completionRate = totalViews > 0 ? (double)completions / totalViews * 100 : 0;

        // Views over time (last 30 days)
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;
        var viewsOverTime = sessions
            .Where(s => s.StartedAt >= thirtyDaysAgo)
            .GroupBy(s => s.StartedAt.Date)
            .Select(g => new DailyViewCount(g.Key, g.Count()))
            .OrderBy(d => d.Date)
            .ToList();

        // Step funnel
        var events = await _db.SessionEvents
            .Where(e => _db.DemoSessions.Any(s => s.DemoId == demoId && s.Id == e.SessionId))
            .Where(e => e.StepNumber.HasValue)
            .ToListAsync();

        var funnel = events
            .GroupBy(e => e.StepNumber!.Value)
            .Select(g => new StepFunnelEntry(
                g.Key,
                g.Count(e => e.EventType == EventType.StepViewed),
                g.Count(e => e.EventType == EventType.StepCompleted)))
            .OrderBy(f => f.StepNumber)
            .ToList();

        // Top sources
        var topSources = sessions
            .Where(s => s.Source != null)
            .GroupBy(s => s.Source!)
            .Select(g => new SourceEntry(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .Take(10)
            .ToList();

        return new AnalyticsSummaryResponse(totalViews, completions, avgTime, completionRate, viewsOverTime, funnel, topSources);
    }

    public async Task<AnalyticsSummaryResponse> GetGlobalSummaryAsync()
    {
        var sessions = await _db.DemoSessions.ToListAsync();

        var totalViews = sessions.Count;
        var completions = sessions.Count(s => s.CompletedAt.HasValue);
        var avgTime = sessions
            .Where(s => s.CompletedAt.HasValue)
            .Select(s => (s.CompletedAt!.Value - s.StartedAt).TotalSeconds)
            .DefaultIfEmpty(0)
            .Average();
        var completionRate = totalViews > 0 ? (double)completions / totalViews * 100 : 0;

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;
        var viewsOverTime = sessions
            .Where(s => s.StartedAt >= thirtyDaysAgo)
            .GroupBy(s => s.StartedAt.Date)
            .Select(g => new DailyViewCount(g.Key, g.Count()))
            .OrderBy(d => d.Date)
            .ToList();

        var topSources = sessions
            .Where(s => s.Source != null)
            .GroupBy(s => s.Source!)
            .Select(g => new SourceEntry(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .Take(10)
            .ToList();

        return new AnalyticsSummaryResponse(totalViews, completions, avgTime, completionRate, viewsOverTime, [], topSources);
    }

    public async Task<List<SessionListResponse>> GetSessionsAsync(Guid? demoId)
    {
        var query = _db.DemoSessions.AsQueryable();
        if (demoId.HasValue)
            query = query.Where(s => s.DemoId == demoId.Value);

        return await query
            .OrderByDescending(s => s.StartedAt)
            .Take(100)
            .Select(s => new SessionListResponse(
                s.Id, s.StartedAt, s.CompletedAt,
                s.Events.Count(e => e.EventType == EventType.StepViewed),
                _db.Steps.Count(st => st.DemoId == s.DemoId),
                s.CompletedAt.HasValue,
                s.Source))
            .ToListAsync();
    }

    private static string GenerateFingerprint(string? ip, string? ua, Guid demoId)
    {
        var raw = $"{ip ?? "unknown"}|{ua ?? "unknown"}|{demoId}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexStringLower(hash)[..32];
    }
}
