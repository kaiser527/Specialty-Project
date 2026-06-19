import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, OrderService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { CreateVoucherDto } from 'libs/dtos/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'libs/dtos/voucher/update-voucher.dto';

@Injectable()
export class VouchersService implements OnModuleInit {
  private orderService: OrderService;

  constructor(@Inject('ORDER_SERVICE') private client: ClientGrpc) {}

  async onModuleInit() {
    this.orderService = this.client.getService<OrderService>('OrderService');
  }

  async findAllVouchers(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.orderService.findAllVouchers({ currentPage, limit, qs }),
    );
  }

  async findAllUsages(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.orderService.findAllUsages({ currentPage, limit, qs }),
    );
  }

  async createVoucher(dto: CreateVoucherDto, user: IUser) {
    return await grpcCall(this.orderService.createVoucher({ dto, user }));
  }

  async updateVoucher(dto: UpdateVoucherDto, user: IUser) {
    return await grpcCall(this.orderService.updateVoucher({ dto, user }));
  }

  async findVoucherByCodeAndUser(code: string, user: IUser) {
    return await grpcCall(
      this.orderService.findVoucherByCodeAndUser({ code, user }),
    );
  }

  async deleteVoucher(id: string) {
    return await grpcCall(this.orderService.deleteVoucher({ id }));
  }
}
