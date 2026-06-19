import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, OrderService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { CartDto, MergeCartDto } from 'libs/dtos/cart/cart-dto';

@Injectable()
export class CartService implements OnModuleInit {
  private orderService: OrderService;

  constructor(@Inject('ORDER_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderService>('OrderService');
  }

  findOneByUserId = async (userId: string) => {
    return await grpcCall(this.orderService.findCartByUser({ userId }));
  };

  upsertUserCart = async (dto: CartDto, user: IUser) => {
    return await grpcCall(this.orderService.upsertUserCart({ ...dto, user }));
  };

  mergeCart = async (dto: MergeCartDto, user: IUser) => {
    return await grpcCall(
      this.orderService.mergeCart({ items: dto.items, user }),
    );
  };

  clearCart = async (user: IUser) => {
    return await grpcCall(this.orderService.clearCart({ user }));
  };
}
