import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  Public,
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/payment.dto';
import { Request, Response } from 'express';
import { IUser } from 'libs/utils/interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateRenewProductPaymentDto } from 'libs/dtos/payment/renew-payement.dto';
import { validate as isUUID } from 'uuid';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('vnpay')
  @SkipPermission()
  @ResponseMessage('Pay with Vnpay')
  async createPayment(
    @Body() createPaymentDto: CreateVnPayPaymentDto,
    @Req() req: Request,
  ) {
    return this.paymentService.createPayment(createPaymentDto, req);
  }

  @Post('renew/vnpay')
  @SkipPermission()
  @ResponseMessage('Renew with Vnpay')
  async createRenewPayment(
    @Body() createPaymentDto: CreateRenewProductPaymentDto,
    @Req() req: Request,
  ) {
    return this.paymentService.createRenewVnpayUrl(createPaymentDto, req);
  }

  @Post('renew/stripe')
  @SkipPermission()
  @ResponseMessage('Renew with Stripe')
  async createRenewStripePayment(
    @Body() createPaymentDto: CreateRenewProductPaymentDto,
    @User() user: IUser,
  ) {
    return this.paymentService.createRenewStripePayment(createPaymentDto, user);
  }

  @Post('stripe')
  @SkipPermission()
  @ResponseMessage('Pay with stripe')
  async createStripePayment(@Body() createPaymentDto: CreateVnPayPaymentDto) {
    return this.paymentService.createStripePayment(createPaymentDto);
  }

  @Get('stripe/verify')
  @Public()
  @ResponseMessage('Pay with stripe')
  async verifyStripePayment(
    @Query('session_id') sessionId: string,
    @Query('orderId') orderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refresh_token = req.cookies['refresh_token'];
    const payload = this.jwtService.verify(refresh_token, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    }) as IUser;
    return this.paymentService.verifyStripePayment(
      sessionId,
      payload,
      res,
      orderId,
    );
  }

  @Get('/renew/stripe/verify')
  @Public()
  @ResponseMessage('Pay with stripe')
  async verifyRenewStripePayment(
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    return this.paymentService.verifyRenewStripePayment(sessionId, res);
  }

  @Get('vnpay-return')
  @ResponseMessage('Vnpay redirect')
  @Public()
  async vnpayReturn(
    @Query() query: VerifyReturnUrlDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const refresh_token = req.cookies['refresh_token'];
    const payload = this.jwtService.verify(refresh_token, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    }) as IUser;

    if (isUUID(query.vnp_TxnRef)) {
      return this.paymentService.vnpayReturn(query, payload, res);
    } else {
      return this.paymentService.verifyReturnUrlForRenewProductVariant(
        query,
        payload,
        res,
      );
    }
  }
}
