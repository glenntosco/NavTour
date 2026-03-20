using Azure;
using Azure.Communication.Email;
using NavTour.Shared.Models;

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

    public async Task SendLeadEmailAsync(string toEmail, string? leadName, string demoName, LeadEmailTemplate template)
    {
        if (_client == null)
        {
            _logger.LogWarning("Email client not configured — skipping lead email to {Email}", toEmail);
            return;
        }

        var displayName = string.IsNullOrWhiteSpace(leadName) ? "there" : leadName;

        // Resolve template variables
        string Resolve(string text) => text
            .Replace("{{name}}", displayName)
            .Replace("{{email}}", toEmail)
            .Replace("{{demo_name}}", demoName)
            .Replace("{{company}}", "");

        var subject = Resolve(template.Subject);
        var heading = Resolve(template.Heading);
        var body = Resolve(template.Body);
        var ctaText = Resolve(template.CtaText);
        var accent = template.AccentColor;

        var ctaHtml = !string.IsNullOrWhiteSpace(template.CtaUrl)
            ? $"""
                <div style="text-align:center;margin:32px 0 24px">
                    <a href="{template.CtaUrl}" style="display:inline-block;background:{accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.2px">{ctaText}</a>
                </div>
              """
            : "";

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
                <div style="max-width:600px;margin:0 auto;padding:40px 20px">
                    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.05)">
                        <div style="height:4px;background:linear-gradient(90deg,{accent},{accent}dd)"></div>
                        <div style="padding:40px 36px">
                            <div style="text-align:center;margin-bottom:28px">
                                <div style="display:inline-block;width:44px;height:44px;background:{accent};border-radius:10px;line-height:44px;text-align:center">
                                    <span style="color:#fff;font-size:20px;font-weight:700">N</span>
                                </div>
                            </div>
                            <h1 style="color:#0B1929;font-size:22px;font-weight:700;text-align:center;margin:0 0 16px;line-height:1.3">{heading}</h1>
                            <div style="color:#475569;font-size:15px;line-height:1.7;text-align:center;margin:0 0 8px;white-space:pre-line">{body}</div>
                            {ctaHtml}
                        </div>
                        <div style="background:#F8FAFC;padding:20px 36px;border-top:1px solid #E2E8F0">
                            <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;line-height:1.5">
                                You received this email because you explored a demo. If you didn't expect this, you can safely ignore it.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;

        try
        {
            var message = new EmailMessage(
                senderAddress: _senderAddress,
                recipientAddress: toEmail,
                content: new EmailContent(subject) { Html = htmlBody });

            await _client.SendAsync(WaitUntil.Started, message);
            _logger.LogInformation("Lead email sent to {Email} for demo {Demo}", toEmail, demoName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send lead email to {Email}", toEmail);
        }
    }
}
