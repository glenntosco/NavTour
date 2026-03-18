using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Marketing;

[Collection("Playwright")]
public class ContactFormTests
{
    private readonly PlaywrightFixture _pw;

    public ContactFormTests(PlaywrightFixture pw) => _pw = pw;

    [Fact]
    public async Task ContactForm_SubmitsSuccessfully()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/contact");
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        await page.FillAsync("input[name='Model.Name']", "E2E Test User");
        await page.FillAsync("input[name='Model.Email']", "e2e-contact@navtour.test");
        await page.FillAsync("input[name='Model.Company']", "Test Corp");
        await page.FillAsync("textarea[name='Model.Message']", "This is an E2E test message.");

        await page.ClickAsync("button[type='submit']");

        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
        await page.Locator(".mkt-alert-success").ExpectVisibleAsync();
    }

    [Fact]
    public async Task ContactForm_HoneypotFieldIsHidden()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/contact");
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        // Honeypot input exists in DOM but is positioned off-screen (left:-9999px)
        var honeypot = page.Locator("input[name='website']");
        var count = await honeypot.CountAsync();
        Assert.Equal(1, count);
        // Verify it's off-screen by checking its parent has position:absolute;left:-9999px
        var parent = page.Locator("input[name='website'] >> xpath=..");
        var style = await parent.GetAttributeAsync("style");
        Assert.Contains("-9999px", style ?? "");
        // Also verify aria-hidden
        var ariaHidden = await parent.GetAttributeAsync("aria-hidden");
        Assert.Equal("true", ariaHidden);
    }
}
