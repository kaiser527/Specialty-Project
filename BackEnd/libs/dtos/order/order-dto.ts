import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  variantId: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unitPrice: number;
}

export class OrderDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  paymentRef: string;

  @IsNotEmpty()
  shippingFee: number;

  @IsNotEmpty()
  subTotal: number;

  @IsNotEmpty()
  totalPrice: number;

  @IsOptional()
  voucherCode?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class DashboardDto {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsNotEmpty()
  @IsEnum(['day', 'month'])
  groupBy: 'day' | 'month';
}
