using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.MultiTenancy;
using NavTour.Shared.Entities;
using NavTour.Shared.Models;

namespace NavTour.Server.Infrastructure.Data;

public class NavTourDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public NavTourDbContext(DbContextOptions<NavTourDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Demo> Demos => Set<Demo>();
    public DbSet<Frame> Frames => Set<Frame>();
    public DbSet<Step> Steps => Set<Step>();
    public DbSet<Annotation> Annotations => Set<Annotation>();
    public DbSet<DemoSession> DemoSessions => Set<DemoSession>();
    public DbSet<SessionEvent> SessionEvents => Set<SessionEvent>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<PersonalizationVariable> PersonalizationVariables => Set<PersonalizationVariable>();
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
    public DbSet<LeadEmailTemplate> LeadEmailTemplates => Set<LeadEmailTemplate>();
    public DbSet<Form> Forms => Set<Form>();
    public DbSet<CapturedResource> CapturedResources => Set<CapturedResource>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Tenant (no global filter — Tenant is the root)
        builder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Name).HasMaxLength(200);
            e.Property(t => t.Slug).HasMaxLength(100);
        });

        // Form
        builder.Entity<Form>(e =>
        {
            e.HasQueryFilter(f => f.TenantId == _tenantProvider.TenantId && !f.IsDeleted);
            e.HasIndex(f => new { f.TenantId, f.Slug }).IsUnique();
            e.Property(f => f.Name).HasMaxLength(200);
            e.Property(f => f.Slug).HasMaxLength(100);
            e.Property(f => f.Description).HasMaxLength(2000);
        });

        // Demo
        builder.Entity<Demo>(e =>
        {
            e.HasQueryFilter(d => d.TenantId == _tenantProvider.TenantId && !d.IsDeleted);
            e.HasIndex(d => new { d.TenantId, d.Slug }).IsUnique();
            e.Property(d => d.Name).HasMaxLength(200);
            e.Property(d => d.Slug).HasMaxLength(100);
            e.Property(d => d.Description).HasMaxLength(2000);
            e.Property(d => d.Locale).HasMaxLength(10);
            e.HasOne(d => d.Form).WithMany(f => f.Demos).HasForeignKey(d => d.FormId).OnDelete(DeleteBehavior.SetNull);
        });

        // Frame
        builder.Entity<Frame>(e =>
        {
            e.HasQueryFilter(f => f.TenantId == _tenantProvider.TenantId && !f.IsDeleted);
            e.HasOne(f => f.Demo).WithMany(d => d.Frames).HasForeignKey(f => f.DemoId).OnDelete(DeleteBehavior.Cascade);
        });

        // Step
        builder.Entity<Step>(e =>
        {
            e.HasQueryFilter(s => s.TenantId == _tenantProvider.TenantId && !s.IsDeleted);
            e.HasOne(s => s.Demo).WithMany(d => d.Steps).HasForeignKey(s => s.DemoId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Frame).WithMany().HasForeignKey(s => s.FrameId).IsRequired(false).OnDelete(DeleteBehavior.NoAction);
        });

        // Annotation
        builder.Entity<Annotation>(e =>
        {
            e.HasQueryFilter(a => a.TenantId == _tenantProvider.TenantId && !a.IsDeleted);
            e.HasOne(a => a.Step).WithMany(s => s.Annotations).HasForeignKey(a => a.StepId).OnDelete(DeleteBehavior.Cascade);
            e.Property(a => a.Title).HasMaxLength(200);
            e.Property(a => a.Content).HasMaxLength(4000);
        });

        // DemoSession
        builder.Entity<DemoSession>(e =>
        {
            e.HasQueryFilter(ds => ds.TenantId == _tenantProvider.TenantId && !ds.IsDeleted);
            e.HasOne(ds => ds.Demo).WithMany(d => d.Sessions).HasForeignKey(ds => ds.DemoId).OnDelete(DeleteBehavior.Cascade);
            e.Property(ds => ds.ViewerFingerprint).HasMaxLength(128);
            e.Property(ds => ds.Source).HasMaxLength(500);
        });

        // SessionEvent
        builder.Entity<SessionEvent>(e =>
        {
            e.HasQueryFilter(se => se.TenantId == _tenantProvider.TenantId);
            e.HasOne(se => se.Session).WithMany(s => s.Events).HasForeignKey(se => se.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        // Lead
        builder.Entity<Lead>(e =>
        {
            e.HasQueryFilter(l => l.TenantId == _tenantProvider.TenantId && !l.IsDeleted);
            e.HasOne(l => l.Session).WithOne(s => s.Lead).HasForeignKey<Lead>(l => l.SessionId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(l => l.Form).WithMany().HasForeignKey(l => l.FormId).OnDelete(DeleteBehavior.SetNull);
            e.Property(l => l.Email).HasMaxLength(320);
            e.Property(l => l.Name).HasMaxLength(200);
            e.Property(l => l.Company).HasMaxLength(200);
        });

        // PersonalizationVariable
        builder.Entity<PersonalizationVariable>(e =>
        {
            e.HasQueryFilter(pv => pv.TenantId == _tenantProvider.TenantId && !pv.IsDeleted);
            e.HasOne(pv => pv.Demo).WithMany().HasForeignKey(pv => pv.DemoId).OnDelete(DeleteBehavior.Cascade);
            e.Property(pv => pv.Key).HasMaxLength(100);
            e.Property(pv => pv.DefaultValue).HasMaxLength(1000);
            e.Property(pv => pv.Description).HasMaxLength(500);
            e.HasIndex(pv => new { pv.DemoId, pv.Key }).IsUnique();
        });

        // LeadEmailTemplate (one per tenant)
        builder.Entity<LeadEmailTemplate>(e =>
        {
            e.HasQueryFilter(t => t.TenantId == _tenantProvider.TenantId && !t.IsDeleted);
            e.Property(t => t.Subject).HasMaxLength(500);
            e.Property(t => t.Heading).HasMaxLength(200);
            e.Property(t => t.Body).HasMaxLength(4000);
            e.Property(t => t.CtaText).HasMaxLength(100);
            e.Property(t => t.CtaUrl).HasMaxLength(500);
            e.Property(t => t.AccentColor).HasMaxLength(7);
            e.HasIndex(t => t.TenantId).IsUnique();
        });

        // CapturedResource — content-addressed, shared across tenants (no query filter)
        builder.Entity<CapturedResource>(e =>
        {
            e.HasKey(r => r.Hash);
            e.Property(r => r.Hash).HasMaxLength(64);
            e.Property(r => r.ContentType).HasMaxLength(200);
        });

        // ApiKey
        builder.Entity<ApiKey>(e =>
        {
            e.HasQueryFilter(ak => ak.TenantId == _tenantProvider.TenantId && !ak.IsDeleted);
            e.Property(ak => ak.Name).HasMaxLength(100);
            e.Property(ak => ak.KeyHash).HasMaxLength(64);
        });
    }

    public override int SaveChanges()
    {
        SetAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetAuditFields()
    {
        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.TenantId == Guid.Empty)
                    entry.Entity.TenantId = _tenantProvider.TenantId;
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedAt = DateTime.UtcNow;
            }
        }
    }
}
