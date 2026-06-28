import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from 'libs/utils/constants';
import { OmitType } from '@nestjs/mapped-types';

export class CreateVariantDto {
  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  stock: number;

  @IsNotEmpty()
  @Min(0)
  @Max(100)
  discount: number;

  @IsNotEmpty()
  @IsObject()
  attributes: Record<string, string>;

  @Transform(({ value }) => value ?? [])
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  images: string[] = [];

  @IsOptional()
  dueDate?: Date;
}

export class CreateVariantBulkDto extends OmitType(CreateVariantDto, [
  'dueDate',
  'discount',
  'images',
] as const) {}

export class CreateProductDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  brand: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  categoryId: string;

  @IsNotEmpty()
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsNotEmpty()
  thumbnail: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class BulkCreateProductDto extends OmitType(CreateProductDto, [
  'categoryId',
  'status',
  'variants',
  'thumbnail',
] as const) {
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantBulkDto)
  variants: CreateVariantBulkDto[];
}

export class GetMinMaxPriceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  search?: string;

  @IsOptional()
  nameRegex?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brands?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  names?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  createdBy?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  updatedBy?: string[];

  @IsOptional()
  @IsArray()
  createdAtOperators?: {
    operator: string;
    value: string;
  }[];

  @IsOptional()
  @IsArray()
  updatedAtOperators?: {
    operator: string;
    value: string;
  }[];

  @IsOptional()
  @IsArray()
  priceOperators?: {
    operator: string;
    value: number;
  }[];

  @IsOptional()
  @IsArray()
  dueDateOperators?: {
    operator: string;
    value: string;
  }[];

  @IsOptional()
  @IsBoolean()
  isQueryBrand?: boolean;
}
