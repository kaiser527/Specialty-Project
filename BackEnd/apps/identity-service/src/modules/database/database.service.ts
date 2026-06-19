import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'mongoose-delete';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Permission,
  PermissionDocument,
} from '../permissions/schemas/permission.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { INIT_PERMISSIONS } from './samples/permission';
import { INIT_ROLES } from './samples/role';
import { INIT_USERS } from './samples/user';
import { toObjectId } from '../../utils/helper';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async onModuleInit() {
    const countUser = await this.userModel.countDocuments();
    const countPermission = await this.permissionModel.countDocuments();
    const countRole = await this.roleModel.countDocuments();

    if (countPermission === 0) {
      await this.permissionModel.insertMany(
        INIT_PERMISSIONS.map((permission) => ({
          ...permission,
          _id: toObjectId(permission._id),
          createdBy: permission.createdBy
            ? {
                ...permission.createdBy,
                _id: toObjectId(permission.createdBy._id),
              }
            : undefined,
          updatedBy: permission.updatedBy
            ? {
                ...permission.updatedBy,
                _id: toObjectId(permission.updatedBy._id),
              }
            : undefined,
        })),
      );
    }

    if (countRole === 0) {
      await this.roleModel.insertMany(
        INIT_ROLES.map((role) => ({
          ...role,
          _id: toObjectId(role._id),
          permissions: role.permissions?.map((p) => toObjectId(p)),
          createdBy: role.createdBy
            ? {
                ...role.createdBy,
                _id: toObjectId(role.createdBy._id),
              }
            : undefined,
          updatedBy: role.updatedBy
            ? {
                ...role.updatedBy,
                _id: toObjectId(role.updatedBy._id),
              }
            : undefined,
        })),
      );
    }

    if (countUser === 0) {
      await this.userModel.insertMany(
        INIT_USERS.map((user) => ({
          ...user,
          _id: toObjectId(user._id),
          role: toObjectId(user.role),
          createdBy: user.createdBy
            ? {
                ...user.createdBy,
                _id: toObjectId(user.createdBy._id),
              }
            : undefined,
          updatedBy: user.updatedBy
            ? {
                ...user.updatedBy,
                _id: toObjectId(user.updatedBy._id),
              }
            : undefined,
        })),
      );
    }

    if (countUser > 0 && countRole > 0 && countPermission > 0) {
      this.logger.log('>>> ALREADY INIT SAMPLE DATA...');
    }
  }
}
