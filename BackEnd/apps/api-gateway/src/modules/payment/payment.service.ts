import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/vn-pay-payment.dto';
import { IUser, OrderService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from 'libs/utils/constants';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class PaymentService implements OnModuleInit {
  private orderService: OrderService;

  constructor(
    @Inject('ORDER_SERVICE') private client: ClientGrpc,

    private readonly configService: ConfigService,
    private readonly socketGateway: SocketGateway,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderService>('OrderService');
  }

  async createPayment(dto: CreateVnPayPaymentDto, req: Request) {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    dto.ipAddr = ipAddr.toString();
    return await grpcCall(this.orderService.createPaymentUrl({ ...dto }));
  }

  async vnpayReturn(dto: VerifyReturnUrlDto, user: IUser, res: Response) {
    try {
      const result: any = await grpcCall(
        this.orderService.verifyReturnUrl({ ...dto, user }),
      );
      const isError = result.isError as boolean;
      if (isError) {
        res.redirect(
          `${this.configService.get<string>('REACT_URL')}redirect?status=failed&isPayment=true`,
        );
      } else {
        res.redirect(
          `${this.configService.get<string>('REACT_URL')}redirect?status=success&isPayment=true`,
        );
      }
      await this.socketGateway.emitOrderUpdate();
      await this.socketGateway.emitFindAllOrderUserUpdate();
      await this.socketGateway.emitFindAllOrderUpdate();
    } catch (error) {
      res.redirect(
        `${this.configService.get<string>('REACT_URL')}redirect?status=failed&isPayment=true&error=${error.message}`,
      );
    }
  }

  async createStripePayment(dto: CreateVnPayPaymentDto) {
    return await grpcCall(this.orderService.createStripePayment({ ...dto }));
  }

  async verifyStripePayment(
    sessionId: string,
    user: IUser,
    res: Response,
    orderId: string,
  ) {
    try {
      if (orderId) {
        await grpcCall(
          this.orderService.updateOrderStatus({
            id: orderId,
            status: OrderStatus.FAILED,
            user,
          }),
        );
        res.redirect(
          `${this.configService.get<string>('REACT_URL')}redirect?status=failed&isPayment=true`,
        );
      } else {
        const result: any = await grpcCall(
          this.orderService.verifyStripePayment({ sessionId }),
        );
        const isError = result.isError as boolean;
        if (!isError) {
          res.redirect(
            `${this.configService.get<string>('REACT_URL')}redirect?status=success&isPayment=true`,
          );
        } else {
          res.redirect(
            `${this.configService.get<string>('REACT_URL')}redirect?status=failed&isPayment=true`,
          );
        }
      }
      await this.socketGateway.emitOrderUpdate();
      await this.socketGateway.emitFindAllOrderUpdate();
      await this.socketGateway.emitFindAllOrderUserUpdate();
    } catch (error) {
      res.redirect(
        `${this.configService.get<string>('REACT_URL')}redirect?status=failed&isPayment=true&error=${error.message}`,
      );
    }
  }
}
