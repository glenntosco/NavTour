using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Infrastructure.Auth;
using NavTour.Server.Infrastructure.Data;
using NavTour.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/billing")]
public class BillingController : ControllerBase
{
    private readonly StripeService _stripe;
    private readonly NavTourDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public BillingController(StripeService stripe, NavTourDbContext db,
        UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        _stripe = stripe;
        _db = db;
        _userManager = userManager;
        _config = config;
    }

    /// <summary>Get current subscription info</summary>
    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant == null) return NotFound();

        return Ok(new
        {
            plan = tenant.Plan,
            stripeCustomerId = tenant.StripeCustomerId,
            subscriptionId = tenant.StripeSubscriptionId,
            subscriptionEndsAt = tenant.SubscriptionEndsAt,
            seatCount = tenant.SeatCount,
            publishableKey = _stripe.GetPublishableKey()
        });
    }

    /// <summary>Create checkout session to upgrade</summary>
    [HttpPost("checkout")]
    [Authorize]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant == null) return NotFound();

        // Ensure Stripe customer exists
        var customerId = await _stripe.EnsureCustomerAsync(
            user.Email!, tenant.Name, tenant.StripeCustomerId);

        if (tenant.StripeCustomerId != customerId)
        {
            tenant.StripeCustomerId = customerId;
            await _db.SaveChangesAsync();
        }

        // Resolve price ID from plan name + interval
        var priceId = request.Plan switch
        {
            "hobby-monthly" => _config["Stripe:HobbyMonthlyPriceId"],
            "hobby-annual" => _config["Stripe:HobbyAnnualPriceId"],
            "growth-monthly" => _config["Stripe:GrowthMonthlyPriceId"],
            "growth-annual" => _config["Stripe:GrowthAnnualPriceId"],
            "scale-monthly" => _config["Stripe:ScaleMonthlyPriceId"],
            "scale-annual" => _config["Stripe:ScaleAnnualPriceId"],
            _ => request.PriceId // fallback to raw price ID
        };
        if (string.IsNullOrEmpty(priceId)) return BadRequest("Invalid plan");

        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        var checkoutUrl = await _stripe.CreateCheckoutSessionAsync(
            customerId, priceId,
            $"{baseUrl}/billing",
            $"{baseUrl}/billing",
            tenant.Id.ToString());

        return Ok(new { url = checkoutUrl });
    }

    /// <summary>Open Stripe customer portal</summary>
    [HttpPost("portal")]
    [Authorize]
    public async Task<IActionResult> CreatePortal()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant?.StripeCustomerId == null) return BadRequest("No subscription found");

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var portalUrl = await _stripe.CreatePortalSessionAsync(
            tenant.StripeCustomerId, $"{baseUrl}/billing");

        return Ok(new { url = portalUrl });
    }

    /// <summary>Stripe webhook handler</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var webhookSecret = _config["Stripe:WebhookSecret"];

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json,
                Request.Headers["Stripe-Signature"], webhookSecret);
        }
        catch (StripeException)
        {
            return BadRequest("Invalid signature");
        }

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session?.Metadata?.TryGetValue("tenantId", out var tenantId) == true)
                {
                    var tenant = await _db.Tenants
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));
                    if (tenant != null)
                    {
                        tenant.StripeCustomerId = session.CustomerId;
                        tenant.StripeSubscriptionId = session.SubscriptionId;
                        await _db.SaveChangesAsync();
                    }
                }
                break;
            }

            case "customer.subscription.updated":
            case "customer.subscription.created":
            {
                var subscription = stripeEvent.Data.Object as Subscription;
                if (subscription?.Metadata?.TryGetValue("tenantId", out var tenantId) == true)
                {
                    var tenant = await _db.Tenants
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));
                    if (tenant != null)
                    {
                        tenant.StripeSubscriptionId = subscription.Id;
                        tenant.StripePriceId = subscription.Items?.Data?.FirstOrDefault()?.Price?.Id;
                        tenant.SubscriptionEndsAt = subscription.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd;

                        // Determine plan from price
                        var hobbyMonthly = _config["Stripe:HobbyMonthlyPriceId"];
                        var hobbyAnnual = _config["Stripe:HobbyAnnualPriceId"];
                        var growthMonthly = _config["Stripe:GrowthMonthlyPriceId"];
                        var growthAnnual = _config["Stripe:GrowthAnnualPriceId"];
                        var scaleMonthly = _config["Stripe:ScaleMonthlyPriceId"];
                        var scaleAnnual = _config["Stripe:ScaleAnnualPriceId"];

                        if (tenant.StripePriceId == hobbyMonthly || tenant.StripePriceId == hobbyAnnual)
                            tenant.Plan = "Hobby";
                        else if (tenant.StripePriceId == growthMonthly || tenant.StripePriceId == growthAnnual)
                            tenant.Plan = "Growth";
                        else if (tenant.StripePriceId == scaleMonthly || tenant.StripePriceId == scaleAnnual)
                            tenant.Plan = "Scale";

                        if (subscription.Status == "active" || subscription.Status == "trialing")
                            tenant.IsActive = true;

                        await _db.SaveChangesAsync();
                    }
                }
                break;
            }

            case "customer.subscription.deleted":
            {
                var subscription = stripeEvent.Data.Object as Subscription;
                if (subscription?.Metadata?.TryGetValue("tenantId", out var tenantId) == true)
                {
                    var tenant = await _db.Tenants
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));
                    if (tenant != null)
                    {
                        tenant.Plan = "Starter";
                        tenant.StripeSubscriptionId = null;
                        tenant.StripePriceId = null;
                        tenant.SubscriptionEndsAt = null;
                        await _db.SaveChangesAsync();
                    }
                }
                break;
            }
        }

        return Ok();
    }
}

public record CheckoutRequest(string? PriceId = null, string? Plan = null);
