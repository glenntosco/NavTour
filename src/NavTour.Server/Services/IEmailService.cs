namespace NavTour.Server.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string fullName, string tempPassword, string loginUrl);
}
