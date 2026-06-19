import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { RolesService } from '../../roles/roles.service';
import { IToken, IUser } from 'libs/utils/interface';
import { Reflector } from '@nestjs/core';
import {
  ALLOW_GUEST_WS,
  SKIP_CHECK_TOKEN_BLACKLIST,
} from '../../../utils/decorator.customize';
import { handleRpcRedis } from 'apps/api-gateway/src/utils/helper';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
    private reflector: Reflector,

    @Inject('IDENTITY_SERVICE') private authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    const allowGuest = this.reflector.getAllAndOverride<boolean>(
      ALLOW_GUEST_WS,
      [context.getHandler(), context.getClass()],
    );

    const skipCheckTokenBlacklist = this.reflector.getAllAndOverride<boolean>(
      SKIP_CHECK_TOKEN_BLACKLIST,
      [context.getHandler(), context.getClass()],
    );

    const cookie = client.handshake.headers?.cookie;

    if (!cookie) {
      if (allowGuest) {
        client.data.user = null;
        return true;
      }
      throw new WsException('Missing refresh token');
    }

    const refreshToken = cookie.replace('refresh_token=', '');

    const payload: IUser & IToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    });

    const isBlacklisted = await handleRpcRedis(
      this.authClient,
      'auth.checkTokenBlacklist',
      payload.jti,
    );

    if (isBlacklisted && !skipCheckTokenBlacklist) {
      throw new WsException('Token blacklisted');
    }

    const role = await this.rolesService.findOne(payload.role._id.toString());

    payload.role = role;

    client.data.user = payload;

    return true;
  }
}
