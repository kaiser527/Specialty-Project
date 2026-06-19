import { Controller } from '@nestjs/common';
import { CartService } from './cart.service';
import { GrpcMethod } from '@nestjs/microservices';
import { CartDto, MergeCartDto } from 'libs/dtos/cart/cart-dto';
import { IUser } from 'libs/utils/interface';

@Controller()
export class CartGrpcController {
  constructor(private readonly cartService: CartService) {}

  @GrpcMethod('OrderService', 'findCartByUser')
  async findOneByUserId(data: { userId: string }) {
    return await this.cartService.findOneByUserId(data.userId);
  }

  @GrpcMethod('OrderService', 'upsertUserCart')
  async upsertUserCart(data: CartDto & { user: IUser }) {
    return await this.cartService.upsertUserCart(data, data.user);
  }

  @GrpcMethod('OrderService', 'mergeCart')
  async mergeCart(data: MergeCartDto & { user: IUser }) {
    return await this.cartService.mergeCart(data, data.user);
  }

  @GrpcMethod('OrderService', 'clearCart')
  async clearCart(data: { user: IUser }) {
    return await this.cartService.clearCart(data.user);
  }
}
