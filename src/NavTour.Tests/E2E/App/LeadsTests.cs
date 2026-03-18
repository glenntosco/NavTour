using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.App;

[Collection("Playwright")]
public class LeadsTests
{
    private readonly PlaywrightFixture _pw;

    public LeadsTests(PlaywrightFixture pw) => _pw = pw;

    [Fact]
    public async Task Leads_ShowsDataGrid()
    {
        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/leads");
        await page.WaitForBlazorAsync();

        await page.Locator("text=Captured Leads").ExpectVisibleAsync();

        var grid = page.Locator(".rz-data-grid, .rz-datatable").First;
        await grid.ExpectVisibleAsync();

        // Check column headers exist
        await page.Locator("th:has-text('Email')").First.ExpectVisibleAsync();
        await page.Locator("th:has-text('Name')").First.ExpectVisibleAsync();
        await page.Locator("th:has-text('Company')").First.ExpectVisibleAsync();

        await context.CloseAsync();
    }

    [Fact]
    public async Task Leads_UnauthenticatedShowsSignIn()
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);

        await page.GotoAsync($"{TestConstants.BaseUrl}/leads");
        await page.WaitForBlazorAsync();

        await page.WaitForURLAsync("**/login", new() { Timeout = TestConstants.DefaultTimeout });
        Assert.Contains("/login", page.Url);
    }
}
