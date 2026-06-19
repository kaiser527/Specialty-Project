import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ResendOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from 'libs/dtos/auth/auth.dto';
import { RegisterUserDto } from 'libs/dtos/user/create-user.dto';
import { IToken, IUser } from 'libs/utils/interface';
import { UpdateUserClientDto } from 'libs/dtos/user/update-user.dto';
import { handleRpcRedis } from '../../utils/helper';
import { AccountType } from 'libs/utils/constants';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class AuthService {
  constructor(
    private socket: SocketGateway,

    @Inject('IDENTITY_SERVICE') private authClient: ClientProxy,
  ) {}

  async validateUser(username: string, password: string) {
    return handleRpcRedis(this.authClient, 'auth.validateUser', {
      username,
      password,
    });
  }

  async validateUserSocial(data: {
    email: string;
    name: string;
    image: string;
    accountType: AccountType;
  }) {
    const result = await handleRpcRedis(
      this.authClient,
      'auth.validateUserSocial',
      data,
    );
    if (result.isNewUser) {
      await this.socket.emitUserRoleChartUpdate();
    }
    return result.user;
  }

  async login(user: IUser) {
    return handleRpcRedis(this.authClient, 'auth.login', user);
  }

  async register(dto: RegisterUserDto) {
    const result = await handleRpcRedis(this.authClient, 'auth.register', dto);
    await this.socket.emitUserRoleChartUpdate();
    return result;
  }

  async refresh(refresh_token: string) {
    return handleRpcRedis(this.authClient, 'auth.refresh', refresh_token);
  }

  async logout(user: IUser & IToken, refresh_token: string) {
    return handleRpcRedis(this.authClient, 'auth.logout', {
      user,
      refresh_token,
    });
  }

  async validateToken(payload: IToken & IUser) {
    return handleRpcRedis(this.authClient, 'auth.validateToken', payload);
  }

  async updateProfile(dto: UpdateUserClientDto, user: IUser) {
    return handleRpcRedis(this.authClient, 'auth.updateProfile', { dto, user });
  }

  async resendOtp(dto: ResendOtpDto) {
    return handleRpcRedis(this.authClient, 'auth.resendOtp', dto);
  }

  async verifyAccount(dto: VerifyAccountDto) {
    return handleRpcRedis(this.authClient, 'auth.verifyAccount', dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return handleRpcRedis(this.authClient, 'auth.resetPassword', dto);
  }

  async checkTokenBlacklist(jti: string) {
    return handleRpcRedis(this.authClient, 'auth.checkTokenBlacklist', jti);
  }
}
