using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.Models;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/resources")]
public class ResourcesController : ControllerBase
{
    private readonly NavTourDbContext _db;

    public ResourcesController(NavTourDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Serve a captured resource by its SHA-256 hash. Public (like a CDN).
    /// </summary>
    [HttpGet("{hash}")]
    [AllowAnonymous]
    [ResponseCache(Duration = 31536000, Location = ResponseCacheLocation.Any)] // 1 year — content-addressed
    public async Task<IActionResult> Get(string hash)
    {
        var resource = await _db.CapturedResources.FindAsync(hash);
        if (resource == null) return NotFound();
        return File(resource.Data, resource.ContentType);
    }

    /// <summary>
    /// Upload a captured resource. Deduplicates by hash.
    /// </summary>
    [HttpPost]
    [Authorize]
    [RequestSizeLimit(10_000_000)] // 10MB max per resource
    public async Task<IActionResult> Upload()
    {
        var hash = Request.Headers["X-Resource-Hash"].ToString();
        if (string.IsNullOrEmpty(hash) || hash.Length > 64)
            return BadRequest(new { error = "X-Resource-Hash header is required (SHA-256 hex)" });

        var contentType = Request.ContentType ?? "application/octet-stream";

        // Skip if already exists (deduplication)
        if (await _db.CapturedResources.AnyAsync(r => r.Hash == hash))
            return Ok(new { hash, exists = true });

        using var ms = new MemoryStream();
        await Request.Body.CopyToAsync(ms);

        _db.CapturedResources.Add(new CapturedResource
        {
            Hash = hash,
            ContentType = contentType,
            Data = ms.ToArray(),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return Ok(new { hash, exists = false });
    }

    /// <summary>
    /// Batch check which hashes already exist (to skip uploading them).
    /// </summary>
    [HttpPost("check")]
    [Authorize]
    public async Task<IActionResult> CheckExisting([FromBody] List<string> hashes)
    {
        if (hashes == null || hashes.Count == 0)
            return Ok(new { existing = Array.Empty<string>() });

        var existing = await _db.CapturedResources
            .Where(r => hashes.Contains(r.Hash))
            .Select(r => r.Hash)
            .ToListAsync();

        return Ok(new { existing });
    }
}
