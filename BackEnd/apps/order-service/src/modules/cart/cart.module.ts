import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartGrpcController } from './cart.grpc.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-items.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
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
    ]),
  ],
  controllers: [CartGrpcController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
