import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  BulkCreateProductDto,
  CreateProductDto,
  GetMinMaxPriceDto,
} from 'libs/dtos/product/create-product.dto';
import {
  SwitchProductAuthorDTO,
  UpdateProductDto,
} from 'libs/dtos/product/update-product.dto';
import { IUser } from 'libs/utils/interface';
import { CartDto } from 'libs/dtos/cart/cart-dto';

@Controller()
export class ProductsGrpcController {
  constructor(private readonly productsService: ProductsService) {}

  @GrpcMethod('ProductService', 'getAllFiles')
  async getAllFiles() {
    const files = await this.productsService.getAllFiles();
    return { files };
  }

  @GrpcMethod('ProductService', 'findAllVariantInit')
  async findAllVariantInit() {
    return await this.productsService.findAllVariantInit();
  }

  @GrpcMethod('ProductService', 'findAllVariant')
  async findAllVariant(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.productsService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
      'variant',
    );
  }

  @GrpcMethod('ProductService', 'findAllProduct')
  async findAllProduct(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    return await this.productsService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
      'product',
    );
  }

  @GrpcMethod('ProductService', 'findAllProductsByUser')
  async findAllProductsByUser(user: IUser) {
    return await this.productsService.findAllProductsByUser(user);
  }

  @GrpcMethod('ProductService', 'createProduct')
  async create(data: CreateProductDto & { user: IUser }) {
    return await this.productsService.create(data, data.user);
  }

  @GrpcMethod('ProductService', 'updateProduct')
  async update(data: UpdateProductDto & { user: IUser; id: string }) {
    return await this.productsService.update(data.id, data, data.user);
  }

  @GrpcMethod('ProductService', 'deleteProduct')
  async delete(data: { id: string; user: IUser }) {
    return await this.productsService.delete(data.id, data.user);
  }

  @GrpcMethod('ProductService', 'findOneProduct')
  async findOne(data: { id: string }) {
    return await this.productsService.findOne(data.id);
  }

  @GrpcMethod('ProductService', 'bulkCreateProduct')
  async bulkCreate(data: { products: BulkCreateProductDto[]; user: IUser }) {
    return await this.productsService.bulkCreate(data.products, data.user);
  }

  @GrpcMethod('ProductService', 'findOneVariant')
  async findOneVariant(data: { id: string; isReview?: boolean }) {
    return await this.productsService.findOneVariant(data.id, data.isReview);
  }

  @GrpcMethod('ProductService', 'findAllVariantForOrderService')
  async findAllVariantForOrderService(data: { variantIds: string[] }) {
    return await this.productsService.finAllVariant(data.variantIds);
  }

  @GrpcMethod('ProductService', 'getMinMaxPriceByVariants')
  async getMinMaxPriceByVariants(data: GetMinMaxPriceDto) {
    return await this.productsService.getMinMaxPriceByVariants(data);
  }

  @GrpcMethod('ProductService', 'updateVariantStock')
  async updateVariantStock(data: { items: CartDto[] }) {
    return await this.productsService.updateVariantStock(data.items);
  }

  @GrpcMethod('ProductService', 'restoreVariantStock')
  async restoreVariantStock(data: { items: CartDto[] }) {
    return await this.productsService.restoreVariantStock(data.items);
  }

  @GrpcMethod('ProductService', 'updateProductCreatedBy')
  async updateProductCreatedBy(data: { oldEmail: string; newEmail: string }) {
    return await this.productsService.updateProductCreatedBy(
      data.oldEmail,
      data.newEmail,
    );
  }

  @GrpcMethod('ProductService', 'switchProductAuthor')
  async switchProductAuthor(data: {
    dto: SwitchProductAuthorDTO;
    user: IUser;
  }) {
    return await this.productsService.switchProductAuthorById(
      data.dto,
      data.user,
    );
  }
}
