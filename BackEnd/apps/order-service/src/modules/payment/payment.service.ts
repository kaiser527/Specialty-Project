import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import { OrdersService } from '../orders/orders.service';
import { RpcException } from '@nestjs/microservices';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/vn-pay-payment.dto';
import Stripe from 'stripe';
import { OrderStatus } from 'libs/utils/constants';
import { IUser } from 'libs/utils/interface';

@Injectable()
export class PaymentService {
  private stripe: Stripe.Stripe;

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  async createPaymentUrl(createPaymentDto: CreateVnPayPaymentDto) {
    const { orderId, ipAddr } = createPaymentDto;

    const order = await this.ordersService.findOneOrder(orderId);

    if (!order) {
      throw new RpcException('Order not found');
    }

    const amount = order.totalPrice;

    const { ProductCode, VnpCurrCode, VnpLocale } = await import('vnpay');

    const USD_TO_VND = 2400;

    const amountVND = Math.round(amount * USD_TO_VND);

    const paymentData = {
      vnp_Amount: amountVND,
      vnp_CurrCode: VnpCurrCode.VND,
      vnp_IpAddr: ipAddr,
      vnp_Locale: VnpLocale.EN,
      vnp_OrderInfo: `Payment for order ${orderId}. Amount ${amount}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.configService.get<string>('VNP_RETURN_URL'),
      vnp_TxnRef: orderId,
    };

    try {
      const paymentUrl = this.vnpayService.buildPaymentUrl(paymentData);

      return {
        code: '00',
        message: 'Success',
        paymentUrl,
      };
    } catch (error) {
      await this.ordersService.updateOrderStatusFailed(order.id);

      throw new RpcException(
        error instanceof Error
          ? error.message
          : 'Failed to generate payment URL',
      );
    }
  }

  async verifyReturnUrl(query: VerifyReturnUrlDto, user: IUser) {
    //@ts-ignore
    delete query.user;

    const result = await this.vnpayService.verifyReturnUrl(query);
    const orderId = result.vnp_TxnRef;

    let isError = false;

    if (!result.isSuccess) {
      await this.ordersService.updateOrderStatus(
        orderId,
        OrderStatus.FAILED,
        user,
      );
      isError = true;
    }

    return { isError };
  }

  async createStripePayment(orderId: string) {
    const order = await this.ordersService.findOneOrder(orderId);

    if (!order) {
      throw new RpcException('Order not found');
    }

    const amount = order.totalPrice;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        locale: 'en',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Order ${orderId}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { orderId },
        success_url: `http://localhost:3069/api/v1/payment/stripe/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3069/api/v1/payment/stripe/verify?orderId=${orderId}`,
      });

      return {
        code: '00',
        message: 'Success',
        paymentUrl: session.url,
      };
    } catch (error) {
      await this.ordersService.updateOrderStatusFailed(order.id);

      throw new RpcException(
        error instanceof Error
          ? error.message
          : 'Failed to create Stripe checkout session',
      );
    }
  }

  async verifyStripePayment(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return { isError: true };
    }

    const isPaid =
      session.payment_status === 'paid' && session.status === 'complete';

    if (!isPaid) {
      return { isError: true };
    }

    return { isError: false };
  }
}
