import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterUserDto } from 'libs/dtos/user/create-user.dto';
import { IToken, IUser } from 'libs/utils/interface';
import { AccountType } from 'libs/utils/constants';
import {
  ResendOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from 'libs/dtos/auth/auth.dto';
import { UpdateUserClientDto } from 'libs/dtos/user/update-user.dto';

@Controller()
export class AuthMessageController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.validateUser')
  async validateUser(@Payload() data: { username: string; password: string }) {
    return await this.authService.validateUser(data.username, data.password);
  }

  @MessagePattern('auth.validateUserSocial')
  async validateUserSocial(
    @Payload()
    data: {
      email: string;
      name: string;
      image: string;
      accountType: AccountType;
    },
  ) {
    return await this.authService.validateUserSocial(data);
  }

  @MessagePattern('auth.login')
  async login(@Payload() user: IUser) {
    return await this.authService.login(user);
  }

  @MessagePattern('auth.register')
  async register(@Payload() dto: RegisterUserDto) {
    return await this.authService.register(dto);
  }

  @MessagePattern('auth.checkTokenBlacklist')
  async checkTokenBlacklist(jti: string) {
    return await this.authService.checkTokenBlacklist(jti);
  }

  @MessagePattern('auth.refresh')
  async refresh(@Payload() refresh_token: string) {
    return await this.authService.processNewToken(refresh_token);
  }

  @MessagePattern('auth.logout')
  async logout(
    @Payload() data: { user: IUser & IToken; refresh_token: string },
  ) {
    return await this.authService.logout(data.user, data.refresh_token);
  }

  @MessagePattern('auth.updateProfile')
  async updateProfile(
    @Payload() data: { dto: UpdateUserClientDto; user: IUser },
  ) {
    return await this.authService.updateProfileClient(data.dto, data.user);
  }

  @MessagePattern('auth.validateToken')
  async validateToken(@Payload() payload: IToken & IUser) {
    return await this.authService.validateToken(payload);
  }

  @MessagePattern('auth.resendOtp')
  async resendOtp(@Payload() resendOtpDto: ResendOtpDto) {
    return await this.authService.resendOtp(resendOtpDto);
  }

  @MessagePattern('auth.verifyAccount')
  async verifyAccount(@Payload() verifyAccountDto: VerifyAccountDto) {
    return await this.authService.verifyAccount(verifyAccountDto);
  }

  @MessagePattern('auth.resetPassword')
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
