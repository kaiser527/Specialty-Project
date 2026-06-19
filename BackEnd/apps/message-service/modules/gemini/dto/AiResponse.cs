using MessageService.Gpt;

namespace modules.gemini.dto;

public class AiResponse
{
    public string Intent { get; set; } = string.Empty;
    public string Qs { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<ActionItem> Actions { get; set; } = [];
    public object? Data { get; set; }
    public string? Error { get; set; }
}