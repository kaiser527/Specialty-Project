import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

export class CartDto {
  @IsNotEmpty()
  variantId: string;

  @IsNotEmpty()
  quantity: number;
}

export class MergeCartDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CartDto)
  items: CartDto[];
}
