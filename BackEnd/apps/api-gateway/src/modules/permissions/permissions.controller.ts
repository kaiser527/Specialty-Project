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
import { ResponseMessage, User } from '../../utils/decorator.customize';
import { CreatePermissionDto } from 'libs/dtos/permission/create-permission.dto';
import { IUser } from 'libs/utils/interface';
import { UpdatePermissionDto } from 'libs/dtos/permission/update-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ResponseMessage('Create Permission')
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @User() user: IUser,
  ) {
    return this.permissionsService.create({ dto: createPermissionDto, user });
  }

  @Get()
  @ResponseMessage('Fetch Permission Paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.permissionsService.findAll({
      currentPage: +currentPage,
      limit: +limit,
      qs,
    });
  }

  @Get(':id')
  @ResponseMessage('Fetch Permission by id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update Permission')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @User() user: IUser,
  ) {
    return this.permissionsService.update({
      id,
      dto: updatePermissionDto,
      user,
    });
  }

  @Delete(':id')
  @ResponseMessage('Delete Permission')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.permissionsService.delete({ id, user });
  }
}
