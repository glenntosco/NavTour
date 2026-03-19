using Azure;
using Azure.Communication.Email;

namespace NavTour.Server.Services;

public class EmailService : IEmailService
{
    private readonly EmailClient? _client;
    private readonly string _senderAddress;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _logger = logger;
        _senderAddress = config["AzureCommunication:SenderAddress"] ?? "";

        var connectionString = config["AzureCommunication:ConnectionString"];
        if (!string.IsNullOrEmpty(connectionString))
        {
            _client = new EmailClient(connectionString);
        }
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName, string tempPassword, string loginUrl)
    {
        if (_client == null)
        {
            _logger.LogWarning("Email client not configured — skipping welcome email to {Email}", toEmail);
            return;
        }

        var displayName = string.IsNullOrWhiteSpace(fullName) ? "there" : fullName;

        var htmlBody = $"""
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
                <div style="text-align:center;margin-bottom:32px">
                    <h1 style="color:#4361ee;font-size:24px;margin:0">NavTour</h1>
                </div>
                <h2 style="color:#0B1929;font-size:20px;margin:0 0 8px">Welcome to the team, {displayName}!</h2>
                <p style="color:#64748B;font-size:15px;line-height:1.6;margin:0 0 24px">
                    You've been invited to join a workspace on NavTour. Use the credentials below to sign in.
                </p>
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin-bottom:24px">
                    <p style="margin:0 0 8px;font-size:14px;color:#64748B">Email</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#0B1929;font-weight:600">{toEmail}</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#64748B">Temporary Password</p>
                    <p style="margin:0;font-size:15px;color:#0B1929;font-weight:600;font-family:monospace">{tempPassword}</p>
                </div>
                <div style="text-align:center;margin-bottom:24px">
                    <a href="{loginUrl}" style="display:inline-block;background:#4361ee;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:15px;font-weight:600">Sign In to NavTour</a>
                </div>
                <p style="color:#94A3B8;font-size:13px;line-height:1.5;margin:0">
                    We recommend changing your password after your first login. If you didn't expect this invitation, you can safely ignore this email.
                </p>
            </div>
            """;

        try
        {
            var message = new EmailMessage(
                senderAddress: _senderAddress,
                recipientAddress: toEmail,
                content: new EmailContent("You've been invited to NavTour")
                {
                    Html = htmlBody
                });

            await _client.SendAsync(WaitUntil.Started, message);
            _logger.LogInformation("Welcome email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", toEmail);
        }
    }
}
