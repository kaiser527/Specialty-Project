import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { CreateRoleDto } from 'libs/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'libs/dtos/role/update-role.dto';
import { IUser } from 'libs/utils/interface';
import { DeleteResult } from 'mongoose';

@Controller()
export class RolesMessageController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('role.create')
  async create(
    @Payload()
    data: {
      dto: CreateRoleDto;
      user: IUser;
    },
  ) {
    return await this.rolesService.create(data.dto, data.user);
  }

  @MessagePattern('role.findAll')
  async findAll(
    @Payload()
    data: {
      currentPage: number;
      limit: number;
      qs: string;
    },
  ) {
    return await this.rolesService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @MessagePattern('role.findOne')
  async findOne(@Payload() id: string) {
    return await this.rolesService.findOne(id);
  }

  @MessagePattern('role.update')
  async update(
    @Payload()
    data: {
      id: string;
      dto: UpdateRoleDto;
      user: IUser;
    },
  ) {
    return await this.rolesService.update(data.id, data.dto, data.user);
  }

  @MessagePattern('role.delete')
  async remove(
    @Payload()
    data: {
      id: string;
      user: IUser;
    },
  ): Promise<DeleteResult> {
    return await this.rolesService.remove(data.id, data.user);
  }
}
