import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';
import { PaymentService } from './payment.service';
import { OrdersModule } from '../orders/orders.module';
import { PaymentGrpcController } from './payment.grpc.controller';
import { getVnpayLogger } from '../../utils/helpers';

@Module({
  imports: [
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        tmnCode: configService.get<string>('VNP_TMNCODE'),
        secureSecret: configService.get<string>('VNP_HASH_SECRET'),
        vnpayHost: configService.get<string>('VNP_URL'),
        testMode: configService.get<string>('VNP_TEST_MODE') === 'true',
        loggerFn: getVnpayLogger,
      }),
      inject: [ConfigService],
    }),
    OrdersModule,
  ],
  controllers: [PaymentGrpcController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
