import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from 'libs/dtos/user/create-user.dto';
import { IUser } from 'libs/utils/interface';
import { DeleteResult } from 'mongoose';
import { UpdateUserDto } from 'libs/dtos/user/update-user.dto';

@Controller()
export class UsersMessageController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('user.create')
  async create(
    @Payload()
    data: {
      dto: CreateUserDto;
      user: IUser;
    },
  ) {
    return await this.usersService.create(data.dto, data.user);
  }

  @MessagePattern('user.findAll')
  async findAll(
    @Payload()
    data: {
      currentPage: number;
      limit: number;
      qs: string;
    },
  ) {
    return await this.usersService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @MessagePattern('user.update')
  async update(
    @Payload()
    data: {
      id: string;
      dto: UpdateUserDto;
      user: IUser;
    },
  ) {
    return await this.usersService.update(data.id, data.dto, data.user);
  }

  @MessagePattern('user.delete')
  async remove(
    @Payload()
    data: {
      id: string;
      user: IUser;
    },
  ): Promise<DeleteResult> {
    return await this.usersService.remove(data.id, data.user);
  }

  @MessagePattern('user.findById')
  async findById(@Payload() data: { id: string; isCreate: boolean }) {
    return await this.usersService.findOne(data.id, 'id', data.isCreate);
  }

  @MessagePattern('user.getAllFiles')
  async getAllFiles() {
    return await this.usersService.getAllFiles();
  }

  @MessagePattern('user.getUserRoleChart')
  async getUserRoleChart() {
    return await this.usersService.getUserRoleChart();
  }
}
