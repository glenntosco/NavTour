namespace NavTour.Server.Infrastructure.MultiTenancy;

public class TenantProvider : ITenantProvider
{
    private Guid _tenantId;

    public Guid TenantId => _tenantId;

    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
