import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ResponseMessage, User } from '../../utils/decorator.customize';
import { CreateRoleDto } from 'libs/dtos/role/create-role.dto';
import { IUser } from 'libs/utils/interface';
import { UpdateRoleDto } from 'libs/dtos/role/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ResponseMessage('Create role')
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    return this.rolesService.create({ dto: createRoleDto, user });
  }

  @Get()
  @ResponseMessage('Fetch Role Paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.rolesService.findAll({
      currentPage: +currentPage,
      limit: +limit,
      qs,
    });
  }

  @Get(':id')
  @ResponseMessage('Fetch Role by id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update Role')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: IUser,
  ) {
    return this.rolesService.update({ id, dto: updateRoleDto, user });
  }

  @Delete(':id')
  @ResponseMessage('Delete Role')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.delete({ id, user });
  }
}
