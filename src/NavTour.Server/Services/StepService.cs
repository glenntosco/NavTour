using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.DTOs.Steps;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class StepService : IStepService
{
    private readonly NavTourDbContext _db;
    private readonly ElevenLabsService _elevenLabs;

    public StepService(NavTourDbContext db, ElevenLabsService elevenLabs)
    {
        _db = db;
        _elevenLabs = elevenLabs;
    }

    public async Task<List<StepResponse>> GetAllByDemoAsync(Guid demoId)
    {
        return await _db.Steps
            .Where(s => s.DemoId == demoId)
            .Include(s => s.Annotations)
            .OrderBy(s => s.StepNumber)
            .Select(s => new StepResponse(
                s.Id, s.FrameId, s.StepNumber, s.ClickTargetSelector,
                s.NavigationAction, s.NavigationTarget,
                s.Annotations.Where(a => !a.IsDeleted).Select(a => new AnnotationResponse(
                    a.Id, a.Type, a.Title, a.Content,
                    a.PositionX, a.PositionY, a.Width, a.Height, a.Style,
                    a.TargetSelector, a.ArrowDirection, a.BadgeNumber
                )).ToList(),
                s.TriggerType, s.TriggerDurationMs, s.BackdropLevel, s.VoiceoverText))
            .ToListAsync();
    }

    public async Task<bool> UpdateStepsAsync(Guid demoId, UpdateStepsRequest request)
    {
        // Remove existing steps for this demo, but cache voiceover audio by text to avoid re-generating
        var existingSteps = await _db.Steps
            .Where(s => s.DemoId == demoId)
            .Include(s => s.Annotations)
            .ToListAsync();

        // Build lookup: VoiceoverText -> VoiceoverAudio for reuse
        var existingAudioByText = existingSteps
            .Where(s => s.VoiceoverText != null && s.VoiceoverAudio != null)
            .GroupBy(s => s.VoiceoverText!)
            .ToDictionary(g => g.Key, g => g.First().VoiceoverAudio);

        _db.Steps.RemoveRange(existingSteps);

        // Create new steps from request
        foreach (var stepDto in request.Steps)
        {
            // Resolve voiceover audio
            byte[]? voiceoverAudio = null;
            if (!string.IsNullOrEmpty(stepDto.VoiceoverText))
            {
                // Reuse existing audio if text hasn't changed, otherwise generate new
                if (existingAudioByText.TryGetValue(stepDto.VoiceoverText, out var cached))
                    voiceoverAudio = cached;
                else
                    voiceoverAudio = await _elevenLabs.GenerateSpeechAsync(stepDto.VoiceoverText);
            }

            var step = new Step
            {
                Id = stepDto.Id ?? Guid.NewGuid(),
                DemoId = demoId,
                FrameId = stepDto.FrameId,
                StepNumber = stepDto.StepNumber,
                ClickTargetSelector = stepDto.ClickTargetSelector,
                NavigationAction = stepDto.NavigationAction,
                NavigationTarget = stepDto.NavigationTarget,
                TriggerType = stepDto.TriggerType,
                TriggerDurationMs = stepDto.TriggerDurationMs,
                BackdropLevel = stepDto.BackdropLevel,
                VoiceoverText = stepDto.VoiceoverText,
                VoiceoverAudio = voiceoverAudio,
                Annotations = stepDto.Annotations.Select(a => new Annotation
                {
                    Id = a.Id ?? Guid.NewGuid(),
                    Type = a.Type,
                    Title = a.Title,
                    Content = a.Content,
                    PositionX = a.PositionX,
                    PositionY = a.PositionY,
                    Width = a.Width,
                    Height = a.Height,
                    Style = a.Style,
                    TargetSelector = a.TargetSelector,
                    ArrowDirection = a.ArrowDirection,
                    BadgeNumber = a.BadgeNumber
                }).ToList()
            };
            _db.Steps.Add(step);
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
