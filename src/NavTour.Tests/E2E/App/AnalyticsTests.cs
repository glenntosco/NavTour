using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.App;

[Collection("Playwright")]
public class AnalyticsTests
{
    private readonly PlaywrightFixture _pw;

    public AnalyticsTests(PlaywrightFixture pw) => _pw = pw;

    private HttpClient CreateApiClient()
    {
        var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _pw.AccessToken);
        return http;
    }

    private async Task<(string DemoId, IPage Page)> CreatePublishedDemoAndOpenAnalyticsAsync()
    {
        using var http = CreateApiClient();

        var demoName = $"AnalyticsTest-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        createRes.EnsureSuccessStatusCode();
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        using var content = new MultipartFormDataContent();
        var html = "<!DOCTYPE html><html><body><h1>Analytics Test</h1></body></html>";
        content.Add(new StreamContent(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(html))), "file", "test.html");
        await http.PostAsync($"api/v1/demos/{demoId}/frames", content);

        await http.PostAsync($"api/v1/demos/{demoId}/publish", null);

        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/demos/{demoId}/analytics");
        await page.WaitForBlazorAsync();

        return (demoId, page);
    }

    [Fact]
    public async Task Analytics_ShowsStatCards()
    {
        var (_, page) = await CreatePublishedDemoAndOpenAnalyticsAsync();

        await page.Locator("text=Total Views").ExpectVisibleAsync();
        await page.Locator("text=Completions").First.ExpectVisibleAsync();
        await page.Locator("text=Completion Rate").ExpectVisibleAsync();
        await page.Locator("text=Avg Time").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Analytics_ShowsViewsOverTimeSection()
    {
        var (_, page) = await CreatePublishedDemoAndOpenAnalyticsAsync();

        // Verify the "Views Over Time" chart section heading renders
        await page.Locator("text=Views Over Time").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Analytics_HasLeadsCapturedSection()
    {
        var (_, page) = await CreatePublishedDemoAndOpenAnalyticsAsync();

        await page.Locator("text=Leads Captured").ExpectVisibleAsync();
    }
}
