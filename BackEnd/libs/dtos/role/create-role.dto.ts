import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsMongoId({ each: true })
  permissions: Types.ObjectId[];
}
