import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public, ResponseMessage, User } from '../../utils/decorator.customize';
import { CreateCategoryDto } from 'libs/dtos/category/create-category.dto';
import { IUser } from 'libs/utils/interface';
import { UpdateCategoryDto } from 'libs/dtos/category/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ResponseMessage('Fetch categories paginate')
  findAll(@Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    const qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    return this.categoriesService.findAll(+current, +pageSize, qs);
  }

  @Post()
  @ResponseMessage('Create Category')
  create(@Body() dto: CreateCategoryDto, @User() user: IUser) {
    return this.categoriesService.create(dto, user);
  }

  @Patch(':id')
  @ResponseMessage('Update Category')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @User() user: IUser,
  ) {
    return this.categoriesService.update(id, dto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete Category')
  delete(@Param('id') id: string, @User() user: IUser) {
    return this.categoriesService.delete(id, user);
  }
}
