import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto, CreateVariantDto } from './create-product.dto';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @IsNotEmpty()
  id: string;
}

export class UpdateProductDto extends OmitType(CreateProductDto, [
  'variants',
] as const) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants: UpdateVariantDto[];
}

export class SwitchProductAuthorDTO {
  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  newAuthorEmail: string;
}
