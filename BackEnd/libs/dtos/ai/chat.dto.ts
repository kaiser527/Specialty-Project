import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class RoleDto {
  @IsNotEmpty()
  _id: string;

  @IsNotEmpty()
  name: string;

  isActive: boolean;
}

export class UserDto {
  @IsNotEmpty()
  _id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  image: string;

  @ValidateNested()
  @Type(() => RoleDto)
  role: RoleDto;

  accountType: number;
}

export class ChatDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto;
}
