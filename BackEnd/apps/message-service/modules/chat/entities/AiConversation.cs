namespace modules.chat.entities;

public class AiConversation
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = default!;
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<AiMessage> Messages { get; set; } = [];
}