import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { MailProcessor } from './bull/mail.processor';
import path from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_APP'),
            pass: configService.get<string>('EMAIL_APP_PASSWORD'),
          },
        },
        template: {
          dir: path.join(
            process.cwd(),
            'apps/identity-service/src/modules/mail/templates',
          ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        preview: configService.get<string>('EMAIL_PREVIEW') !== 'false',
      }),
    }),
  ],
  controllers: [],
  providers: [MailService, MailProcessor],
})
export class MailModule {}
