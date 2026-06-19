import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ProviderFeeStatus } from 'libs/utils/constants';

export class QuickUpdateProviderFeeDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  ownerId: string;

  @IsEnum(ProviderFeeStatus)
  status: ProviderFeeStatus;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}
