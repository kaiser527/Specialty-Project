import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRenewProductPaymentDto {
  @IsNotEmpty()
  @IsIn(['3', '6', '12', '24'], {
    message: 'planId must be one of: 3, 6, 12, 24',
  })
  planId: '3' | '6' | '12' | '24';

  @IsNotEmpty()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  variantIds: string[];

  @IsNotEmpty()
  dueDate: string;

  @IsOptional()
  ipAddr: string;
}
