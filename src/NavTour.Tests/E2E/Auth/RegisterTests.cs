using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Auth;

[Collection("Playwright")]
public class RegisterTests
{
    private readonly PlaywrightFixture _pw;

    public RegisterTests(PlaywrightFixture pw) => _pw = pw;

    private async Task<IPage> OpenRegisterPageAsync()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/register");
        await page.WaitForBlazorAsync();
        return page;
    }

    [Fact]
    public async Task RegisterPage_RendersForm()
    {
        var page = await OpenRegisterPageAsync();

        await page.Locator("input[placeholder='Full Name']").ExpectVisibleAsync();
        await page.Locator("input[placeholder='Company Name']").ExpectVisibleAsync();
        await page.Locator("input[placeholder='Email']").ExpectVisibleAsync();
        await page.Locator("input[placeholder='Password (min 8 chars)']").ExpectVisibleAsync();
        await page.Locator("button:has-text('Create Account')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task RegisterPage_DuplicateEmail_ShowsError()
    {
        var page = await OpenRegisterPageAsync();

        await page.FillRadzenTextBoxAsync("Full Name", "Duplicate User");
        await page.FillRadzenTextBoxAsync("Company Name", "Dup Corp");
        await page.FillRadzenTextBoxAsync("Email", _pw.TestEmail);
        await page.FillAsync("input[placeholder='Password (min 8 chars)']", TestConstants.Password);
        await page.ClickRadzenButtonAsync("Create Account");

        // Radzen alert with error styling — use the top-level danger alert
        var alert = page.Locator(".rz-danger").First;
        await alert.ExpectVisibleAsync();
    }
}
