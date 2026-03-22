using System.Text.Json;

namespace NavTour.Server.Services;

public class ElevenLabsService
{
    private readonly HttpClient _http;
    private readonly string _voiceId;
    private readonly ILogger<ElevenLabsService> _logger;

    public ElevenLabsService(HttpClient httpClient, IConfiguration config, ILogger<ElevenLabsService> logger)
    {
        _http = httpClient;
        _http.BaseAddress = new Uri("https://api.elevenlabs.io/");
        _http.DefaultRequestHeaders.Add("xi-api-key", config["ElevenLabs:ApiKey"]);
        _voiceId = config["ElevenLabs:VoiceId"] ?? "21m00Tcm4TlvDq8ikWAM";
        _logger = logger;
    }

    public async Task<byte[]?> GenerateSpeechAsync(string text, string? voiceId = null)
    {
        var id = voiceId ?? _voiceId;
        _logger.LogInformation("Generating speech for {Length} chars with voice {VoiceId}", text.Length, id);
        var body = new { text, model_id = "eleven_multilingual_v2" };
        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        try
        {
            var response = await _http.PostAsync($"v1/text-to-speech/{id}", content);
            if (response.IsSuccessStatusCode)
            {
                var bytes = await response.Content.ReadAsByteArrayAsync();
                _logger.LogInformation("Speech generated: {Bytes} bytes", bytes.Length);
                return bytes;
            }

            _logger.LogWarning("ElevenLabs returned {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ElevenLabs exception");
            return null;
        }
    }

    public async Task<List<VoiceInfo>> GetVoicesAsync()
    {
        try
        {
            var response = await _http.GetAsync("v1/voices");
            if (!response.IsSuccessStatusCode) return [];

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var voices = new List<VoiceInfo>();

            foreach (var v in doc.RootElement.GetProperty("voices").EnumerateArray())
            {
                var labels = v.TryGetProperty("labels", out var l) ? l : default;
                voices.Add(new VoiceInfo(
                    v.GetProperty("voice_id").GetString()!,
                    v.GetProperty("name").GetString()!,
                    labels.ValueKind == JsonValueKind.Object && labels.TryGetProperty("gender", out var g) ? g.GetString() : null
                ));
            }

            return voices;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch ElevenLabs voices");
            return [];
        }
    }

    public record VoiceInfo(string Id, string Name, string? Gender);
}
