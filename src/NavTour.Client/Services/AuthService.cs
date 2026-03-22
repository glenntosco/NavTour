using System.Net.Http.Json;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Client.Services;

public class AuthService
{
    private readonly HttpClient _http;
    private bool _isAuthenticated;
    private Guid? _tenantId;

    public AuthService(HttpClient http)
    {
        _http = http;
    }

    public bool IsAuthenticated => _isAuthenticated;
    public Guid? TenantId => _tenantId;

    /// <summary>
    /// Check if the auth cookie is valid by making a lightweight API call.
    /// </summary>
    public async Task TryRestoreAsync()
    {
        if (_isAuthenticated) return;

        try
        {
            // Quick auth check — cookie is forwarded by the HttpClient
            var response = await _http.GetAsync("api/v1/demos");
            if (response.IsSuccessStatusCode)
            {
                _isAuthenticated = true;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                _isAuthenticated = false;
            }
            // Any other status (500, timeout) — don't change auth state
        }
        catch
        {
            // Network error during SSR prerender — don't assume logged out
        }
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
        return (true, null);
    }

    public async Task LogoutAsync()
    {
        _isAuthenticated = false;
        _tenantId = null;
        await _http.PostAsync("api/v1/auth/logout", null);
    }
}
