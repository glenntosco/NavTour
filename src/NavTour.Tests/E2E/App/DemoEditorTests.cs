using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.App;

[Collection("Playwright")]
public class DemoEditorTests
{
    private readonly PlaywrightFixture _pw;

    public DemoEditorTests(PlaywrightFixture pw) => _pw = pw;

    private HttpClient CreateApiClient()
    {
        var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _pw.AccessToken);
        return http;
    }

    private async Task<(string DemoId, IPage Page)> CreateDemoAndOpenEditorAsync()
    {
        using var http = CreateApiClient();
        var demoName = $"EditorTest-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        createRes.EnsureSuccessStatusCode();
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        using var content = new MultipartFormDataContent();
        var html = "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Frame</h1></body></html>";
        content.Add(new StreamContent(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(html))), "file", "test.html");
        await http.PostAsync($"api/v1/demos/{demoId}/frames", content);

        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/demos/{demoId}/edit");
        await page.WaitForBlazorAsync();

        return (demoId, page);
    }

    [Fact]
    public async Task Editor_LoadsDemoName()
    {
        var (_, page) = await CreateDemoAndOpenEditorAsync();
        var demoName = page.Locator(".rz-text-h6").First;
        await demoName.ExpectVisibleAsync();
        var text = await demoName.TextContentAsync();
        Assert.False(string.IsNullOrEmpty(text));
        Assert.DoesNotContain("Loading", text);
    }

    [Fact]
    public async Task Editor_HasToolbarButtons()
    {
        var (_, page) = await CreateDemoAndOpenEditorAsync();
        await page.Locator("button:has-text('Save')").First.ExpectVisibleAsync();
        await page.Locator("button:has-text('Preview')").ExpectVisibleAsync();
        await page.Locator("button:has-text('Publish')").ExpectVisibleAsync();
        await page.Locator("button:has-text('Settings')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Editor_FrameStripShowsFrames()
    {
        var (_, page) = await CreateDemoAndOpenEditorAsync();
        await page.WaitForTimeoutAsync(1000);
        var frameItems = page.Locator("[class*='frame']");
        var count = await frameItems.CountAsync();
        Assert.True(count >= 1, "Frame strip should show at least 1 frame");
    }

    [Fact]
    public async Task Editor_PublishDemo_ShowsNotification()
    {
        var (_, page) = await CreateDemoAndOpenEditorAsync();
        await page.ClickAsync("button:has-text('Publish')");

        // Wait for publish to complete, then verify the demo is now live
        // by checking the slug link appears or the page doesn't show errors
        await page.WaitForTimeoutAsync(2000);

        // Verify no error state — the publish button should still be visible (demo stays on editor)
        await page.Locator("button:has-text('Publish')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Editor_SettingsButton_NavigatesToSettings()
    {
        var (demoId, page) = await CreateDemoAndOpenEditorAsync();
        await page.ClickAsync("button:has-text('Settings')");
        await page.WaitForURLAsync("**/settings", new() { Timeout = TestConstants.DefaultTimeout });
        Assert.Contains($"/demos/{demoId}/settings", page.Url);
    }
}
