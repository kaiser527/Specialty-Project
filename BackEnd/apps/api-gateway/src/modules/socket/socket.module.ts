import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
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
        name: 'MESSAGE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'message',
            protoPath: path.join(process.cwd(), 'libs/protos/gemini.proto'),
            url: configService.get<string>('GRPC_URL_MESSAGE'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'IDENTITY_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    JwtModule,
    RolesModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
