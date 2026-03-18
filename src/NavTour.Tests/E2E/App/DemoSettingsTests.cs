using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.App;

[Collection("Playwright")]
public class DemoSettingsTests
{
    private readonly PlaywrightFixture _pw;

    public DemoSettingsTests(PlaywrightFixture pw) => _pw = pw;

    private HttpClient CreateApiClient()
    {
        var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _pw.AccessToken);
        return http;
    }

    private async Task<(string DemoId, IPage Page)> CreateDemoAndOpenSettingsAsync()
    {
        using var http = CreateApiClient();
        var demoName = $"SettingsTest-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        createRes.EnsureSuccessStatusCode();
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        var context = await _pw.CreateAuthenticatedContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/demos/{demoId}/settings");
        await page.WaitForBlazorAsync();

        // Wait for settings form to render
        await page.Locator("text=Demo Settings").ExpectVisibleAsync();

        return (demoId, page);
    }

    [Fact]
    public async Task Settings_RendersNameAndSlug()
    {
        var (_, page) = await CreateDemoAndOpenSettingsAsync();

        // Name field should contain the demo name
        var nameInput = page.Locator(".rz-textbox").First;
        await nameInput.ExpectVisibleAsync();
        var value = await nameInput.InputValueAsync();
        Assert.Contains("SettingsTest", value);

        // Slug field should exist (disabled)
        var disabledInputs = page.Locator("input[disabled]");
        var count = await disabledInputs.CountAsync();
        Assert.True(count > 0, "Should have a disabled slug input");
    }

    [Fact]
    public async Task Settings_UpdateName_Saves()
    {
        var (_, page) = await CreateDemoAndOpenSettingsAsync();

        var nameInput = page.Locator(".rz-textbox").First;
        await nameInput.ClearAsync();
        await nameInput.FillAsync("Updated Name E2E");
        await page.ClickAsync("button:has-text('Save Changes')");

        // Wait for the save operation to complete (button becomes non-busy)
        await page.WaitForTimeoutAsync(1000);

        // Reload the page and verify the name persisted
        await page.ReloadAsync();
        await page.WaitForBlazorAsync();
        await page.Locator("text=Demo Settings").ExpectVisibleAsync();
        var updatedInput = page.Locator(".rz-textbox").First;
        var updatedValue = await updatedInput.InputValueAsync();
        Assert.Contains("Updated Name E2E", updatedValue);
    }

    [Fact]
    public async Task Settings_HasDeleteButton()
    {
        var (_, page) = await CreateDemoAndOpenSettingsAsync();

        await page.Locator("text=Danger Zone").ExpectVisibleAsync();
        await page.Locator("button:has-text('Delete Demo')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Settings_DeleteDemo_RedirectsToDashboard()
    {
        var (_, page) = await CreateDemoAndOpenSettingsAsync();

        await page.ClickAsync("button:has-text('Delete Demo')");
        await page.WaitForURLAsync("**/dashboard", new() { Timeout = TestConstants.DefaultTimeout });
        Assert.Contains("/dashboard", page.Url);
    }
}
