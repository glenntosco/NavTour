using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.DTOs.Annotations;
using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public class AnnotationService : IAnnotationService
{
    private readonly NavTourDbContext _db;

    public AnnotationService(NavTourDbContext db)
    {
        _db = db;
    }

    public async Task<List<AnnotationResponse>> GetByStepAsync(Guid stepId)
    {
        return await _db.Annotations
            .Where(a => a.StepId == stepId)
            .Select(a => new AnnotationResponse(
                a.Id, a.Type, a.Title, a.Content,
                a.PositionX, a.PositionY, a.Width, a.Height, a.Style))
            .ToListAsync();
    }

    public async Task<AnnotationResponse> CreateAsync(Guid stepId, CreateAnnotationRequest request)
    {
        var step = await _db.Steps.FindAsync(stepId);
        var annotation = new Annotation
        {
            StepId = stepId,
            Type = request.Type,
            Title = request.Title,
            Content = request.Content,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Height = request.Height,
            Style = request.Style
        };

        _db.Annotations.Add(annotation);
        await _db.SaveChangesAsync();

        return new AnnotationResponse(annotation.Id, annotation.Type, annotation.Title,
            annotation.Content, annotation.PositionX, annotation.PositionY,
            annotation.Width, annotation.Height, annotation.Style);
    }

    public async Task<AnnotationResponse?> UpdateAsync(Guid id, CreateAnnotationRequest request)
    {
        var annotation = await _db.Annotations.FindAsync(id);
        if (annotation == null) return null;

        annotation.Type = request.Type;
        annotation.Title = request.Title;
        annotation.Content = request.Content;
        annotation.PositionX = request.PositionX;
        annotation.PositionY = request.PositionY;
        annotation.Width = request.Width;
        annotation.Height = request.Height;
        annotation.Style = request.Style;

        await _db.SaveChangesAsync();

        return new AnnotationResponse(annotation.Id, annotation.Type, annotation.Title,
            annotation.Content, annotation.PositionX, annotation.PositionY,
            annotation.Width, annotation.Height, annotation.Style);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var annotation = await _db.Annotations.FindAsync(id);
        if (annotation == null) return false;

        annotation.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }
}
