import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, OrderService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { SocketGateway } from '../socket/socket.gateway';
import { ProviderFeeStatus, ProviderOrderStatus } from 'libs/utils/constants';

@Injectable()
export class ProvidersService implements OnModuleInit {
  private orderService: OrderService;

  constructor(
    private readonly socketGateway: SocketGateway,

    @Inject('ORDER_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderService>('OrderService');
  }

  async updateProviderFeeStatus(
    id: string,
    status: ProviderFeeStatus,
    user: IUser,
  ) {
    const result = await grpcCall(
      this.orderService.updateProviderFeeStatus({ id, status, user }),
    );
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    return result;
  }

  async updateProviderOrderStatus(
    id: string,
    status: ProviderOrderStatus,
    user: IUser,
  ) {
    const result = await grpcCall(
      this.orderService.updateProviderOrderStatus({ id, status, user }),
    );
    await this.socketGateway.emitDashboardUpdate();
    await this.socketGateway.emitOrderUpdate();
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderOrderUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    await this.socketGateway.emitFindAllOrderUserUpdate();
    await this.socketGateway.emitFindAllOrderUpdate();
    await this.socketGateway.emitDashboardDateRangeUpdate();
    return result;
  }

  async updateProviderOrdersByOrderId(
    orderId: string,
    status: ProviderOrderStatus,
    user: IUser,
  ) {
    const result = await grpcCall(
      this.orderService.updateProviderOrdersByOrderId({
        orderId,
        status,
        user,
      }),
    );
    await this.socketGateway.emitDashboardUpdate();
    await this.socketGateway.emitOrderUpdate();
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderOrderUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    await this.socketGateway.emitFindAllOrderUserUpdate();
    await this.socketGateway.emitFindAllOrderUpdate();
    await this.socketGateway.emitDashboardDateRangeUpdate();
    return result;
  }

  async quickUpdateProviderFeeStatus(
    ownerId: string,
    status: ProviderFeeStatus,
    user: IUser,
    orderId: string,
  ) {
    const result = await grpcCall(
      this.orderService.quickUpdateProviderFeeStatus({
        dto: { ownerId, status, orderId },
        user,
      }),
    );
    await this.socketGateway.emitProviderFeeDashboardUpdate();
    await this.socketGateway.emitProviderFeeDashboardDateRangeUpdate();
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    return result;
  }
}
