using System.Text.Json;
using NavTour.Shared.DTOs.Ai;

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

    public async Task<StepContent?> GenerateStepContentAsync(string title, string context, string tone = "professional")
    {
        var systemPrompt = @$"You are a UX copywriter for interactive product demos. Write tooltip/step content for product tours.

Tone: {tone}

Given a step title and context about what the user is looking at, write:
1. An improved title (5-10 words, action-oriented)
2. Body content (1-2 sentences, helpful and concise)
3. Voiceover script (1-3 sentences, conversational narration)

Return ONLY a JSON object with: title, content, voiceoverText";

        var body = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 500,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = $"Step title: {title}\nContext: {context}" }
            }
        };

        try
        {
            var json = JsonSerializer.Serialize(body);
            var httpContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _http.PostAsync("v1/messages", httpContent);

            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();
            if (string.IsNullOrEmpty(text)) return null;

            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('{');
                var end = text.LastIndexOf('}');
                if (start >= 0 && end > start) text = text[start..(end + 1)];
            }

            return JsonSerializer.Deserialize<StepContent>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate step content");
            return null;
        }
    }

    public async Task<List<TranslatedStep>?> TranslateStepsAsync(List<TranslatableStep> steps, string targetLanguage)
    {
        _logger.LogInformation("Translating {Count} steps to {Language}", steps.Count, targetLanguage);

        var systemPrompt = @$"You are a professional translator for product demo content. Translate the following step titles, content, and voiceover text to {targetLanguage}.

Maintain the same tone and style. Keep technical terms that shouldn't be translated.

Return a JSON array where each element has:
- stepNumber: integer (same as input)
- title: string (translated)
- content: string (translated)
- voiceoverText: string (translated)

Return ONLY the JSON array.";

        var stepsJson = JsonSerializer.Serialize(steps);

        var body = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 4096,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = stepsJson }
            }
        };

        try
        {
            var json = JsonSerializer.Serialize(body);
            var httpContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _http.PostAsync("v1/messages", httpContent);

            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();
            if (string.IsNullOrEmpty(text)) return null;

            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('[');
                var end = text.LastIndexOf(']');
                if (start >= 0 && end > start) text = text[start..(end + 1)];
            }

            return JsonSerializer.Deserialize<List<TranslatedStep>>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to translate steps");
            return null;
        }
    }

    public async Task<DemoQualityScore?> ScoreDemoQualityAsync(List<StepSummary> steps, int frameCount)
    {
        _logger.LogInformation("Scoring demo quality for {Count} steps", steps.Count);

        var systemPrompt = @"You are a demo quality analyst. Evaluate interactive product demos and provide a quality score with actionable feedback.

Score the demo on these criteria (each 0-100):
1. Content Quality — Are titles clear and action-oriented? Is content helpful?
2. Flow — Does the step order make sense? Is there a logical progression?
3. Completeness — Are there enough steps to cover the feature? Too many or too few?
4. Engagement — Would a viewer stay engaged? Is the pacing right?

Return ONLY a JSON object with:
- overallScore: number (0-100, weighted average)
- contentScore: number (0-100)
- flowScore: number (0-100)
- completenessScore: number (0-100)
- engagementScore: number (0-100)
- strengths: string[] (2-3 bullet points)
- improvements: string[] (2-3 actionable suggestions)
- summary: string (1-2 sentence overall assessment)";

        var stepsJson = JsonSerializer.Serialize(steps);

        var body = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 1000,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = $"Demo has {frameCount} captured screens and {steps.Count} steps:\n\n{stepsJson}" }
            }
        };

        try
        {
            var json = JsonSerializer.Serialize(body);
            var httpContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _http.PostAsync("v1/messages", httpContent);

            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();
            if (string.IsNullOrEmpty(text)) return null;

            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('{');
                var end = text.LastIndexOf('}');
                if (start >= 0 && end > start) text = text[start..(end + 1)];
            }

            return JsonSerializer.Deserialize<DemoQualityScore>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to score demo quality");
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
