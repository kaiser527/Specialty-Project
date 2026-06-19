import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Socket } from 'socket.io';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_PUBLIC_PERMISSIONS = 'isPublicPermissions';
export const SkipPermission = () => SetMetadata(IS_PUBLIC_PERMISSIONS, true);

export const ALLOW_GUEST_WS = 'allow_guest_ws';
export const AllowGuestWs = () => SetMetadata(ALLOW_GUEST_WS, true);

export const SKIP_CHECK_TOKEN_BLACKLIST = 'skip_check_token_blacklist';
export const SkipCheckTokenBlacklist = () =>
  SetMetadata(SKIP_CHECK_TOKEN_BLACKLIST, true);

export const RESPONSE_MESSAGE = 'response_message';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const WsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data.user;
  },
);
