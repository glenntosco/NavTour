using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.DTOs.Team;
using NavTour.Shared.Enums;

namespace NavTour.Server.Services;

public class TeamService : ITeamService
{
    private readonly NavTourDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITenantProvider _tenantProvider;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    private static readonly Dictionary<string, int> SeatLimits = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Free"] = 1,
        ["Starter"] = 1,
        ["Growth"] = 5,
        ["Enterprise"] = int.MaxValue
    };

    public TeamService(
        NavTourDbContext db,
        UserManager<ApplicationUser> userManager,
        ITenantProvider tenantProvider,
        IEmailService emailService,
        IConfiguration config)
    {
        _db = db;
        _userManager = userManager;
        _tenantProvider = tenantProvider;
        _emailService = emailService;
        _config = config;
    }

    public async Task<TeamSummaryResponse> GetTeamAsync(Guid currentUserId)
    {
        var tenantId = _tenantProvider.TenantId;
        var tenant = await _db.Tenants.FirstAsync(t => t.Id == tenantId);

        var members = await _db.Users
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.Role)
            .ThenBy(u => u.CreatedAt)
            .Select(u => new TeamMemberResponse(u.Id, u.Email!, u.FullName, u.Role, u.IsActive, u.CreatedAt))
            .ToListAsync();

        var seatLimit = SeatLimits.GetValueOrDefault(tenant.Plan, 1);
        var activeCount = members.Count(m => m.IsActive);

        var currentUser = members.FirstOrDefault(m => m.Id == currentUserId);
        var currentUserRole = currentUser?.Role.ToString() ?? "Viewer";

        return new TeamSummaryResponse(members, activeCount, seatLimit, tenant.Plan, currentUserRole);
    }

    public async Task<(TeamMemberResponse? Member, string? TempPassword, string? Error)> InviteAsync(
        InviteMemberRequest request, Guid invitedByUserId)
    {
        var tenantId = _tenantProvider.TenantId;
        var tenant = await _db.Tenants.FirstAsync(t => t.Id == tenantId);

        // Seat limit check
        var seatLimit = SeatLimits.GetValueOrDefault(tenant.Plan, 1);
        var activeCount = await _db.Users.CountAsync(u => u.TenantId == tenantId && u.IsActive);
        if (activeCount >= seatLimit)
            return (null, null, $"Seat limit reached ({seatLimit} seats on {tenant.Plan} plan). Upgrade to add more team members.");

        // Can't create a second Owner
        if (request.Role == UserRole.Owner)
            return (null, null, "Cannot invite a user with the Owner role.");

        // Check if email already exists in this tenant
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == request.Email);
        if (existing != null)
            return (null, null, "A user with this email already exists in your workspace.");

        var tempPassword = GeneratePassword();

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName ?? "",
            TenantId = tenantId,
            Role = request.Role,
            IsActive = true,
            InvitedBy = invitedByUserId,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, tempPassword);
        if (!result.Succeeded)
            return (null, null, string.Join("; ", result.Errors.Select(e => e.Description)));

        // Send welcome email (fire-and-forget — invite succeeds even if email fails)
        var loginUrl = $"{_config["App:BaseUrl"] ?? "https://navtour.azurewebsites.net"}/login";
        _ = _emailService.SendWelcomeEmailAsync(request.Email, request.FullName ?? "", tempPassword, loginUrl);

        var member = new TeamMemberResponse(user.Id, user.Email!, user.FullName, user.Role, user.IsActive, user.CreatedAt);
        return (member, tempPassword, null);
    }

    public async Task<(TeamMemberResponse? Member, string? Error)> UpdateRoleAsync(Guid memberId, UpdateMemberRoleRequest request)
    {
        var tenantId = _tenantProvider.TenantId;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == memberId && u.TenantId == tenantId);

        if (user == null)
            return (null, "Team member not found.");

        if (user.Role == UserRole.Owner)
            return (null, "Cannot change the Owner's role.");

        if (request.Role == UserRole.Owner)
            return (null, "Cannot assign the Owner role.");

        user.Role = request.Role;
        await _db.SaveChangesAsync();

        var member = new TeamMemberResponse(user.Id, user.Email!, user.FullName, user.Role, user.IsActive, user.CreatedAt);
        return (member, null);
    }

    public async Task<(bool Success, string? Error)> DeactivateAsync(Guid memberId)
    {
        var tenantId = _tenantProvider.TenantId;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == memberId && u.TenantId == tenantId);

        if (user == null)
            return (false, "Team member not found.");

        if (user.Role == UserRole.Owner)
            return (false, "Cannot deactivate the workspace Owner.");

        user.IsActive = false;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ReactivateAsync(Guid memberId)
    {
        var tenantId = _tenantProvider.TenantId;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == memberId && u.TenantId == tenantId);

        if (user == null)
            return (false, "Team member not found.");

        // Seat limit check before reactivation
        var tenant = await _db.Tenants.FirstAsync(t => t.Id == tenantId);
        var seatLimit = SeatLimits.GetValueOrDefault(tenant.Plan, 1);
        var activeCount = await _db.Users.CountAsync(u => u.TenantId == tenantId && u.IsActive);
        if (activeCount >= seatLimit)
            return (false, $"Seat limit reached ({seatLimit} seats on {tenant.Plan} plan). Upgrade to reactivate this member.");

        user.IsActive = true;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static string GeneratePassword()
    {
        const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lower = "abcdefghijklmnopqrstuvwxyz";
        const string digits = "0123456789";
        const string special = "!@#$%^&*";
        const string all = upper + lower + digits + special;

        Span<char> password = stackalloc char[16];
        password[0] = upper[RandomNumberGenerator.GetInt32(upper.Length)];
        password[1] = lower[RandomNumberGenerator.GetInt32(lower.Length)];
        password[2] = digits[RandomNumberGenerator.GetInt32(digits.Length)];
        password[3] = special[RandomNumberGenerator.GetInt32(special.Length)];

        for (int i = 4; i < 16; i++)
            password[i] = all[RandomNumberGenerator.GetInt32(all.Length)];

        // Shuffle
        for (int i = password.Length - 1; i > 0; i--)
        {
            int j = RandomNumberGenerator.GetInt32(i + 1);
            (password[i], password[j]) = (password[j], password[i]);
        }

        return new string(password);
    }
}
