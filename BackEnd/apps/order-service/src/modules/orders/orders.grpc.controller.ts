import { Controller } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { GrpcMethod } from '@nestjs/microservices';
import { DashboardDto, OrderDto } from 'libs/dtos/order/order-dto';
import { IUser } from 'libs/utils/interface';
import { OrderStatus } from 'libs/utils/constants';

@Controller()
export class OrdersGrpcController {
  constructor(private readonly ordersService: OrdersService) {}

  @GrpcMethod('OrderService', 'findAllOrder')
  async findAllOrders(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.ordersService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('OrderService', 'findAllOrderItemsByVariantIds')
  async findAllOrderItemsByVariantIds(data: { variantIds: string[] }) {
    return await this.ordersService.findAllOrderItemsByVariantIds(
      data.variantIds,
    );
  }

  @GrpcMethod('OrderService', 'findAllOrdersByUser')
  async findAllOrdersByUser(user: IUser) {
    return await this.ordersService.findAllOrdersByUser(user);
  }

  @GrpcMethod('OrderService', 'findAllOrderItem')
  async findAllOrderItem() {
    return await this.ordersService.findAllOrderItem();
  }

  @GrpcMethod('OrderService', 'placeOrder')
  async placeOrder(data: OrderDto & { user: IUser }) {
    return await this.ordersService.placeOrder(data, data.user);
  }

  @GrpcMethod('OrderService', 'updateOrderStatus')
  async updateOrderStatus(data: {
    id: string;
    status: OrderStatus;
    user: IUser;
  }) {
    return await this.ordersService.updateOrderStatus(
      data.id,
      data.status,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'findOneOrder')
  async findOneOrder(data: { id: string }) {
    return await this.ordersService.findOne(data.id);
  }

  @GrpcMethod('OrderService', 'deleteOrder')
  async deleteOrder(data: { id: string; user: IUser }) {
    return await this.ordersService.deleteOrder(data.id, data.user);
  }

  @GrpcMethod('OrderService', 'findOneByUser')
  async findOneByUser(data: { id: string; user: IUser }) {
    return await this.ordersService.findOneByUser(data.id, data.user);
  }

  @GrpcMethod('OrderService', 'dashboard')
  async dashboard(data: DashboardDto) {
    return await this.ordersService.dashboard(data);
  }

  @GrpcMethod('OrderService', 'getDashboardDateRange')
  async getDashboardDateRange({}) {
    return await this.ordersService.getDashboardDateRange();
  }
}
