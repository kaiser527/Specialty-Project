import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory';
import { buildRequestPermissionKey } from '../../../utils/helper';
import {
  IS_PUBLIC_KEY,
  IS_PUBLIC_PERMISSIONS,
} from '../../../utils/decorator.customize';
import { TokenType } from 'libs/utils/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(
    err: string,
    user: any,
    info: Error,
    context: ExecutionContext,
  ) {
    const request: Request = context.switchToHttp().getRequest();

    if (!request.route?.path) {
      throw new ForbiddenException('Cannot resolve route path');
    }

    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Invalid Token or Bearer Token at header request is null',
        )
      );
    }

    if (!user.role.isActive) {
      throw new ForbiddenException('Your role is not active');
    }

    if (user.type === TokenType.REFRESH) {
      throw new ForbiddenException('Refresh token cannot be used');
    }

    if (user.isBlacklist) {
      throw new UnauthorizedException('Token is revoked');
    }

    if (!isSkipPermission) {
      const ability = this.caslAbilityFactory.createForUser(user);
      (request as any).ability = ability;

      const permissionKey = buildRequestPermissionKey(request);

      const canAccess = ability.can(permissionKey, 'route');

      if (!canAccess) {
        throw new ForbiddenException(
          "You don't have permission to access this resource",
        );
      }
    }

    return user;
  }
}
