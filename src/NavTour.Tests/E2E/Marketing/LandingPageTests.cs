using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Marketing;

[Collection("Playwright")]
public class LandingPageTests
{
    private readonly PlaywrightFixture _pw;

    public LandingPageTests(PlaywrightFixture pw) => _pw = pw;

    private async Task<IPage> OpenLandingPageAsync()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync(TestConstants.BaseUrl);
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
        return page;
    }

    [Fact]
    public async Task LandingPage_LoadsWithHeroSection()
    {
        var page = await OpenLandingPageAsync();
        await page.Locator("h1").First.ExpectVisibleAsync();
        var title = await page.TitleAsync();
        Assert.Contains("NavTour", title);
    }

    [Fact]
    public async Task LandingPage_HasSocialProofSection()
    {
        var page = await OpenLandingPageAsync();
        await page.Locator("text=Trusted by").ExpectVisibleAsync();
    }

    [Fact]
    public async Task LandingPage_HasHowItWorksSteps()
    {
        var page = await OpenLandingPageAsync();
        var steps = page.Locator(".mkt-step-row");
        var count = await steps.CountAsync();
        Assert.True(count >= 3, $"Expected at least 3 how-it-works steps, found {count}");
    }

    [Fact]
    public async Task LandingPage_HasCTAButton()
    {
        var page = await OpenLandingPageAsync();
        // CTA links to /register — find visible one in the hero section (not the mobile nav one)
        var cta = page.Locator("a[href='/register']:visible");
        var count = await cta.CountAsync();
        Assert.True(count > 0, "Should have at least one visible CTA linking to /register");
    }

    [Fact]
    public async Task LandingPage_HasFooter()
    {
        var page = await OpenLandingPageAsync();
        var footer = page.Locator("footer");
        await footer.ExpectVisibleAsync();
        var links = footer.Locator("a");
        var count = await links.CountAsync();
        Assert.True(count > 0, "Footer should contain links");
    }
}
