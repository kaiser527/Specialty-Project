import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import path from 'path';
import { ProviderFee } from './entities/provider-fees.entity';
import { ProviderOrder } from './entities/provider-order.entity';
import { ProvidersService } from './providers.service';
import { ProvidersGrpcController } from './providers.grpc.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderOrder, ProviderFee]),
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
  controllers: [ProvidersGrpcController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
