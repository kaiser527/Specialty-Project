import { NestFactory } from '@nestjs/core';
import path from 'path';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const configService = appContext.get(ConfigService);

  const grpcUrl =
    configService.get<string>('GRPC_URL_PRODUCT') || '0.0.0.0:50051';
  const protoPath = path.join(process.cwd(), 'libs/protos/product.proto');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'product',
        protoPath,
        url: grpcUrl,
      },
    },
  );

  await app.listen();
}
bootstrap();
