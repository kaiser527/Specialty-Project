import { IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { Method } from 'libs/utils/constants';

export class CreatePermissionDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @Matches(/^\/api\/v1\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_:\-]+)*$/, {
    message: 'INVALID_API_PATH',
  })
  apiPath: string;

  @IsNotEmpty()
  module: string;

  @IsNotEmpty()
  @IsEnum(Method)
  method: Method;
}
