using MessageService.Gpt;

namespace modules.chat.entities;

public class AiMessage
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public AiConversation Conversation { get; set; } = default!;
    public MessageRole Role { get; set; }
    public string Content { get; set; } = default!;
    public List<ActionItem> Actions { get; set; } = [];
    public string? Data { get; set; }
    public string? Qs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum MessageRole
{
    User = 1,
    Assistant = 2
}