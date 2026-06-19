import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { AccountType } from 'libs/utils/constants';
import { Types } from 'mongoose';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsMongoId()
  role: Types.ObjectId;

  @IsNotEmpty()
  address: string;

  @IsOptional()
  image: string;

  @IsOptional()
  isActive: boolean;

  @IsNotEmpty()
  gender: string;

  @IsNotEmpty()
  @IsNumber()
  age: number;

  @IsNotEmpty()
  @IsEnum(AccountType)
  accountType: AccountType;
}

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  image: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  gender: string;

  @IsNotEmpty()
  @IsNumber()
  age: number;

  @IsOptional()
  @IsEnum(AccountType)
  accountType: AccountType;
}
