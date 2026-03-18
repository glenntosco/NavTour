using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Marketing;

[Collection("Playwright")]
public class MarketingPagesTests
{
    private readonly PlaywrightFixture _pw;

    public MarketingPagesTests(PlaywrightFixture pw) => _pw = pw;

    [Theory]
    [InlineData("/about")]
    [InlineData("/product")]
    [InlineData("/features")]
    [InlineData("/pricing")]
    [InlineData("/contact")]
    [InlineData("/blog")]
    [InlineData("/customers")]
    [InlineData("/security")]
    [InlineData("/integrations")]
    [InlineData("/use-cases")]
    [InlineData("/solutions/sales")]
    [InlineData("/solutions/marketing")]
    [InlineData("/solutions/presales")]
    [InlineData("/solutions/customer-success")]
    [InlineData("/product/ai")]
    [InlineData("/docs")]
    public async Task MarketingPage_LoadsSuccessfully(string route)
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        var response = await page.GotoAsync($"{TestConstants.BaseUrl}{route}");
        Assert.NotNull(response);
        Assert.True(response!.Ok, $"Expected 200 OK for {route}, got {response.Status}");

        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
        await page.Locator("h1").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task PricingPage_Shows4Tiers()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/pricing");
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var cards = page.Locator(".mkt-grid-4 > *");
        var count = await cards.CountAsync();
        Assert.Equal(4, count);
    }

    [Fact]
    public async Task PricingPage_FAQAccordion_ExpandsOnClick()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/pricing");
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var firstFaq = page.Locator("details.mkt-faq").First;
        await firstFaq.ExpectVisibleAsync();

        await firstFaq.Locator("summary").ClickAsync();

        var answer = firstFaq.Locator("p");
        await answer.ExpectVisibleAsync();
    }

    [Fact]
    public async Task PricingPage_HasComparisonTable()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/pricing");
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        await page.Locator("table.mkt-table").ExpectVisibleAsync();
    }
}
