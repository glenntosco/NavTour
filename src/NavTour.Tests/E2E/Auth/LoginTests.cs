using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Auth;

[Collection("Playwright")]
public class LoginTests
{
    private readonly PlaywrightFixture _pw;

    public LoginTests(PlaywrightFixture pw) => _pw = pw;

    private async Task<IPage> OpenLoginPageAsync()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/login");
        await page.WaitForBlazorAsync();
        return page;
    }

    [Fact]
    public async Task LoginPage_RendersForm()
    {
        var page = await OpenLoginPageAsync();

        await page.Locator("input[placeholder='Email']").ExpectVisibleAsync();
        await page.Locator("input[placeholder='Password']").ExpectVisibleAsync();
        await page.Locator("button:has-text('Sign In')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task LoginPage_InvalidCredentials_ShowsError()
    {
        var page = await OpenLoginPageAsync();

        await page.FillRadzenTextBoxAsync("Email", "nobody@example.com");
        await page.FillAsync("input[placeholder='Password']", "WrongPassword123!");
        await page.ClickRadzenButtonAsync("Sign In");

        await page.Locator("text=Invalid email or password").ExpectVisibleAsync();
    }

    [Fact]
    public async Task LoginPage_ValidCredentials_RedirectsToDashboard()
    {
        var page = await OpenLoginPageAsync();

        await page.FillRadzenTextBoxAsync("Email", _pw.TestEmail);
        await page.FillAsync("input[placeholder='Password']", TestConstants.Password);
        await page.ClickRadzenButtonAsync("Sign In");

        await page.WaitForURLAsync("**/dashboard", new() { Timeout = TestConstants.DefaultTimeout });
        Assert.Contains("/dashboard", page.Url);
    }

    [Fact]
    public async Task LoginPage_HasRegisterLink()
    {
        var page = await OpenLoginPageAsync();

        var registerLink = page.Locator("a:has-text('Register')");
        await registerLink.ExpectVisibleAsync();
        var href = await registerLink.GetAttributeAsync("href");
        Assert.Equal("/register", href);
    }

    [Fact]
    public async Task LoginPage_NoSidebar()
    {
        var page = await OpenLoginPageAsync();

        var sidebar = page.Locator(".rz-sidebar");
        var count = await sidebar.CountAsync();
        Assert.Equal(0, count);
    }
}
