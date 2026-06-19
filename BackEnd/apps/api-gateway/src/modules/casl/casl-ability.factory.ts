import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability';
import { IUser } from 'libs/utils/interface';
import { buildPermissionKey, normalizePath } from '../../utils/helper';

export type Subjects = 'route';
export type AppAbility = MongoAbility<[string, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: IUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const permissions = user.permissions ?? [];

    for (const permission of permissions) {
      const permissionKey = buildPermissionKey(
        permission.method,
        normalizePath(permission.apiPath),
      );

      can(permissionKey, 'route');
    }

    return build();
  }
}
