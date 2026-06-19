import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/vn-pay-payment.dto';
import { IUser } from 'libs/utils/interface';

@Controller()
export class PaymentGrpcController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('OrderService', 'createPaymentUrl')
  async createPaymentUrl(data: CreateVnPayPaymentDto) {
    return await this.paymentService.createPaymentUrl(data);
  }

  @GrpcMethod('OrderService', 'verifyReturnUrl')
  async verifyReturnUrl(data: VerifyReturnUrlDto & { user: IUser }) {
    return await this.paymentService.verifyReturnUrl(data, data.user);
  }

  @GrpcMethod('OrderService', 'createStripePayment')
  async createStripePayment(data: { orderId: string }) {
    return await this.paymentService.createStripePayment(data.orderId);
  }

  @GrpcMethod('OrderService', 'verifyStripePayment')
  async verifyStripePayment(data: { sessionId: string }) {
    return await this.paymentService.verifyStripePayment(data.sessionId);
  }
}
