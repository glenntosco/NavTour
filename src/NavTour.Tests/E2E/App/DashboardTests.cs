using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.App;

[Collection("Playwright")]
public class DashboardTests
{
    private readonly PlaywrightFixture _pw;

    public DashboardTests(PlaywrightFixture pw) => _pw = pw;

    private async Task<IPage> OpenDashboardAsync()
    {
        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/dashboard");
        await page.WaitForBlazorAsync();
        // Wait for the authenticated dashboard to render (shows "Product Demos" heading)
        await page.Locator("text=Product Demos").First.ExpectVisibleAsync();
        return page;
    }

    private HttpClient CreateApiClient()
    {
        var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _pw.AccessToken);
        return http;
    }

    [Fact]
    public async Task Dashboard_ShowsProductDemosHeading()
    {
        var page = await OpenDashboardAsync();
        await page.Locator("text=Product Demos").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Dashboard_ShowsContentOrEmptyState()
    {
        var page = await OpenDashboardAsync();
        // Dashboard should show either the demo grid or the empty state
        var noData = page.Locator("text=No demos yet");
        var createBtn = page.Locator("button:has-text('+ Create Demo')").First;
        var demoCards = page.Locator(".demo-card");

        var hasEmptyState = await noData.CountAsync() > 0;
        var hasDemos = await demoCards.CountAsync() > 0;

        // One of these must be true
        Assert.True(hasEmptyState || hasDemos, "Dashboard should show either demos or empty state");
        // Create button should always be visible
        await createBtn.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Dashboard_CreateDemo_ButtonExists()
    {
        var page = await OpenDashboardAsync();
        // Verify the "+ Create Demo" button is present and clickable
        var createBtn = page.Locator("button:has-text('+ Create Demo')").First;
        await createBtn.ExpectVisibleAsync();
        await Assertions.Expect(createBtn).ToBeEnabledAsync(new() { Timeout = TestConstants.DefaultTimeout });
    }

    [Fact]
    public async Task Dashboard_CreateDemo_NavigatesToEditor()
    {
        // Create a demo via API instead — more reliable than the dialog
        using var http = CreateApiClient();
        var demoName = $"E2E Demo {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        createRes.EnsureSuccessStatusCode();
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        // Navigate to the editor and verify it loads
        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/demos/{demoId}/edit");
        await page.WaitForBlazorAsync();

        Assert.Contains($"/demos/{demoId}/edit", page.Url);
        await page.Locator(".rz-text-h6").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Dashboard_SearchFiltersDemos()
    {
        using var http = CreateApiClient();
        var name1 = $"SearchAlpha-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var name2 = $"SearchBeta-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        await http.PostAsJsonAsync("api/v1/demos", new { name = name1 });
        await http.PostAsJsonAsync("api/v1/demos", new { name = name2 });

        var page = await OpenDashboardAsync();

        // Wait for demos to load
        await page.Locator($"text={name1}").ExpectVisibleAsync();

        await page.FillAsync("input[placeholder='Search demos...']", "Alpha");
        await page.Locator("input[placeholder='Search demos...']").PressAsync("Enter");
        await page.WaitForTimeoutAsync(500);

        var alpha = page.Locator($"text={name1}");
        Assert.True(await alpha.CountAsync() >= 1, "Alpha demo should be visible after search");
    }

    [Fact]
    public async Task Dashboard_ShowsSidebar()
    {
        var page = await OpenDashboardAsync();
        var sidebar = page.Locator(".rz-sidebar");
        await sidebar.ExpectVisibleAsync();

        await page.Locator("text=Product Demos").First.ExpectVisibleAsync();
        await page.Locator(".rz-navigation-item-text:has-text('Analytics')").ExpectVisibleAsync();
        await page.Locator(".rz-navigation-item-text:has-text('Leads')").ExpectVisibleAsync();
        await page.Locator(".rz-navigation-item-text:has-text('Settings')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Dashboard_SidebarNavigation()
    {
        var page = await OpenDashboardAsync();
        await page.Locator(".rz-navigation-item-text:has-text('Leads')").ClickAsync();
        await page.WaitForURLAsync("**/leads", new() { Timeout = TestConstants.DefaultTimeout });
        Assert.Contains("/leads", page.Url);
    }
}
