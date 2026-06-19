import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePermissionDto } from 'libs/dtos/permission/create-permission.dto';
import { IUser } from 'libs/utils/interface';
import { handleRpcRedis } from '../../utils/helper';
import { UpdatePermissionDto } from 'libs/dtos/permission/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject('IDENTITY_SERVICE') private permissionClient: ClientProxy,
  ) {}

  async findAll(data: { currentPage: number; limit: number; qs: string }) {
    return handleRpcRedis(this.permissionClient, 'permission.findAll', data);
  }

  async findOne(id: string) {
    return handleRpcRedis(this.permissionClient, 'permission.findOne', id);
  }

  async create(data: { dto: CreatePermissionDto; user: IUser }) {
    return handleRpcRedis(this.permissionClient, 'permission.create', data);
  }

  async update(data: { id: string; dto: UpdatePermissionDto; user: IUser }) {
    return handleRpcRedis(this.permissionClient, 'permission.update', data);
  }

  async delete(data: { id: string; user: IUser }) {
    return handleRpcRedis(this.permissionClient, 'permission.delete', data);
  }
}
