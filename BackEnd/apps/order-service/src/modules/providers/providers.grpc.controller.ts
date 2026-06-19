import { Controller } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { GrpcMethod } from '@nestjs/microservices';
import { IUser } from 'libs/utils/interface';
import { ProviderFeeStatus, ProviderOrderStatus } from 'libs/utils/constants';
import { QuickUpdateProviderFeeDto } from 'libs/dtos/provider/provider.dto';
import { DashboardDto } from 'libs/dtos/order/order-dto';

@Controller()
export class ProvidersGrpcController {
  constructor(private readonly providersService: ProvidersService) {}

  @GrpcMethod('OrderService', 'findAllProviderFee')
  async findAllProviderFee(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.providersService.findAllProviderFee(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('OrderService', 'findAllProviderFeesInit')
  async findAllProviderFeesInit() {
    return await this.providersService.findAllProviderFeesInit();
  }

  @GrpcMethod('OrderService', 'findAllProviderOrdersInit')
  async findAllProviderOrdersInit() {
    return await this.providersService.findAllProviderOrdersInit();
  }

  @GrpcMethod('OrderService', 'findAllProviderOrder')
  async findAllProviderOrder(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.providersService.findAllProviderOrder(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('OrderService', 'updateProviderFeeStatus')
  async updateStatus(data: {
    id: string;
    status: ProviderFeeStatus;
    user: IUser;
  }) {
    return await this.providersService.updateProviderFeeStatus(
      data.id,
      data.status,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'updateProviderOrderStatus')
  async updateProviderOrderStatus(data: {
    id: string;
    status: ProviderOrderStatus;
    user: IUser;
  }) {
    return await this.providersService.updateProviderOrderStatus(
      data.id,
      data.status,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'updateProviderOrdersByOrderId')
  async updateProviderOrdersByOrderId(data: {
    orderId: string;
    status: ProviderOrderStatus;
    user: IUser;
  }) {
    return await this.providersService.updateProviderOrdersByOrderId(
      data.orderId,
      data.status,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'quickUpdateProviderFeeStatus')
  async quickUpdateProviderFeeStatus(data: {
    dto: QuickUpdateProviderFeeDto;
    user: IUser;
  }) {
    return await this.providersService.quickUpdateProviderFeeStatus(
      data.dto,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'providerFeeDashboard')
  async providerFeeDashboard(data: { dto: DashboardDto; ownerId?: string }) {
    return await this.providersService.providerFeeDashboard(
      data.dto,
      data?.ownerId,
    );
  }

  @GrpcMethod('OrderService', 'getProviderFeeDashboardDateRange')
  async getProviderFeeDashboardDateRange(data: { ownerId?: string }) {
    return await this.providersService.getProviderFeeDashboardDateRange(
      data?.ownerId,
    );
  }

  @GrpcMethod('OrderService', 'deleteProviderFeesAndOrdersByOwner')
  async deleteProviderFeesAndOrdersByOwner(data: {
    ownerId: string;
    user: IUser;
  }) {
    return await this.providersService.deleteProviderFeesAndOrdersByOwner(
      data.ownerId,
      data.user,
    );
  }
}
