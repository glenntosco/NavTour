namespace NavTour.Shared.DTOs.Ai;

public record StepContent(string Title, string Content, string VoiceoverText);
public record TranslatableStep(int StepNumber, string Title, string Content, string VoiceoverText);
public record TranslatedStep(int StepNumber, string Title, string Content, string VoiceoverText);
public record StepSummary(int StepNumber, string? Title, string? Content, string? VoiceoverText);
public record DemoQualityScore(
    int OverallScore, int ContentScore, int FlowScore, int CompletenessScore, int EngagementScore,
    List<string> Strengths, List<string> Improvements, string Summary);

public record WriteContentRequest(string Title, string Context, string? Tone);
public record TranslateRequest(List<TranslatableStep> Steps, string TargetLanguage);
public record ScoreRequest(List<StepSummary> Steps, int FrameCount);
