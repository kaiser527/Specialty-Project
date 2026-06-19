import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entities';
import { VoucherUsage } from './entities/voucher-usages.entities';
import { VouchersService } from './vouchers.service';
import { VouchersGrpcController } from './vouchers.grpc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherUsage])],
  controllers: [VouchersGrpcController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
