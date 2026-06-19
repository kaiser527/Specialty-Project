import { Controller } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { GrpcMethod } from '@nestjs/microservices';
import { IUser } from 'libs/utils/interface';
import { CreateVoucherDto } from 'libs/dtos/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'libs/dtos/voucher/update-voucher.dto';

@Controller()
export class VouchersGrpcController {
  constructor(private readonly vouchersService: VouchersService) {}

  @GrpcMethod('OrderService', 'findAllVouchers')
  async findAllVouchers(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.vouchersService.findAllVouchers(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('OrderService', 'findAllUsages')
  async findAllUsages(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.vouchersService.findAllUsages(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('OrderService', 'createVoucher')
  async createVoucher(data: { dto: CreateVoucherDto; user: IUser }) {
    return await this.vouchersService.createVoucher(data.dto, data.user);
  }

  @GrpcMethod('OrderService', 'updateVoucher')
  async updateVoucher(data: { dto: UpdateVoucherDto; user: IUser }) {
    return await this.vouchersService.updateVoucher(data.dto, data.user);
  }

  @GrpcMethod('OrderService', 'findVoucherByCodeAndUser')
  async findVoucherByCodeAndUser(data: { code: string; user: IUser }) {
    return await this.vouchersService.findVoucherByCodeAndUser(
      data.code,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'deleteVoucher')
  async deleteVoucher(data: { id: string }) {
    return await this.vouchersService.deleteVoucher(data.id);
  }
}
