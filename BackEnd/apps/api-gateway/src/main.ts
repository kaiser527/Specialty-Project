import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './core/transform.interceptor';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import path from 'path';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { CaslAbilityFactory } from './modules/casl/casl-ability.factory';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const caslAbilityFactory = app.get(CaslAbilityFactory);

  app.useGlobalGuards(new JwtAuthGuard(reflector, caslAbilityFactory));

  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.use(cookieParser());

  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const publicPath = path.join(process.cwd(), 'apps/api-gateway/public/images');

  app.useStaticAssets(publicPath, { prefix: '/images' });

  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
