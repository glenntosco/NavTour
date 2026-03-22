using System.Text.Json;

namespace NavTour.Server.Services;

public class AnthropicService
{
    private readonly HttpClient _http;
    private readonly ILogger<AnthropicService> _logger;

    public AnthropicService(HttpClient httpClient, IConfiguration config, ILogger<AnthropicService> logger)
    {
        _http = httpClient;
        _http.BaseAddress = new Uri("https://api.anthropic.com/");
        _http.DefaultRequestHeaders.Add("x-api-key", config["Anthropic:ApiKey"]);
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _logger = logger;
    }

    public async Task<List<GeneratedStep>?> GenerateTourAsync(List<FrameContent> frames, string? userPrompt = null)
    {
        _logger.LogInformation("Generating tour for {Count} frames", frames.Count);

        var systemPrompt = @"You are an expert UX guide writer for interactive product demos. You analyze web application screens and create guided tours that help users understand the product.

Given the HTML content of web application screens, generate a step-by-step interactive tour. For each screen/frame, create exactly ONE step with ONE NumberedTooltip annotation pointing to the most important UI element on that screen.

Return a JSON array where each element has:
- stepNumber: integer (1-based)
- frameIndex: integer (0-based, matching the order of frames provided)
- title: string (5-10 words, action-oriented, e.g. ""Sign in to your account"")
- content: string (1-2 sentences explaining what the user should do or notice)
- positionX: number (0-100, percentage from left where the tooltip should point)
- positionY: number (0-100, percentage from top where the tooltip should point)
- arrowDirection: string (""top"", ""bottom"", ""left"", or ""right"" — which direction the arrow points FROM the tooltip TO the element)
- voiceoverText: string (natural conversational script, 1-3 sentences, as if narrating to the user)

IMPORTANT RULES:
- Position the tooltip NEAR the most relevant UI element, not on top of it
- Arrow should point FROM the tooltip TOWARD the element
- If the important element is in the center, position tooltip above (arrowDirection: ""bottom"")
- If the element is on the left, position tooltip to the right (arrowDirection: ""left"")
- Voiceover should be warm, professional, and conversational
- Title should be an action or description, not a generic label
- Content should tell the user WHY this element matters

Return ONLY the JSON array, no markdown, no explanation.";

        var userContent = new List<object>();

        // Add each frame's HTML as text content
        for (int i = 0; i < frames.Count; i++)
        {
            userContent.Add(new { type = "text", text = $"--- FRAME {i + 1} of {frames.Count} (frameIndex: {i}) ---\n\n{TruncateHtml(frames[i].HtmlContent, 15000)}" });
        }

        // Add user's custom prompt if provided
        var promptText = userPrompt ?? "Generate an onboarding tour for a new user seeing this application for the first time.";
        userContent.Add(new { type = "text", text = promptText });

        var body = new
        {
            model = "claude-opus-4-20250514",
            max_tokens = 4096,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = userContent }
            }
        };

        try
        {
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _http.PostAsync("v1/messages", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Anthropic API returned {Status}: {Error}", response.StatusCode, error);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);

            // Extract the text content from Claude's response
            var textContent = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(textContent))
                return null;

            // Parse the JSON array from Claude's response
            // Claude might wrap it in ```json ... ``` so strip that
            textContent = textContent.Trim();
            if (textContent.StartsWith("```"))
            {
                var start = textContent.IndexOf('[');
                var end = textContent.LastIndexOf(']');
                if (start >= 0 && end > start)
                    textContent = textContent[start..(end + 1)];
            }

            var steps = JsonSerializer.Deserialize<List<GeneratedStep>>(textContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            _logger.LogInformation("Tour generated: {Count} steps", steps?.Count ?? 0);
            return steps;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate tour via Anthropic");
            return null;
        }
    }

    private static string TruncateHtml(string html, int maxLength)
    {
        if (string.IsNullOrEmpty(html) || html.Length <= maxLength)
            return html;
        return html[..maxLength] + "\n<!-- truncated -->";
    }
}

public record FrameContent(Guid FrameId, string HtmlContent);

public record GeneratedStep(
    int StepNumber,
    int FrameIndex,
    string Title,
    string Content,
    double PositionX,
    double PositionY,
    string ArrowDirection,
    string VoiceoverText);
