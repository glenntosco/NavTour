namespace NavTour.Server.Infrastructure.MultiTenancy;

public interface ITenantProvider
{
    Guid TenantId { get; }
    void SetTenantId(Guid tenantId);
}
