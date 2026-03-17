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
        return await _db.Leads
            .Include(l => l.Session)
            .Select(l => new LeadResponse(
                l.Id, l.Email, l.Name, l.Company, l.CustomData,
                l.Session.DemoId,
                _db.Demos.Where(d => d.Id == l.Session.DemoId).Select(d => d.Name).FirstOrDefault() ?? "",
                l.CreatedAt))
            .OrderByDescending(l => l.CapturedAt)
            .ToListAsync();
    }
}
