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
    private bool _initialized;

    public AuthService(HttpClient http, IJSRuntime js)
    {
        _http = http;
        _js = js;
    }

    public bool IsAuthenticated => _isAuthenticated;
    public Guid? TenantId => _tenantId;

    public async Task TryRestoreAsync()
    {
        if (_isAuthenticated) return;

        // Try reading JWT from browser cookie via JS interop
        try
        {
            var token = await _js.InvokeAsync<string>("authCheck.getToken");
            if (!string.IsNullOrEmpty(token))
            {
                _http.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                _isAuthenticated = true;
                _initialized = true;
                return;
            }
        }
        catch (InvalidOperationException)
        {
            // JS not available (SSR prerender) — check if HttpClient already has Bearer from Program.cs
            if (_http.DefaultRequestHeaders.Authorization?.Parameter != null)
            {
                _isAuthenticated = true;
                return;
            }

            // During SSR prerender, assume authenticated to avoid redirect.
            // The real check happens when the circuit connects.
            if (!_initialized)
            {
                _isAuthenticated = true;
                return;
            }
        }

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
        _initialized = true;
        _tenantId = result!.TenantId;

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
        _initialized = true;
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
        try { await _http.PostAsync("api/v1/auth/logout", null); } catch { }
    }
}
