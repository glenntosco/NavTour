using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.JSInterop;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Client.Services;

public class AuthService
{
    private readonly HttpClient _http;
    private readonly IJSRuntime _js;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private bool _isAuthenticated;
    private Guid? _tenantId;
    private bool _initialized;

    public AuthService(HttpClient http, IJSRuntime js, IHttpContextAccessor httpContextAccessor)
    {
        _http = http;
        _js = js;
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated => _isAuthenticated;
    public Guid? TenantId => _tenantId;

    public async Task TryRestoreAsync()
    {
        if (_isAuthenticated) return;

        // Method 1: Check HttpContext cookie (works during SSR)
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Request.Cookies.TryGetValue("navtour_auth", out var cookieToken) == true
            && !string.IsNullOrEmpty(cookieToken))
        {
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", cookieToken);
            _isAuthenticated = true;
            return;
        }

        // Method 2: Check HttpClient already has Bearer (set by Program.cs or previous login)
        if (_http.DefaultRequestHeaders.Authorization?.Parameter != null)
        {
            _isAuthenticated = true;
            return;
        }

        // Method 3: Try JS interop (works after circuit connects)
        try
        {
            var jsToken = await _js.InvokeAsync<string>("authCheck.getToken");
            if (!string.IsNullOrEmpty(jsToken))
            {
                _http.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jsToken);
                _isAuthenticated = true;
                return;
            }
        }
        catch { /* JS not available during SSR */ }

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
