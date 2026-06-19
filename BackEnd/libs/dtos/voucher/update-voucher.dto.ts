import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherDto } from './create-voucher.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
