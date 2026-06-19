import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';

@Module({
  imports: [
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
