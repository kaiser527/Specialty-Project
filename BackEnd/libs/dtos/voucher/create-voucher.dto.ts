import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVoucherDto {
  @IsNotEmpty()
  discountAmount: number;

  @IsNotEmpty()
  expirationDate: Date;

  @IsOptional()
  active?: boolean;

  @IsOptional()
  @IsString()
  code?: string;
}

export class FetchVoucherByCodeDTO {
  @IsNotEmpty()
  @IsString()
  code: string;
}
