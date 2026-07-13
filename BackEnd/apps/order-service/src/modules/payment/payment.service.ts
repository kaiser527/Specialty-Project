import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import { OrdersService } from '../orders/orders.service';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/payment.dto';
import Stripe from 'stripe';
import { OrderStatus, planMap } from 'libs/utils/constants';
import { IUser, ProductService } from 'libs/utils/interface';
import { CreateRenewProductPaymentDto } from 'libs/dtos/payment/renew-payement.dto';
import { lastValueFrom } from 'rxjs';
import { RenewVariantsDto } from 'libs/dtos/product/update-product.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService implements OnModuleInit {
  private productService: ProductService;
  private stripe: Stripe.Stripe;

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,

    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  onModuleInit() {
    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');
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

  async createRenewVnpayUrl(dto: CreateRenewProductPaymentDto) {
    const { planId, ipAddr, variantIds, dueDate } = dto;

    const amount = planMap[planId];

    const USD_TO_VND = 24000;

    const amountVND = Math.round(amount * USD_TO_VND);

    const { ProductCode, VnpCurrCode, VnpLocale } = await import('vnpay');

    const payload = JSON.stringify({ id: randomUUID(), variantIds, dueDate });

    const paymentData = {
      vnp_Amount: amountVND,
      vnp_CurrCode: VnpCurrCode.VND,
      vnp_IpAddr: ipAddr,
      vnp_Locale: VnpLocale.EN,
      vnp_OrderInfo: `Payment for renew product variant with planId ${planId}. Amount ${amount}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.configService.get<string>('VNP_RETURN_URL'),
      vnp_TxnRef: payload,
    };

    try {
      const paymentUrl = this.vnpayService.buildPaymentUrl(paymentData);

      return {
        code: '00',
        message: 'Success',
        paymentUrl,
      };
    } catch (error) {
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

  async verifyReturnUrlForRenewProductVariant(
    query: VerifyReturnUrlDto,
    user: IUser,
  ) {
    const result = await this.vnpayService.verifyReturnUrl(query);
    const payload: RenewVariantsDto & { id: string } = JSON.parse(
      result.vnp_TxnRef,
    );

    delete payload.id;

    let isError = true;

    if (result.isSuccess) {
      try {
        await lastValueFrom(
          this.productService.renewVariantsByAuthor({ dto: payload, user }),
        );
        isError = false;
      } catch (error) {
        throw new RpcException(
          error instanceof Error
            ? error.message
            : 'Failed to create Stripe checkout session',
        );
      }
    }

    return { isError };
  }

  async createStripePayment(orderId: string) {
    const order = await this.ordersService.findOneOrder(orderId);

    if (!order) {
      throw new RpcException('Order not found');
    }

    const amount = order.totalPrice;

    const url = this.configService.get<string>('STRIPE_RETURN_URL');

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
        success_url: `${url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url}?orderId=${orderId}`,
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

  async createRenewStripePayment(
    dto: CreateRenewProductPaymentDto,
    user: IUser,
  ) {
    const { planId, variantIds, dueDate } = dto;

    const amount = planMap[planId];

    const payload = JSON.stringify({ variantIds, dueDate });
    const userData = JSON.stringify(user);

    const url =
      'http://localhost:3069/api/v1/payment/renew/stripe/verify?session_id={CHECKOUT_SESSION_ID}';

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
                name: `Payment for renew product variant with planId ${planId}. Amount ${amount}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { payload, user: userData },
        success_url: url,
        cancel_url: url,
      });

      return {
        code: '00',
        message: 'Success',
        paymentUrl: session.url,
      };
    } catch (error) {
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

  async verifyRenewStripePayment(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    const isPaid =
      session.payment_status === 'paid' && session.status === 'complete';

    if (!isPaid) {
      return { isError: true };
    }

    const payload: RenewVariantsDto = JSON.parse(session.metadata?.payload);
    const user: IUser = JSON.parse(session.metadata?.user);

    try {
      await lastValueFrom(
        this.productService.renewVariantsByAuthor({ dto: payload, user }),
      );
    } catch (error) {
      return { isError: true };
    }

    return { isError: false };
  }
}
