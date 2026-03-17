using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Infrastructure.Data;
using NavTour.Shared.Entities;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[AllowAnonymous]
public class ContactController(NavTourDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactSubmissionRequest request)
    {
        var submission = new ContactSubmission
        {
            Type = request.Type ?? "Contact",
            Name = request.Name ?? "",
            Email = request.Email,
            Company = request.Company,
            Message = request.Message
        };

        db.ContactSubmissions.Add(submission);
        await db.SaveChangesAsync();

        return Ok(new { message = "Received" });
    }
}

public record ContactSubmissionRequest(
    string Email,
    string? Name = null,
    string? Company = null,
    string? Message = null,
    string? Type = "Contact"
);
