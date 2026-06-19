import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  sendEmail = async (
    email: string,
    name: string,
    otp: string,
    template: 'reset' | 'register',
  ) => {
    const subjectMap = {
      register: 'Welcome to Kaiser! Activate Your Account',
      reset: 'Kaiser Password Reset Code',
    };
    await this.mailerService.sendMail({
      to: email,
      from: '"Kaiser Support" <support@example.com>',
      subject: subjectMap[template],
      template,
      context: { name, otp },
    });
  };
}
