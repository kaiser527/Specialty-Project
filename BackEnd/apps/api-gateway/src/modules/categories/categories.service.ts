import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, ProductService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { CreateCategoryDto } from 'libs/dtos/category/create-category.dto';
import { UpdateCategoryDto } from 'libs/dtos/category/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@Inject('PRODUCT_SERVICE') private client: ClientGrpc) {}

  private productService: ProductService;

  onModuleInit() {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.productService.findAllCategory({ currentPage, limit, qs }),
    );
  }

  async create(dto: CreateCategoryDto, user: IUser) {
    return await grpcCall(this.productService.createCategory({ ...dto, user }));
  }

  async update(id: string, dto: UpdateCategoryDto, user: IUser) {
    return await grpcCall(
      this.productService.updateCategory({ id, ...dto, user }),
    );
  }

  async delete(id: string, user: IUser) {
    return await grpcCall(this.productService.deleteCategory({ id, user }));
  }
}
