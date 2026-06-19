using System.Text.Json;
using GenerativeAI;
using modules.gemini.dto;
using MessageService.Gpt;
using helpers;
using modules.chat;
using modules.chat.entities;

namespace modules.gemini;

public class GeminiAiService
{
    private readonly GenerativeModel _model;
    private readonly AiToolDispatcher _dispatcher;
    private readonly ChatService _chat;

    public GeminiAiService(IConfiguration configuration, ChatService chat, AiToolDispatcher dispatcher)
    {
        var apiKey = configuration["Gemini:ApiKey"]!;
        var modelName = configuration["Gemini:Model"]!;

        var googleAI = new GoogleAi(apiKey);
        _model = googleAI.CreateGenerativeModel(modelName);

        _chat = chat;
        _dispatcher = dispatcher;
    }

    private async Task<AiResponse> GenerateAsync(ChatRequest request)
    {
        var prompt = GeminiPromptBuilder.Final(request);
        var response = await _model.GenerateContentAsync(prompt);

        return JsonSerializer.Deserialize<AiResponse>(response.Text, Helper.JsonOptions)
            ?? throw new Exception("Failed to parse AI response.");
    }

    private async Task<AiResponse> ExecuteChatAsync(ChatRequest request)
    {
        try
        {
            AiConversation? conversation = null;

            if (request.User != null)
            {
                var conversationId = Guid.Parse(request.ConversationId);

                conversation = await _chat.GetOrCreateConversationAsync(
                    conversationId,
                    request.User.Id
                );

                await _chat.AddMessageAsync(new AiMessage
                {
                    ConversationId = conversation.Id,
                    Role = MessageRole.User,
                    Content = request.Prompt
                });
            }

            var aiResponse = await GenerateAsync(request);

            if (conversation != null && !string.IsNullOrWhiteSpace(aiResponse.Title))
            {
                await _chat.UpdateConversationTitleAsync(
                    conversation.Id,
                    aiResponse.Title
                );
            }

            if (aiResponse.Intent != AiIntents.None)
            {
                aiResponse.Data = await _dispatcher.ExecuteAsync(aiResponse);
            }

            if (conversation != null)
            {
                var dataJson = JsonSerializer.Serialize(
                    aiResponse.Data ?? Array.Empty<object>(),
                    Helper.JsonOptions
                );

                await _chat.AddMessageAsync(new AiMessage
                {
                    ConversationId = conversation.Id,
                    Role = MessageRole.Assistant,
                    Content = aiResponse.Answer,
                    Data = dataJson,
                    Actions = aiResponse.Actions,
                    Qs = aiResponse.Qs,
                });
            }

            return aiResponse;
        }
        catch (Exception ex)
        {
            return new AiResponse { Answer = "Unexpected server error.", Error = ex.Message };
        }
    }

    public async Task<ChatResponse> ChatAsync(ChatRequest request)
    {
        var aiResponse = await ExecuteChatAsync(request);

        var dataJson = JsonSerializer.Serialize(
                aiResponse.Data ?? Array.Empty<object>(),
                Helper.JsonOptions
            );

        var response = new ChatResponse
        {
            Answer = aiResponse.Answer,
            Data = dataJson,
            Error = aiResponse.Error ?? "",
            Qs = aiResponse.Qs ?? "",
        };

        response.Actions.AddRange(aiResponse.Actions);

        return response;
    }
} 