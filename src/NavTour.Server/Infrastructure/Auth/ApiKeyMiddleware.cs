using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Infrastructure.MultiTenancy;

namespace NavTour.Server.Infrastructure.Auth;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-NavTour-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, NavTourDbContext dbContext, ITenantProvider tenantProvider)
    {
        // Skip if already authenticated via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("TenantId")?.Value;
            if (tenantClaim != null && Guid.TryParse(tenantClaim, out var tenantId))
            {
                tenantProvider.SetTenantId(tenantId);
            }
            await _next(context);
            return;
        }

        // Check for API key
        if (context.Request.Headers.TryGetValue(ApiKeyHeader, out var apiKeyValue))
        {
            var keyHash = HashApiKey(apiKeyValue.ToString());
            var apiKey = await dbContext.ApiKeys
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(k => k.KeyHash == keyHash && k.IsActive && !k.IsDeleted);

            if (apiKey != null)
            {
                tenantProvider.SetTenantId(apiKey.TenantId);
                apiKey.LastUsedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();

                var claims = new[]
                {
                    new Claim("TenantId", apiKey.TenantId.ToString()),
                    new Claim("ApiKeyId", apiKey.Id.ToString()),
                    new Claim(ClaimTypes.Role, "ApiKey")
                };
                context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "ApiKey"));
            }
        }

        await _next(context);
    }

    private static string HashApiKey(string apiKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToHexStringLower(bytes);
    }
}
