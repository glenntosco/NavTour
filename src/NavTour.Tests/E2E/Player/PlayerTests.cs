using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.Enums;
using NavTour.Tests.E2E.Infrastructure;

namespace NavTour.Tests.E2E.Player;

[Collection("Playwright")]
public class PlayerTests
{
    private readonly PlaywrightFixture _pw;

    public PlayerTests(PlaywrightFixture pw) => _pw = pw;

    private HttpClient CreateApiClient()
    {
        var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _pw.AccessToken);
        return http;
    }

    private async Task<string> CreatePublishedDemoAsync()
    {
        using var http = CreateApiClient();

        var demoName = $"PlayerTest-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        createRes.EnsureSuccessStatusCode();
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        // Upload 2 frames
        var frameIds = new List<Guid>();
        for (var i = 1; i <= 2; i++)
        {
            using var content = new MultipartFormDataContent();
            var html = $"<!DOCTYPE html><html><body><h1>Frame {i}</h1></body></html>";
            content.Add(new StreamContent(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(html))), "file", $"frame{i}.html");
            var frameRes = await http.PostAsync($"api/v1/demos/{demoId}/frames", content);
            var frame = await frameRes.Content.ReadFromJsonAsync<JsonElement>();
            frameIds.Add(Guid.Parse(frame.GetProperty("id").GetString()!));
        }

        // Create steps for each frame (frames don't auto-create steps)
        var steps = frameIds.Select((fid, idx) => new StepDto(
            null, fid, idx + 1, null, NavigationAction.NextStep, null, []
        )).ToList();
        await http.PutAsJsonAsync($"api/v1/demos/{demoId}/steps", new UpdateStepsRequest(steps));

        await http.PostAsync($"api/v1/demos/{demoId}/publish", null);

        var demoRes = await http.GetAsync($"api/v1/demos/{demoId}");
        var demoDetail = await demoRes.Content.ReadFromJsonAsync<JsonElement>();
        return demoDetail.GetProperty("slug").GetString()!;
    }

    private async Task<IPage> OpenPlayerAsync(string slug)
    {
        var context = await _pw.Browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultTimeout(TestConstants.DefaultTimeout);
        await page.GotoAsync($"{TestConstants.BaseUrl}/demo/{slug}");
        await page.WaitForBlazorAsync();
        return page;
    }

    [Fact]
    public async Task Player_LoadsPublishedDemo()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator("text=PlayerTest").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_ShowsStepCounter()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator("text=/1\\s*\\/\\s*\\d+/").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_ShowsProgressBar()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator(".rz-progressbar").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_NextButton_AdvancesStep()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.ClickAsync("button:has-text('Next')");
        await page.WaitForTimeoutAsync(500);

        await page.Locator("text=/Step\\s+2\\s+of/").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_BackButton_GoesBack()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.ClickAsync("button:has-text('Next')");
        await page.WaitForTimeoutAsync(500);

        await page.ClickAsync("button:has-text('Back')");
        await page.WaitForTimeoutAsync(500);

        await page.Locator("text=/Step\\s+1\\s+of/").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_BackButton_DisabledOnFirstStep()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        var backBtn = page.Locator("button:has-text('Back')");
        await Assertions.Expect(backBtn).ToBeDisabledAsync(new() { Timeout = TestConstants.DefaultTimeout });
    }

    [Fact]
    public async Task Player_KeyboardNavigation_ArrowRight()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator("[tabindex='0']").First.FocusAsync();
        await page.Keyboard.PressAsync("ArrowRight");
        await page.WaitForTimeoutAsync(500);

        await page.Locator("text=/Step\\s+2\\s+of/").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_KeyboardNavigation_ArrowLeft()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator("[tabindex='0']").First.FocusAsync();
        await page.Keyboard.PressAsync("ArrowRight");
        await page.WaitForTimeoutAsync(500);

        await page.Keyboard.PressAsync("ArrowLeft");
        await page.WaitForTimeoutAsync(500);

        await page.Locator("text=/Step\\s+1\\s+of/").First.ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_LastStep_ShowsFinishButton()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.ClickAsync("button:has-text('Next')");
        await page.WaitForTimeoutAsync(500);

        await page.Locator("button:has-text('Finish')").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_InvalidSlug_ShowsNotFound()
    {
        var page = await OpenPlayerAsync("nonexistent-demo-xyz-12345");

        await page.Locator("text=Demo Not Found").ExpectVisibleAsync();
    }

    [Fact]
    public async Task Player_FrameRendersInIframe()
    {
        var slug = await CreatePublishedDemoAsync();
        var page = await OpenPlayerAsync(slug);

        await page.Locator("iframe[srcdoc]").ExpectVisibleAsync();
    }
}
