using System.Net.Http.Json;
using Microsoft.JSInterop;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Client.Services;

public class AuthService
{
    private readonly HttpClient _http;
    private readonly IJSRuntime _js;
    private bool _isAuthenticated;
    private Guid? _tenantId;

    public AuthService(HttpClient http, IJSRuntime js)
    {
        _http = http;
        _js = js;
    }

    public bool IsAuthenticated => _isAuthenticated;
    public Guid? TenantId => _tenantId;

    /// <summary>
    /// Check if the auth cookie exists in the browser.
    /// Uses JS interop to read the cookie directly — works after page refresh.
    /// </summary>
    private bool _jsAvailable;

    public async Task TryRestoreAsync()
    {
        if (_isAuthenticated) return;

        // Try JS interop first (works after circuit connects)
        if (!_jsAvailable)
        {
            try
            {
                // This will throw during SSR prerender
                var token = await _js.InvokeAsync<string>("authCheck.getToken");
                _jsAvailable = true;
                if (!string.IsNullOrEmpty(token))
                {
                    _http.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                    _isAuthenticated = true;
                    return;
                }
            }
            catch (InvalidOperationException)
            {
                // SSR prerender — JS not available yet. DO NOT redirect to login.
                // Set _isAuthenticated true temporarily to prevent redirect.
                // The real check will happen when the circuit connects.
                _isAuthenticated = true;
                return;
            }
        }
        else
        {
            // Circuit is connected, JS is available
            try
            {
                var token = await _js.InvokeAsync<string>("authCheck.getToken");
                if (!string.IsNullOrEmpty(token))
                {
                    _http.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                    _isAuthenticated = true;
                    return;
                }
            }
            catch { }
        }

        // No cookie found — actually not authenticated
        _isAuthenticated = false;
    }

    public async Task<(bool Success, string? Error)> LoginAsync(string email, string password)
    {
        var response = await _http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(email, password));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return (false, error);
        }

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        _isAuthenticated = true;
        _tenantId = result!.TenantId;

        // Set Bearer header for future API calls in this circuit
        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", result.AccessToken);

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RegisterAsync(string email, string password, string companyName, string fullName)
    {
        var response = await _http.PostAsJsonAsync("api/v1/auth/register",
            new RegisterRequest(email, password, companyName, fullName));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return (false, error);
        }

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        _isAuthenticated = true;
        _tenantId = result!.TenantId;

        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", result.AccessToken);

        return (true, null);
    }

    public async Task LogoutAsync()
    {
        _isAuthenticated = false;
        _tenantId = null;
        _http.DefaultRequestHeaders.Authorization = null;
        await _http.PostAsync("api/v1/auth/logout", null);
    }
}
