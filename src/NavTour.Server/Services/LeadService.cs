using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Services;

public class LeadService : ILeadService
{
    private readonly NavTourDbContext _db;

    public LeadService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<LeadResponse>> GetAllAsync()
    {
        var leads = await _db.Leads
            .Include(l => l.Session)
                .ThenInclude(s => s.Demo)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return leads.Select(l => new LeadResponse(
            l.Id, l.Email, l.Name, l.Company, l.CustomData,
            l.Session.DemoId,
            l.Session.Demo?.Name ?? "",
            l.CreatedAt
        )).ToList();
    }
}
