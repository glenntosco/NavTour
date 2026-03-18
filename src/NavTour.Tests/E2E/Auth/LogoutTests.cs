using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Auth;

[Collection("Playwright")]
public class LogoutTests
{
    private readonly PlaywrightFixture _pw;

    public LogoutTests(PlaywrightFixture pw) => _pw = pw;

    [Fact]
    public async Task Logout_ClearsAuthViaCookies()
    {
        // Verify that after clearing the auth cookie, the dashboard shows unauthenticated state
        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        // Access a protected page to verify cookie auth works
        await page.GotoAsync($"{TestConstants.BaseUrl}/dashboard");
        await page.WaitForBlazorAsync();
        await page.Locator("text=Product Demos").First.ExpectVisibleAsync();

        // Clear the auth cookie
        await context.ClearCookiesAsync();

        // Reload — should now show unauthenticated state or redirect
        await page.GotoAsync($"{TestConstants.BaseUrl}/dashboard");
        await page.WaitForBlazorAsync();

        // Either redirects to login or shows Sign In button
        var signIn = page.Locator("button:has-text('Sign In')");
        await signIn.ExpectVisibleAsync();

        await context.CloseAsync();
    }

    [Fact]
    public async Task Logout_DashboardShowsUnauthenticated()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/dashboard");
        await page.WaitForBlazorAsync();

        var signIn = page.Locator("button:has-text('Sign In')");
        await signIn.ExpectVisibleAsync();
    }
}
