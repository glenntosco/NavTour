namespace NavTour.Shared.Enums;

public enum TriggerType
{
    ButtonClick = 0,    // Default — user clicks Next/Back buttons
    ElementClick = 1,   // Wait for user to click a specific element in the frame
    TextInput = 2,      // Wait for user to type in a specific input field
    Timer = 3           // Auto-advance after specified duration
}
