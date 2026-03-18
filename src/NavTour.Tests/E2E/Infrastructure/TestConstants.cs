namespace NavTour.Tests.E2E.Infrastructure;

public static class TestConstants
{
    public const string BaseUrl = "http://localhost:5017";
    public const int DefaultTimeout = 30_000;
    public const string Password = "E2eTest123!@#";
    public const string FullName = "E2E Tester";

    private static readonly long RunId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public static string UniqueEmail() => $"e2e-{RunId}@navtour.test";
    public static string UniqueCompanyName() => $"E2E Corp {RunId}";
}
