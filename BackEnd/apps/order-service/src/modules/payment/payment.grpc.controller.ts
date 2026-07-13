import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/payment.dto';
import { IUser } from 'libs/utils/interface';
import { CreateRenewProductPaymentDto } from 'libs/dtos/payment/renew-payement.dto';

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

  @GrpcMethod('OrderService', 'createRenewVnpayUrl')
  async createRenewVnpayUrl(data: CreateRenewProductPaymentDto) {
    return await this.paymentService.createRenewVnpayUrl(data);
  }

  @GrpcMethod('OrderService', 'verifyReturnUrlForRenewProductVariant')
  async verifyReturnUrlForRenewProductVariant(data: {
    query: VerifyReturnUrlDto;
    user: IUser;
  }) {
    return await this.paymentService.verifyReturnUrlForRenewProductVariant(
      data.query,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'createRenewStripePayment')
  async createRenewStripePayment(data: {
    dto: CreateRenewProductPaymentDto;
    user: IUser;
  }) {
    return await this.paymentService.createRenewStripePayment(
      data.dto,
      data.user,
    );
  }

  @GrpcMethod('OrderService', 'verifyRenewStripePayment')
  async verifyRenewStripePayment(data: { sessionId: string }) {
    return await this.paymentService.verifyRenewStripePayment(data.sessionId);
  }
}
