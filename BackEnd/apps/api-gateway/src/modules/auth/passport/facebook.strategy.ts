import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Profile, Strategy } from 'passport-facebook';
import { AccountType } from 'libs/utils/constants';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('APP_ID'),
      clientSecret: configService.get<string>('APP_SECRET'),
      callbackURL: configService.get<string>('APP_REDIRECT'),
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      scope: ['public_profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const image = `https://graph.facebook.com/v19.0/${profile.id}/picture?width=2000&height=2000&access_token=${accessToken}`;

    const user = await this.authService.validateUserSocial({
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      image,
      accountType: AccountType.FACEBOOK,
    });

    return user || null;
  }
}
