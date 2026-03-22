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
        var body = new { text, model_id = "eleven_monolingual_v1" };
        var json = System.Text.Json.JsonSerializer.Serialize(body);
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
            Console.WriteLine($"ElevenLabs exception: {ex.Message}");
            return null;
        }
    }
}
