import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Request, Response } from 'express';
import {
  Public,
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import { IToken, IUser } from 'libs/utils/interface';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RegisterUserDto } from 'libs/dtos/user/create-user.dto';
import { userPayload } from 'libs/utils/helpers';
import {
  ResendOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from 'libs/dtos/auth/auth.dto';
import { UpdateUserClientDto } from 'libs/dtos/user/update-user.dto';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { FacebookAuthGuard } from './guard/facebook-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('/login')
  @Public()
  @ResponseMessage('User login')
  @UseGuards(LocalAuthGuard)
  async handleLogin(
    @User() user: IUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);
    res.cookie('refresh_token', result.refresh_token, {
      maxAge: +this.configService.get<string>('JWT_EXPIRE_REFRESH') * 1000,
      httpOnly: true,
    });
    delete result.refresh_token;
    return result;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ResponseMessage('User login google')
  @Get('/google/login')
  handleLoginGoogle() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ResponseMessage('Redirect user login google')
  @Get('/google/redirect')
  async handleGoogleRedirect(@User() user: IUser, @Res() response: Response) {
    const result = await this.authService.login(user);
    response.cookie('refresh_token', result.refresh_token, {
      maxAge: +this.configService.get<string>('JWT_EXPIRE_REFRESH') * 1000,
      httpOnly: true,
    });
    response.redirect(
      `${this.configService.get<string>('REACT_URL')}redirect?status=success`,
    );
  }

  @Public()
  @UseGuards(FacebookAuthGuard)
  @ResponseMessage('User login facebook')
  @Get('/facebook/login')
  handleLoginFacebook() {}

  @Public()
  @UseGuards(FacebookAuthGuard)
  @ResponseMessage('Redirect user login facebook')
  @Get('/facebook/redirect')
  async handleFacebookRedirect(@User() user: IUser, @Res() response: Response) {
    const result = await this.authService.login(user);
    response.cookie('refresh_token', result.refresh_token, {
      maxAge: +this.configService.get<string>('JWT_EXPIRE_REFRESH') * 1000,
      httpOnly: true,
    });
    response.redirect(
      `${this.configService.get<string>('REACT_URL')}redirect?status=success`,
    );
  }

  @ResponseMessage('Get User Info')
  @Get('/account')
  @SkipPermission()
  async handleGetAccount(@User() user: IUser) {
    return { user: userPayload(user) };
  }

  @Public()
  @ResponseMessage('Refresh User token')
  @Get('/refresh')
  async handleRefreshToken(@Req() request: Request) {
    const refresh_token = request.cookies['refresh_token'];
    return this.authService.refresh(refresh_token);
  }

  @ResponseMessage('User logout')
  @SkipPermission()
  @Post('/logout')
  async handleLogout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser & IToken,
  ) {
    const refresh_token = request.cookies['refresh_token'];
    const result = await this.authService.logout(user, refresh_token);
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return result;
  }

  @Public()
  @ResponseMessage('User register')
  @Post('/register')
  async handleRegister(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @ResponseMessage('Resend otp')
  @Post('/resend')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Public()
  @ResponseMessage('Verify account')
  @Post('/verify')
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.authService.verifyAccount(verifyAccountDto);
  }

  @Public()
  @ResponseMessage('Reset account password')
  @Post('/reset')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('/profile')
  @ResponseMessage('Update user profile')
  @SkipPermission()
  async updateUserProfile(
    @Body() UpdateUserClientDto: UpdateUserClientDto,
    @User() user: IUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.updateProfile(
      UpdateUserClientDto,
      user,
    );
    res.cookie('refresh_token', result.refresh_token, {
      maxAge: +this.configService.get<string>('JWT_EXPIRE_REFRESH') * 1000,
      httpOnly: true,
    });
    delete result.refresh_token;
    return result;
  }
}
