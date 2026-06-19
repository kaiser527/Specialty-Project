import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IToken, IUser } from 'libs/utils/interface';
import { randomUUID } from 'crypto';
import { RegisterUserDto } from 'libs/dtos/user/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlacklistToken } from './schemas/blacklist-token.schema';
import { Model } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import { AccountType, TokenType } from 'libs/utils/constants';
import { downloadSocialImage, isValidPassword } from '../../utils/helper';
import {
  ResendOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from 'libs/dtos/auth/auth.dto';
import { UpdateUserClientDto } from 'libs/dtos/user/update-user.dto';
import { userPayload } from 'libs/utils/helpers';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,

    @InjectModel(BlacklistToken.name)
    private blacklistTokenModel: Model<BlacklistToken>,
  ) {}

  validateUser = async (username: string, pass: string) => {
    const user = await this.usersService.findOne(username, 'username', true);
    if (!user) return null;
    if (
      !user.role.isActive ||
      user.accountType !== AccountType.LOCAL ||
      !user.isActive
    )
      return null;
    const isValid = isValidPassword(pass, user.password);
    if (!isValid) return null;
    return await this.attachPermissions(user);
  };

  validateUserSocial = async (user: {
    email: string;
    name: string;
    image: string;
    accountType: AccountType;
  }) => {
    const existingUser = await this.usersService.findOne(
      user.email,
      'username',
      true,
    );

    if (!existingUser) {
      const localImage = await downloadSocialImage(user.image, user.email);
      const createdUser = await this.usersService.register(
        {
          ...user,
          image: localImage,
          password: randomUUID(),
          gender: 'Male',
          address: 'some address',
          age: 20,
        },
        true,
      );

      const newUser = await this.attachPermissions(createdUser as any);

      return {
        user: newUser,
        isNewUser: true,
      };
    }

    if (existingUser.accountType === AccountType.LOCAL) {
      throw new RpcException('Email already registered with password login');
    }

    if (existingUser.accountType !== user.accountType) {
      throw new RpcException('Account registered with different provider');
    }

    const currentUser = await this.attachPermissions(existingUser);

    return {
      user: currentUser,
      isNewUser: false,
    };
  };

  login = async (user: IUser, isRefresh = false) => {
    const accessJTI = randomUUID();
    const refreshJTI = randomUUID();

    const payload: IUser & IToken = {
      sub: isRefresh ? 'token refresh' : 'token login',
      iss: 'from server',
      jti: accessJTI,
      type: TokenType.ACCESS,
      ...userPayload(user),
    };

    delete payload.permissions;

    let refresh_token: string | null = null;

    if (!isRefresh) {
      refresh_token = this.createToken(
        {
          ...payload,
          sub: 'token cookie',
          jti: refreshJTI,
          type: TokenType.REFRESH,
        },
        TokenType.REFRESH,
      );

      await this.usersService.updateUserRefreshToken(
        refresh_token,
        payload._id,
      );
    }

    return {
      access_token: this.createToken(payload, TokenType.ACCESS),
      refresh_token,
      user: userPayload(user),
    };
  };

  register = async (registerUserDto: RegisterUserDto) => {
    return await this.usersService.register(registerUserDto);
  };

  createToken = (payload: any, type: 'ACCESS' | 'REFRESH') => {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        type === TokenType.ACCESS
          ? 'JWT_ACCESS_TOKEN_SECRET'
          : 'JWT_REFRESH_TOKEN_SECRET',
      ),
      expiresIn: +this.configService.get<string>(
        type === TokenType.ACCESS ? 'JWT_EXPIRE_ACCESS' : 'JWT_EXPIRE_REFRESH',
      ),
    });
  };

  processNewToken = async (refreshToken: string) => {
    try {
      const payload: IToken = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      if (payload.type !== TokenType.REFRESH) {
        throw new RpcException('Invalid token type');
      }

      const isBlacklisted = await this.checkTokenBlacklist(payload.jti);
      if (isBlacklisted) {
        throw new RpcException('Refresh token is blacklisted');
      }

      const user: IUser = await this.usersService.findOne(
        refreshToken,
        'token',
      );

      if (!user) {
        throw new RpcException('Refresh token is invalid, please login');
      }

      return this.login(user, true);
    } catch (error) {
      throw new RpcException('Refresh token is invalid, please login');
    }
  };

  logout = async (user: IUser & IToken, refresh_token: string) => {
    try {
      const refreshPayload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      if (user.jti === refreshPayload.jti) {
        throw new RpcException(
          'JTI of refresh and access token cannot be same',
        );
      }

      await this.blacklistTokenModel.insertMany([
        {
          jti: user.jti,
          expiryDate: user.exp,
          type: TokenType.ACCESS,
        },
        {
          jti: refreshPayload.jti,
          expiryDate: new Date(refreshPayload.exp * 1000),
          type: TokenType.REFRESH,
        },
      ]);

      await this.usersService.updateUserRefreshToken('', user._id);

      return { message: 'Logged out' };
    } catch (e) {
      throw new RpcException('Refresh token is invalid, please login');
    }
  };

  checkTokenBlacklist = async (jti: string) => {
    const exists = await this.blacklistTokenModel.exists({ jti });

    return !!exists;
  };

  attachPermissions = async (user: IUser) => {
    if (!user.role?._id) return user;

    const role = await this.rolesService.findOne(user.role._id.toString());

    user.permissions = (role?.permissions ?? []) as any;
    return user;
  };

  validateToken = async (payload: IUser & IToken) => {
    const user = await this.attachPermissions(payload);

    const isBlacklist = await this.checkTokenBlacklist(payload.jti);

    return {
      ...user,
      jti: payload.jti,
      type: payload.type,
      isBlacklist,
      exp: payload.exp,
    };
  };

  resendOtp = async (resendOtpDto: ResendOtpDto) => {
    const { type, email } = resendOtpDto;
    return await this.usersService.resendOtp(
      email,
      type as 'register' | 'reset',
    );
  };

  verifyAccount = async (verifyAccountDto: VerifyAccountDto) => {
    const { otp, email } = verifyAccountDto;
    return await this.usersService.verifyAccount(otp, email, 'register');
  };

  resetPassword = async (resetPasswordDto: ResetPasswordDto) => {
    return await this.usersService.resetPassword(resetPasswordDto);
  };

  updateProfileClient = async (
    UpdateUserClientDto: UpdateUserClientDto,
    user: IUser,
  ) => {
    const profile = await this.usersService.updateProfileClient(
      UpdateUserClientDto,
      user,
    );
    const finalUser = await this.attachPermissions(profile as any);
    return await this.login(finalUser);
  };
}
