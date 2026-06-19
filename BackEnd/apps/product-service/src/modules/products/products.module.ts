import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductsGrpcController } from './products.grpc.controller';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant]),
    CategoriesModule,
    ReviewsModule,
    ClientsModule.registerAsync([
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
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'order',
            protoPath: path.join(process.cwd(), 'libs/protos/order.proto'),
            url: configService.get<string>('GRPC_URL_ORDER'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ProductsGrpcController],
  providers: [ProductsService],
})
export class ProductsModule {}
