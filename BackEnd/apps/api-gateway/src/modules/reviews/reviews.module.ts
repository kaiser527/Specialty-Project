import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';
import { ReviewsContronller } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
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
    SocketModule,
  ],
  controllers: [ReviewsContronller],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
