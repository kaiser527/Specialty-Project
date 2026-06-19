import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entites/reviews.entity';
import { ReviewsGrpcController } from './reviews.grpc.controller';
import { ReviewsService } from './reviews.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
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
    ]),
  ],
  controllers: [ReviewsGrpcController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
