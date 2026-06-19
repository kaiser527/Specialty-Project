import { IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyAccountDto {
  @IsNotEmpty()
  otp: string;

  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  confirmedPassword: string;

  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  type: string;
}
