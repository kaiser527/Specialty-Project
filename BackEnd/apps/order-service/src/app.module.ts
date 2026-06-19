import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { PaymentModule } from './modules/payment/payment.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //envFilePath: 'apps/order-service/.env',
    }),
    DatabaseModule,
    CartModule,
    OrdersModule,
    ProvidersModule,
    PaymentModule,
    VouchersModule,
  ],
})
export class AppModule {}
