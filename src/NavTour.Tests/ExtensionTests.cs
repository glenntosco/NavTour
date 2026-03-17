using System.Net.Http.Json;
using System.Text.Json;
using NavTour.Shared.DTOs.Auth;
using NavTour.Shared.DTOs.Frames;

namespace NavTour.Tests;

/// <summary>
/// API and integration tests for NavTour.
/// Extension-specific tests (toolbar, auto-capture) use Node.js Playwright
/// in src/NavTour.Extension/test-final.mjs since .NET Playwright lacks MV3 service worker support.
/// </summary>
public class ApiTests
{
    private const string Server = "http://localhost:5017";
    private const string Email = "admin@navtour.io";
    private const string Password = "NavTour123!";

    private static readonly string ExtensionPath =
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "NavTour.Extension"));

    [Fact]
    public void ExtensionFilesExist()
    {
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "manifest.json")), "manifest.json missing");
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "dist", "popup.js")), "dist/popup.js missing");
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "dist", "background.js")), "dist/background.js missing");
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "icons", "icon128.png")), "icons/icon128.png missing");
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "popup.html")), "popup.html missing");
        Assert.True(File.Exists(Path.Combine(ExtensionPath, "popup.css")), "popup.css missing");
    }

    [Fact]
    public async Task LoginReturnsTokenAndCookie()
    {
        using var handler = new HttpClientHandler();
        using var http = new HttpClient(handler) { BaseAddress = new Uri(Server) };

        var res = await http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(Email, Password));

        Assert.True(res.IsSuccessStatusCode);

        var login = await res.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrEmpty(login!.AccessToken));
        Assert.NotEqual(Guid.Empty, login.TenantId);

        // Cookie should be set
        var cookies = handler.CookieContainer.GetCookies(new Uri(Server));
        Assert.True(cookies.Count > 0 || res.Headers.Contains("Set-Cookie"),
            "Auth cookie should be set on login");
    }

    [Fact]
    public async Task CookieAuthenticatesSubsequentRequests()
    {
        using var handler = new HttpClientHandler();
        using var http = new HttpClient(handler) { BaseAddress = new Uri(Server) };

        // Login (sets cookie)
        await http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(Email, Password));

        // Use cookie (no Bearer header) to access protected endpoint
        var res = await http.GetAsync("api/v1/demos");
        Assert.True(res.IsSuccessStatusCode, "Cookie should authenticate the demos endpoint");
    }

    [Fact]
    public async Task BearerTokenStillWorks()
    {
        using var http = new HttpClient { BaseAddress = new Uri(Server) };
        var loginRes = await http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(Email, Password));
        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();

        // Use Bearer token explicitly
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", login!.AccessToken);
        var res = await http.GetAsync("api/v1/demos");
        Assert.True(res.IsSuccessStatusCode, "Bearer token should still work alongside cookie auth");
    }

    [Fact]
    public async Task CreateDemoAndUploadFrame()
    {
        using var http = new HttpClient { BaseAddress = new Uri(Server) };
        var loginRes = await http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(Email, Password));
        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", login!.AccessToken);

        // Create demo
        var demoName = $"Test {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var createRes = await http.PostAsJsonAsync("api/v1/demos", new { name = demoName });
        Assert.True(createRes.IsSuccessStatusCode);
        var demo = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var demoId = demo.GetProperty("id").GetString()!;

        // Upload HTML frame
        using var content = new MultipartFormDataContent();
        var html = "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Captured Page</h1></body></html>";
        content.Add(new StreamContent(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(html))), "file", "test.html");
        var uploadRes = await http.PostAsync($"api/v1/demos/{demoId}/frames", content);
        Assert.True(uploadRes.IsSuccessStatusCode);

        var frame = await uploadRes.Content.ReadFromJsonAsync<FrameResponse>();
        Assert.NotNull(frame);
        Assert.NotEqual(Guid.Empty, frame!.Id);

        // Verify frame has content
        var detailRes = await http.GetAsync($"api/v1/frames/{frame.Id}");
        Assert.True(detailRes.IsSuccessStatusCode);
        var detail = await detailRes.Content.ReadFromJsonAsync<JsonElement>();
        var htmlContent = detail.GetProperty("htmlContent").GetString();
        Assert.False(string.IsNullOrEmpty(htmlContent));
        Assert.Contains("Captured Page", htmlContent);
    }

    [Fact]
    public async Task LogoutClearsCookie()
    {
        using var handler = new HttpClientHandler();
        using var http = new HttpClient(handler) { BaseAddress = new Uri(Server) };

        // Login
        await http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(Email, Password));
        var authedRes = await http.GetAsync("api/v1/demos");
        Assert.True(authedRes.IsSuccessStatusCode);

        // Logout
        await http.PostAsync("api/v1/auth/logout", null);

        // Should no longer be authenticated
        var unauthedRes = await http.GetAsync("api/v1/demos");
        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, unauthedRes.StatusCode);
    }
}
