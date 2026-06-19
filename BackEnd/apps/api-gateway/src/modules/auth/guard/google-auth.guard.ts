import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    try {
      const activate = (await super.canActivate(context)) as boolean;
      return activate;
    } catch (err) {
      const response = context.switchToHttp().getResponse();
      let message = 'Authentication failed';
      if (err?.response?.message) {
        message = Array.isArray(err.response.message)
          ? err.response.message.join(', ')
          : err.response.message;
      } else if (err?.message) {
        message = err.message;
      }
      response.redirect(
        `${this.configService.get<string>('REACT_URL')}redirect?status=failed&message=${encodeURIComponent(message)}`,
      );
      return false;
    }
  }
}
