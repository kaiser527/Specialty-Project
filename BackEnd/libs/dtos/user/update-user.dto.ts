import { OmitType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'password',
  'accountType',
  'email',
] as const) {}

export class UpdateUserClientDto extends OmitType(CreateUserDto, [
  'role',
  'isActive',
  'accountType',
  'password',
] as const) {
  @IsOptional()
  newPassword?: string;
}
