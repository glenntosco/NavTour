using System.Net.Http.Json;
using NavTour.Shared.DTOs.Auth;

namespace NavTour.Client.Services;

public class AuthService
{
    private readonly HttpClient _http;
    private string? _accessToken;
    private Guid? _tenantId;

    public AuthService(HttpClient http)
    {
        _http = http;
    }

    public bool IsAuthenticated => _accessToken != null;
    public Guid? TenantId => _tenantId;

    public async Task<(bool Success, string? Error)> LoginAsync(string email, string password)
    {
        var response = await _http.PostAsJsonAsync("api/v1/auth/login", new LoginRequest(email, password));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return (false, error);
        }

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        _accessToken = result!.AccessToken;
        _tenantId = result.TenantId;
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
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
        _accessToken = result!.AccessToken;
        _tenantId = result.TenantId;
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        return (true, null);
    }

    public void Logout()
    {
        _accessToken = null;
        _tenantId = null;
        _http.DefaultRequestHeaders.Authorization = null;
    }
}
