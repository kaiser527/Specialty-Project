import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateRoleDto } from 'libs/dtos/role/create-role.dto';
import { IUser } from 'libs/utils/interface';
import { handleRpcRedis } from '../../utils/helper';
import { UpdateRoleDto } from 'libs/dtos/role/update-role.dto';

@Injectable()
export class RolesService {
  constructor(@Inject('IDENTITY_SERVICE') private roleClient: ClientProxy) {}

  async findAll(data: { currentPage: number; limit: number; qs: string }) {
    return handleRpcRedis(this.roleClient, 'role.findAll', data);
  }

  async findOne(id: string) {
    return handleRpcRedis(this.roleClient, 'role.findOne', id);
  }

  async create(data: { dto: CreateRoleDto; user: IUser }) {
    return handleRpcRedis(this.roleClient, 'role.create', data);
  }

  async update(data: { id: string; dto: UpdateRoleDto; user: IUser }) {
    return handleRpcRedis(this.roleClient, 'role.update', data);
  }

  async delete(data: { id: string; user: IUser }) {
    return handleRpcRedis(this.roleClient, 'role.delete', data);
  }
}
