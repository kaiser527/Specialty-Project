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
import { UsersService } from './users.service';
import { ResponseMessage, User } from '../../utils/decorator.customize';
import { CreateUserDto } from 'libs/dtos/user/create-user.dto';
import { IUser } from 'libs/utils/interface';
import { UpdateUserDto } from 'libs/dtos/user/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('Create user')
  create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    return this.usersService.create({ dto: createUserDto, user });
  }

  @Get()
  @ResponseMessage('Fetch user Paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.findAll({
      currentPage: +currentPage,
      limit: +limit,
      qs,
    });
  }

  @Patch(':id')
  @ResponseMessage('Update user')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUser,
  ) {
    return this.usersService.update({ id, dto: updateUserDto, user });
  }

  @Get(':id')
  @ResponseMessage('Find user by id')
  findById(@Param('id') id: string) {
    return this.usersService.findById({ id, isCreate: false });
  }

  @Delete(':id')
  @ResponseMessage('Delete user')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.delete({ id, user });
  }
}
