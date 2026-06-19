using Grpc.Core;
using MessageService.Gpt;

namespace modules.chat;

public class ChatGrpcController(ChatService chatService) : ChatEFService.ChatEFServiceBase
{
    private readonly ChatService _chatService = chatService;

    public override async Task<AiMessageListResponse> findAllMessage(AiMessagePaginateRequest request, ServerCallContext context)
    {
        return await _chatService.FindAllMessageAsync(request);
    }

    public override async Task<AiConversationListResponse> findAllConversation(AiConversationPaginateRequest request, ServerCallContext context)
    {
        return await _chatService.FindAllConversationAsync(request);
    }

    public override async Task<QuickResponse> deleteConversationByUser(DeleteConversationByUserRequest request, ServerCallContext context)
    {
        return await _chatService.DeleteConversationAsync(request);
    }
}