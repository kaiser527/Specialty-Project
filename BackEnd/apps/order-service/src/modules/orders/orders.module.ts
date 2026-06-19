import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/orders.entity';
import { OrderItem } from './entities/order-items.entity';
import { OrdersGrpcController } from './orders.grpc.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import path from 'path';
import { ProvidersModule } from '../providers/providers.module';
import { CartModule } from '../cart/cart.module';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [
    ProvidersModule,
    CartModule,
    VouchersModule,
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'product',
            protoPath: path.join(process.cwd(), 'libs/protos/product.proto'),
            url: configService.get<string>('GRPC_URL_PRODUCT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'IDENTITY_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'identity',
            protoPath: path.join(process.cwd(), 'libs/protos/identity.proto'),
            url: configService.get<string>('GRPC_URL_IDENTITY'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OrdersGrpcController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
