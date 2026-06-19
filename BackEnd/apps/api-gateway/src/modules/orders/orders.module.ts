import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    SocketModule,
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
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
