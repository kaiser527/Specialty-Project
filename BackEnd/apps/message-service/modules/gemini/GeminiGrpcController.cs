using Grpc.Core;
using MessageService.Gpt;

namespace modules.gemini;

public class GeminiGrpcController(GeminiAiService service) : GeminiService.GeminiServiceBase
{
    private readonly GeminiAiService _service = service;

    public override async Task<ChatResponse> chat(ChatRequest request, ServerCallContext context)
    {
        return await _service.ChatAsync(request);
    }
}