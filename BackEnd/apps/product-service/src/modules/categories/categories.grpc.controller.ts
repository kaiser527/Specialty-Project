import { Controller } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateCategoryDto } from 'libs/dtos/category/create-category.dto';
import { UpdateCategoryDto } from 'libs/dtos/category/update-category.dto';
import { IUser } from 'libs/utils/interface';

@Controller()
export class CategoriesGrpcController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @GrpcMethod('ProductService', 'findAllCategory')
  async findAll(data: { currentPage: number; limit: number; qs: string }) {
    return await this.categoriesService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('ProductService', 'createCategory')
  async create(data: CreateCategoryDto & { user: IUser }) {
    return await this.categoriesService.create(data, data.user);
  }

  @GrpcMethod('ProductService', 'updateCategory')
  async update(data: UpdateCategoryDto & { user: IUser; id: string }) {
    return await this.categoriesService.update(data.id, data, data.user);
  }

  @GrpcMethod('ProductService', 'deleteCategory')
  async delete(data: { id: string; user: IUser }) {
    return await this.categoriesService.delete(data.id, data.user);
  }
}
