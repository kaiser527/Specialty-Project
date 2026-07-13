import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IUser, ProductService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import {
  BulkCreateProductDto,
  CreateProductDto,
  GetMinMaxPriceDto,
} from 'libs/dtos/product/create-product.dto';
import {
  SwitchProductAuthorDto,
  UpdateProductDto,
} from 'libs/dtos/product/update-product.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    private readonly socketGateway: SocketGateway,

    @Inject('PRODUCT_SERVICE') private client: ClientGrpc,
  ) {}

  private productService: ProductService;

  onModuleInit() {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async getAllFiles() {
    const result: any = await grpcCall(this.productService.getAllFiles({}));
    return result.files;
  }

  async findAllVariant(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.productService.findAllVariant({ currentPage, limit, qs }),
    );
  }

  async findAllProduct(currentPage: number, limit: number, qs: string) {
    return await grpcCall(
      this.productService.findAllProduct({ currentPage, limit, qs }),
    );
  }

  async create(dto: CreateProductDto, user: IUser) {
    return await grpcCall(this.productService.createProduct({ ...dto, user }));
  }

  async update(id: string, dto: UpdateProductDto, user: IUser) {
    const result = await grpcCall(
      this.productService.updateProduct({ id, ...dto, user }),
    );
    await this.socketGateway.emitFindAllProviderFeeUpdate();
    return result;
  }

  async delete(id: string, user: IUser) {
    return await grpcCall(this.productService.deleteProduct({ id, user }));
  }

  async findOne(id: string) {
    return await grpcCall(this.productService.findOneProduct({ id }));
  }

  async bulkCreate(dtos: BulkCreateProductDto[], user: IUser) {
    return await grpcCall(
      this.productService.bulkCreateProduct({ products: dtos, user }),
    );
  }

  async getMinMaxPriceByVariants(dto: GetMinMaxPriceDto) {
    return await grpcCall(this.productService.getMinMaxPriceByVariants(dto));
  }

  async findOneVariant(id: string) {
    return await grpcCall(
      this.productService.findOneVariant({ id, isReview: true }),
    );
  }

  async switchProductAuthor(dto: SwitchProductAuthorDto, user: IUser) {
    return await grpcCall(
      this.productService.switchProductAuthor({ dto, user }),
    );
  }

  async findAllVariants(variantIds: string[]) {
    return await grpcCall(
      this.productService.findAllVariantForOrderService({ variantIds }),
    );
  }
}
