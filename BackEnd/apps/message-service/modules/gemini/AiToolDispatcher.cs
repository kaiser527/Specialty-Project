using Identity;
using Order;
using Product;
using modules.gemini.dto;

namespace modules.gemini;

public class AiToolDispatcher(
    IdentityService.IdentityServiceClient identity,
    OrderService.OrderServiceClient order,
    ProductService.ProductServiceClient product)
{
    private readonly IdentityService.IdentityServiceClient _identity = identity;
    private readonly OrderService.OrderServiceClient _order = order;
    private readonly ProductService.ProductServiceClient _product = product;

    public async Task<object?> ExecuteAsync(AiResponse response)
    {
        return response.Intent switch
        {
            AiIntents.FindUsers => await FindUsersAsync(response.Qs),
            AiIntents.FindOrders => await FindOrdersAsync(response.Qs),
            AiIntents.FindProducts => await FindProductsAsync(response.Qs),
            _ => null
        };
    }

    private async Task<object?> FindUsersAsync(string? qs)
    {
        var response = await _identity.findAllPopulateAsync(
            new Identity.PaginateRequest
            {
                CurrentPage = 1,
                Limit = 100,
                Qs = qs ?? ""
            });

        return response.Result;
    }

    private async Task<object?> FindOrdersAsync(string? qs)
    {
        var response = await _order.findAllOrderAsync(
            new Order.PaginateRequest
            {
                CurrentPage = 1,
                Limit = 100,
                Qs = qs ?? ""
            });

        return response.Result;
    }

    private async Task<object?> FindProductsAsync(string? qs)
    {
        var response = await _product.findAllVariantAsync(
            new Product.PaginateRequest
            {
                CurrentPage = 1,
                Limit = 100,
                Qs = qs ?? ""
            });

        return response.Result;
    }
}