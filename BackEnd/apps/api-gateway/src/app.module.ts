import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { CaslModule } from './modules/casl/casl.module';
import { AuthModule } from './modules/auth/auth.module';
import { QueueModule } from './modules/queue/queue.module';
import { BullModule } from '@nestjs/bullmq';
import { FilesModule } from './modules/files/files.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SocketModule } from './modules/socket/socket.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { AiModule } from './modules/ai/ai.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //envFilePath: 'apps/api-gateway/.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
    FilesModule,
    CaslModule,
    RolesModule,
    AuthModule,
    ProductsModule,
    PermissionsModule,
    CartModule,
    CategoriesModule,
    QueueModule,
    OrdersModule,
    ProvidersModule,
    PaymentModule,
    SocketModule,
    ReviewsModule,
    AiModule,
    VouchersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
