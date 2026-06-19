import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { SocketModule } from '../socket/socket.module';
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
    ]),
    JwtModule,
    SocketModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
