namespace NavTour.Shared.Entities;

public class ContactSubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = "Contact"; // "Contact" or "Newsletter"
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Company { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
