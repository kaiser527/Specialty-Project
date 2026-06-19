import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from 'libs/dtos/user/create-user.dto';
import { IUser } from 'libs/utils/interface';
import { handleRpcRedis } from '../../utils/helper';
import { UpdateUserDto } from 'libs/dtos/user/update-user.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class UsersService {
  constructor(
    private socket: SocketGateway,

    @Inject('IDENTITY_SERVICE') private userClient: ClientProxy,
  ) {}

  async findAll(data: { currentPage: number; limit: number; qs: string }) {
    return await handleRpcRedis(this.userClient, 'user.findAll', data);
  }

  async findById(data: { id: string; isCreate: boolean }) {
    return handleRpcRedis(this.userClient, 'user.findById', data);
  }

  async getAllFiles() {
    return handleRpcRedis(this.userClient, 'user.getAllFiles', {});
  }

  async create(data: { dto: CreateUserDto; user: IUser }) {
    const result = await handleRpcRedis(this.userClient, 'user.create', data);
    await this.socket.emitUserRoleChartUpdate();
    return result;
  }

  async update(data: { id: string; dto: UpdateUserDto; user: IUser }) {
    const result = await handleRpcRedis(this.userClient, 'user.update', data);
    await this.socket.emitUserRoleChartUpdate();
    return result;
  }

  async delete(data: { id: string; user: IUser }) {
    const result = await handleRpcRedis(this.userClient, 'user.delete', data);
    await this.socket.emitUserRoleChartUpdate();
    return result;
  }
}
