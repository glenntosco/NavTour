using Stripe;
using Stripe.Checkout;

namespace NavTour.Server.Services;

public class StripeService
{
    private readonly IConfiguration _config;

    public StripeService(IConfiguration config)
    {
        _config = config;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    /// <summary>Create a Checkout Session for subscription</summary>
    public async Task<string> CreateCheckoutSessionAsync(
        string customerId, string priceId, string successUrl, string cancelUrl, string tenantId)
    {
        var options = new SessionCreateOptions
        {
            Customer = customerId,
            Mode = "subscription",
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = priceId, Quantity = 1 }
            },
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string> { { "tenantId", tenantId } },
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new Dictionary<string, string> { { "tenantId", tenantId } }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    /// <summary>Create or get a Stripe customer for a tenant</summary>
    public async Task<string> EnsureCustomerAsync(string email, string name, string? existingCustomerId)
    {
        if (!string.IsNullOrEmpty(existingCustomerId))
        {
            try
            {
                var customerService = new CustomerService();
                var existing = await customerService.GetAsync(existingCustomerId);
                if (existing != null && !existing.Deleted.GetValueOrDefault()) return existingCustomerId;
            }
            catch { }
        }

        var options = new CustomerCreateOptions
        {
            Email = email,
            Name = name,
        };

        var service = new CustomerService();
        var customer = await service.CreateAsync(options);
        return customer.Id;
    }

    /// <summary>Create a billing portal session for managing subscription</summary>
    public async Task<string> CreatePortalSessionAsync(string customerId, string returnUrl)
    {
        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = returnUrl,
        };

        var service = new Stripe.BillingPortal.SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    /// <summary>Cancel a subscription</summary>
    public async Task CancelSubscriptionAsync(string subscriptionId)
    {
        var service = new SubscriptionService();
        await service.CancelAsync(subscriptionId);
    }

    public string GetPublishableKey() => _config["Stripe:PublishableKey"] ?? "";
}
