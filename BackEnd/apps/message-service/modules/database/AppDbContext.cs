using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using modules.chat.entities;
using MessageService.Gpt;
using helpers;

namespace modules.database;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AiConversation> Conversations => Set<AiConversation>();
    public DbSet<AiMessage> Messages => Set<AiMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureConversation(modelBuilder);
        ConfigureMessage(modelBuilder);
    }

    private static void ConfigureConversation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AiConversation>(e =>
        {
            e.ToTable("ai_conversations");

            e.HasKey(x => x.Id);

            e.Property(x => x.UserId)
                .IsRequired()
                .HasMaxLength(100);

            e.Property(x => x.Title)
                .HasMaxLength(255);

            e.Property(x => x.CreatedAt)
                .IsRequired();

            e.Property(x => x.UpdatedAt)
                .IsRequired();

            e.HasMany(x => x.Messages)
                .WithOne(x => x.Conversation)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.UserId);
        });
    }

    private static void ConfigureMessage(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AiMessage>(e =>
        {
            e.ToTable("ai_messages");

            e.HasKey(x => x.Id);

            e.Property(x => x.ConversationId)
                .IsRequired();

            e.Property(x => x.Content)
                .IsRequired();

            e.Property(x => x.Role)
                .HasConversion<string>()
                .IsRequired();

            e.Property(x => x.Actions)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, Helper.JsonOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new List<ActionItem>()
                        : JsonSerializer.Deserialize<List<ActionItem>>(v, Helper.JsonOptions) ?? new()
                )
                .HasColumnType("nvarchar(max)");

            e.Property(x => x.Data)
                .HasColumnType("nvarchar(max)");

            e.Property(x => x.CreatedAt)
                .IsRequired();

            e.Property(x => x.Qs)
                .HasColumnType("nvarchar(max)");

            e.HasIndex(x => x.ConversationId);
        });
    }
}