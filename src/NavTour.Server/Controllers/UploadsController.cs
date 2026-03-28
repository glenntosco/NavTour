using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    [HttpPost("image")]
    [RequestSizeLimit(2_000_000)] // 2MB max for base64 (keeps DB reasonable)
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var mimeType = ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => null
        };

        if (mimeType == null)
            return BadRequest("Invalid image format. Supported: PNG, JPG, SVG, WebP, GIF");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var base64 = Convert.ToBase64String(ms.ToArray());
        var dataUrl = $"data:{mimeType};base64,{base64}";

        return Ok(new { url = dataUrl });
    }
}
