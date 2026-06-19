import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { ResponseMessage, User } from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import {
  CreateVoucherDto,
  FetchVoucherByCodeDTO,
} from 'libs/dtos/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'libs/dtos/voucher/update-voucher.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @ResponseMessage('Fetch vouchers paginate')
  findAllVouchers(@Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    const qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    return this.vouchersService.findAllVouchers(+current, +pageSize, qs);
  }

  @Get('usages')
  @ResponseMessage('Fetch voucher usages paginate')
  findAllUsages(@Query() query: Record<string, any>, @User() user: IUser) {
    const { current, pageSize, ...filters } = query;
    let qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    qs += `&userId=${user._id.toString()}`;
    return this.vouchersService.findAllUsages(+current, +pageSize, qs);
  }

  @Post()
  @ResponseMessage('Create Voucher')
  createVoucher(@Body() dto: CreateVoucherDto, @User() user: IUser) {
    return this.vouchersService.createVoucher(dto, user);
  }

  @Patch()
  @ResponseMessage('Update Voucher')
  updateVoucher(@Body() dto: UpdateVoucherDto, @User() user: IUser) {
    return this.vouchersService.updateVoucher(dto, user);
  }

  @Post('code')
  @ResponseMessage('Find voucher by code and user')
  findVoucherByCodeAndUser(
    @Body() dto: FetchVoucherByCodeDTO,
    @User() user: IUser,
  ) {
    const requestCode = dto.code.toUpperCase();
    return this.vouchersService.findVoucherByCodeAndUser(requestCode, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete Voucher')
  deleteVoucher(@Param('id') id: string) {
    return this.vouchersService.deleteVoucher(id);
  }
}
