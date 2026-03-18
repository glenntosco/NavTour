using System.Net.Http.Json;
using Microsoft.Playwright;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Tests.E2E.Infrastructure;

public class PlaywrightFixture : IAsyncLifetime
{
    public IPlaywright Playwright { get; private set; } = null!;
    public IBrowser Browser { get; private set; } = null!;

    public string TestEmail { get; private set; } = "";
    public string AccessToken { get; private set; } = "";

    public async Task InitializeAsync()
    {
        Playwright = await Microsoft.Playwright.Playwright.CreateAsync();
        Browser = await Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true,
            SlowMo = 50
        });

        // Register + login a test user via API
        TestEmail = TestConstants.UniqueEmail();

        using var http = new HttpClient { BaseAddress = new Uri(TestConstants.BaseUrl) };
        var registerRes = await http.PostAsJsonAsync("api/v1/auth/register",
            new RegisterRequest(TestEmail, TestConstants.Password, TestConstants.UniqueCompanyName(), TestConstants.FullName));
        registerRes.EnsureSuccessStatusCode();

        var loginRes = await http.PostAsJsonAsync("api/v1/auth/login",
            new LoginRequest(TestEmail, TestConstants.Password));
        loginRes.EnsureSuccessStatusCode();
        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        AccessToken = login!.AccessToken;
    }

    /// <summary>
    /// Creates a browser context with the navtour_auth cookie injected.
    /// The server reads this cookie as the JWT token for authentication.
    /// </summary>
    public async Task<IBrowserContext> CreateAuthenticatedContextAsync()
    {
        var context = await Browser.NewContextAsync();
        await context.AddCookiesAsync([
            new Cookie
            {
                Name = "navtour_auth",
                Value = AccessToken,
                Domain = "localhost",
                Path = "/",
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteAttribute.Lax
            }
        ]);
        return context;
    }

    public async Task DisposeAsync()
    {
        await Browser.DisposeAsync();
        Playwright.Dispose();
    }
}

[CollectionDefinition("Playwright")]
public class PlaywrightCollection : ICollectionFixture<PlaywrightFixture> { }
