import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
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

export class SwitchProductAuthorDto {
  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  newAuthorEmail: string;
}

export class RenewVariantsDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  variantIds: string[];

  @IsNotEmpty()
  dueDate: string;
}
