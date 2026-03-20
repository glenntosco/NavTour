using NavTour.Shared.Models;

namespace NavTour.Server.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string fullName, string tempPassword, string loginUrl);
    Task SendLeadEmailAsync(string toEmail, string? leadName, string demoName, LeadEmailTemplate template);
}
