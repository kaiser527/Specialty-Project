import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, OrderService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { OrderStatus } from 'libs/utils/constants';
import { OrderDto } from 'libs/dtos/order/order-dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class OrdersService implements OnModuleInit {
  private orderService: OrderService;

  constructor(
    private readonly socketGateway: SocketGateway,

    @Inject('ORDER_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderService>('OrderService');
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.orderService.findAllOrder({ currentPage, limit, qs }),
    );
  }

  async findOne(id: string) {
    return await grpcCall(this.orderService.findOneOrder({ id }));
  }

  async findOneByUser(id: string, user: IUser) {
    return await grpcCall(this.orderService.findOneByUser({ id, user }));
  }

  async updateOrderStatus(id: string, status: OrderStatus, user: IUser) {
    const result = await grpcCall(
      this.orderService.updateOrderStatus({ id, status, user }),
    );
    await this.socketGateway.emitDashboardUpdate();
    await this.socketGateway.emitOrderUpdate();
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    await this.socketGateway.emitFindAllOrderUpdate();
    await this.socketGateway.emitFindAllOrderUserUpdate();
    await this.socketGateway.emitDashboardDateRangeUpdate();
    return result;
  }

  async deleteOrder(id: string, user: IUser) {
    const result = await grpcCall(this.orderService.deleteOrder({ id, user }));
    await this.socketGateway.emitDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderOrderUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    await this.socketGateway.emitFindAllOrderUpdate();
    await this.socketGateway.emitFindAllOrderUserUpdate();
    await this.socketGateway.emitDashboardDateRangeUpdate();
    return result;
  }

  async placeOrder(dto: OrderDto, user: IUser) {
    const result = await grpcCall(
      this.orderService.placeOrder({ ...dto, user }),
    );
    await this.socketGateway.emitFindAllProviderOrderUpdate();
    await this.socketGateway.emitFindAllOrderUserUpdate();
    await this.socketGateway.emitFindAllOrderUpdate();
    return result;
  }
}
