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
import { ProductsService } from './products.service';
import { Public, ResponseMessage, User } from '../../utils/decorator.customize';
import {
  BulkCreateProductDto,
  CreateProductDto,
  GetMinMaxPriceDto,
} from 'libs/dtos/product/create-product.dto';
import { IUser } from 'libs/utils/interface';
import {
  SwitchProductAuthorDto,
  UpdateProductDto,
} from 'libs/dtos/product/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ResponseMessage('Fetch product paginate')
  findAllProduct(@Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    const qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    return this.productsService.findAllProduct(+current, +pageSize, qs);
  }

  @Get('variants')
  @Public()
  @ResponseMessage('Fetch variant paginate')
  findAllVariant(@Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    const qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    return this.productsService.findAllVariant(+current, +pageSize, qs);
  }

  @Post('min_max')
  @Public()
  @ResponseMessage('Get min max price by variants')
  getMinMax(@Body() dto: GetMinMaxPriceDto) {
    return this.productsService.getMinMaxPriceByVariants(dto);
  }

  @Post()
  @ResponseMessage('Create product')
  create(@Body() dto: CreateProductDto, @User() user: IUser) {
    return this.productsService.create(dto, user);
  }

  @Patch(':id')
  @ResponseMessage('Update product')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @User() user: IUser,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete product')
  delete(@Param('id') id: string, @User() user: IUser) {
    return this.productsService.delete(id, user);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Find product by id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post('import')
  @ResponseMessage('Import product csv')
  bulkCreate(@Body() dtos: BulkCreateProductDto[], @User() user: IUser) {
    return this.productsService.bulkCreate(dtos, user);
  }

  @Patch('switch/switch-author')
  @ResponseMessage('Switch product author')
  switchAuthor(@Body() dto: SwitchProductAuthorDto, @User() user: IUser) {
    return this.productsService.switchProductAuthor(dto, user);
  }

  @Get('variants/:id')
  @Public()
  @ResponseMessage('Find variant by id')
  findOneVariant(@Param('id') id: string) {
    return this.productsService.findOneVariant(id);
  }

  @Post('variants-by-ids')
  @Public()
  @ResponseMessage('Find variants by ids')
  findAllVariantsByIds(@Body('variantIds') variantIds: string[]) {
    return this.productsService.findAllVariants(variantIds);
  }
}
