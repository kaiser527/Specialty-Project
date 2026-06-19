import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  validate = async (username: string, password: string): Promise<any> => {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Email/Password is Invalid!');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is not activated');
    }
    return user; //req.user
  };
}
