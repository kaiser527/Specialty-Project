using Identity;
using Microsoft.EntityFrameworkCore;
using modules.gemini;
using modules.database;
using Order;
using Product;
using modules.chat;

AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddGrpc();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("sqlConnection")));

builder.Services.AddScoped<GeminiAiService>();
builder.Services.AddScoped<AiToolDispatcher>();
builder.Services.AddScoped<ChatService>();

builder.Services.AddGrpcClient<IdentityService.IdentityServiceClient>(o =>
{
    o.Address = new Uri(builder.Configuration["Grpc:Identity"]!);
});
builder.Services.AddGrpcClient<ProductService.ProductServiceClient>(o =>
{
    o.Address = new Uri(builder.Configuration["Grpc:Product"]!);
});
builder.Services.AddGrpcClient<OrderService.OrderServiceClient>(o =>
{
    o.Address = new Uri(builder.Configuration["Grpc:Order"]!);
});

var app = builder.Build();

app.MapGrpcService<GeminiGrpcController>();
app.MapGrpcService<ChatGrpcController>();

app.Run();
