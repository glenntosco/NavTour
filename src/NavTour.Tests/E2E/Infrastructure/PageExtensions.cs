using Microsoft.Playwright;

namespace NavTour.Tests.E2E.Infrastructure;

public static class PageExtensions
{
    /// <summary>
    /// Waits for Blazor Server to finish rendering: NetworkIdle + spinner gone.
    /// For authenticated pages, also waits for content to appear after OnAfterRenderAsync.
    /// </summary>
    public static async Task WaitForBlazorAsync(this IPage page, int? timeout = null)
    {
        var t = timeout ?? TestConstants.DefaultTimeout;
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle, new() { Timeout = t });
        // Wait for Radzen circular spinner to disappear (if present)
        var spinner = page.Locator(".rz-progressbar-circular");
        try
        {
            await spinner.First.WaitForAsync(new() { State = WaitForSelectorState.Hidden, Timeout = t });
        }
        catch (TimeoutException)
        {
            // Spinner may never have appeared (SSR pages) — that's OK
        }
    }

    /// <summary>
    /// Fills a Radzen text input identified by its placeholder attribute.
    /// </summary>
    public static async Task FillRadzenTextBoxAsync(this IPage page, string placeholder, string value)
    {
        await page.FillAsync($"input[placeholder='{placeholder}']", value);
    }

    /// <summary>
    /// Clicks a Radzen button by its visible text.
    /// </summary>
    public static async Task ClickRadzenButtonAsync(this IPage page, string text)
    {
        await page.ClickAsync($"button:has-text('{text}')");
    }

    /// <summary>
    /// Expects a locator to be visible with the default E2E timeout.
    /// </summary>
    public static async Task ExpectVisibleAsync(this ILocator locator)
    {
        await Assertions.Expect(locator).ToBeVisibleAsync(new() { Timeout = TestConstants.DefaultTimeout });
    }
}
