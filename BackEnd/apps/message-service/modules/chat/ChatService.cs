using modules.database;
using modules.chat.entities;
using Microsoft.EntityFrameworkCore;
using MessageService.Gpt;

namespace modules.chat;

public class ChatService(AppDbContext context)
{
    private readonly AppDbContext _context = context;

    public async Task<AiConversation> GetOrCreateConversationAsync(Guid conversationId, string userId)
    {
        var existing = await _context.Conversations
            .FirstOrDefaultAsync(x => x.Id == conversationId && x.UserId == userId);

        if (existing != null) return existing;

        var conversation = new AiConversation
        {
            Id = conversationId,
            UserId = userId,
            Title = $"Chat {DateTime.UtcNow:HH:mm}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        return conversation;
    }

    public async Task<AiMessage> AddMessageAsync(AiMessage dto)
    {
        var now = DateTime.UtcNow;

        var message = new AiMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = dto.ConversationId,
            Role = dto.Role,
            Content = dto.Content,
            Data = dto.Data,
            Actions = dto.Actions,
            CreatedAt = now,
            Qs = dto.Qs
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        await _context.Conversations
            .Where(x => x.Id == dto.ConversationId)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(x => x.UpdatedAt, now)
            );

        return message;
    }

    public async Task<AiConversationListResponse> FindAllConversationAsync(AiConversationPaginateRequest request)
    {
        var currentPage = request.CurrentPage <= 0 ? 1 : request.CurrentPage;
        var pageSize = request.Limit <= 0 ? 10 : request.Limit;

        var query = _context.Conversations
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            query = query.Where(x => x.UserId == request.UserId);
        }

        var total = await query.CountAsync();

        var conversations = await query
            .OrderByDescending(x => x.UpdatedAt)
            .Skip((currentPage - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var response = new AiConversationListResponse();

        response.Result.AddRange(
            conversations.Select(x => new AiConversationResponse
            {
                Id = x.Id.ToString(),
                UserId = x.UserId,
                Title = x.Title ?? "",
                CreatedAt = x.CreatedAt.ToString("O"),
                UpdatedAt = x.UpdatedAt.ToString("O")
            })
        );

        response.Meta = new Meta
        {
            Current = currentPage,
            PageSize = pageSize,
            Total = total,
            Pages = (int)Math.Ceiling((double)total / pageSize)
        };

        return response;
    }

    public async Task<AiMessageListResponse> FindAllMessageAsync(AiMessagePaginateRequest request)
    {
        var pageSize = request.Limit <= 0 ? 20 : request.Limit;

        var query = _context.Messages
            .AsNoTracking()
            .Include(x => x.Conversation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.ConversationId)
            && Guid.TryParse(request.ConversationId, out var conversationId))
        {
            query = query.Where(x => x.ConversationId == conversationId);
        }

        if (!string.IsNullOrWhiteSpace(request.LastCreatedAt)
            && DateTime.TryParse(request.LastCreatedAt, out var lastCreatedAt)
            && Guid.TryParse(request.LastId, out var lastId))
        {
            query = query.Where(x =>
                x.CreatedAt < lastCreatedAt
                ||
                (
                    x.CreatedAt == lastCreatedAt
                    && x.Id.CompareTo(lastId) < 0
                )
            );
        }

        var messages = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(pageSize + 1)
            .ToListAsync();

        var hasMore = messages.Count > pageSize;

        if (hasMore)
        {
            messages.RemoveAt(messages.Count - 1);
        }

        messages.Reverse();

        var response = new AiMessageListResponse();

        response.Result.AddRange(messages.Select(x =>
        {
            var res = new AiMessageResponse
            {
                Id = x.Id.ToString(),
                ConversationId = x.ConversationId.ToString(),
                MessageRole = x.Role.ToString(),
                Content = x.Content,
                Data = x.Data ?? "",
                Qs = x.Qs ?? "",
                CreatedAt = x.CreatedAt.ToString("O"),

                Conversation = new AiConversationResponse
                {
                    Id = x.Conversation.Id.ToString(),
                    UserId = x.Conversation.UserId,
                    Title = x.Conversation.Title ?? "",
                    CreatedAt = x.Conversation.CreatedAt.ToString("O"),
                    UpdatedAt = x.Conversation.UpdatedAt.ToString("O")
                }
            };

            if (x.Actions != null)
            {
                res.Actions.AddRange(x.Actions);
            }

            return res;
        }));

        var oldestMessage = messages.FirstOrDefault();

        response.Meta = new MetaCursor
        {
            PageSize = pageSize,
            HasMore = hasMore,
            NextCreatedAt = oldestMessage?.CreatedAt.ToString("O") ?? "",
            NextId = oldestMessage?.Id.ToString() ?? ""
        };

        return response;
    }

    public async Task UpdateConversationTitleAsync(Guid conversationId, string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return;

        await _context.Conversations
            .Where(x => x.Id == conversationId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Title, title));
    }

    public async Task<QuickResponse> DeleteConversationAsync(DeleteConversationByUserRequest request)
    {
        await _context.Conversations
            .Where(x => x.UserId == request.UserId)
            .ExecuteDeleteAsync();

        return new QuickResponse { Message = "Deleted conversation successfully" };  
    } 
}