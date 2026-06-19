import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from 'libs/dtos/permission/create-permission.dto';
import { UpdatePermissionDto } from 'libs/dtos/permission/update-permission.dto';
import { IUser } from 'libs/utils/interface';
import { DeleteResult } from 'mongoose';

@Controller()
export class PermissionsMessageController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @MessagePattern('permission.create')
  async create(
    @Payload()
    data: {
      dto: CreatePermissionDto;
      user: IUser;
    },
  ) {
    return await this.permissionsService.create(data.dto, data.user);
  }

  @MessagePattern('permission.findAll')
  async findAll(
    @Payload()
    data: {
      currentPage: number;
      limit: number;
      qs: string;
    },
  ) {
    return await this.permissionsService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @MessagePattern('permission.findOne')
  async findOne(@Payload() id: string) {
    return await this.permissionsService.findOne(id);
  }

  @MessagePattern('permission.update')
  async update(
    @Payload()
    data: {
      id: string;
      dto: UpdatePermissionDto;
      user: IUser;
    },
  ) {
    return await this.permissionsService.update(data.id, data.dto, data.user);
  }

  @MessagePattern('permission.delete')
  async remove(
    @Payload()
    data: {
      id: string;
      user: IUser;
    },
  ): Promise<DeleteResult> {
    return await this.permissionsService.remove(data.id, data.user);
  }
}
