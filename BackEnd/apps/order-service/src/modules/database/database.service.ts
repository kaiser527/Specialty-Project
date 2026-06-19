import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/orders.entity';
import { OrderItem } from '../orders/entities/order-items.entity';
import { ProviderFee } from '../providers/entities/provider-fees.entity';
import { ProviderOrder } from '../providers/entities/provider-order.entity';
import { INIT_ORDERS } from './sample/order';
import { INIT_ORDER_ITEMS } from './sample/order-item';
import { INIT_PROVIDER_FEES } from './sample/provider-fee';
import { INIT_PROVIDER_ORDER } from './sample/provider-order';
import { Voucher } from '../vouchers/entities/vouchers.entities';
import { INIT_VOUCHERS } from './sample/voucher';
import { VoucherUsage } from '../vouchers/entities/voucher-usages.entities';
import { INIT_VOUCHER_USAGE } from './sample/voucher_usage';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(ProviderFee)
    private providerFeesRepository: Repository<ProviderFee>,

    @InjectRepository(ProviderOrder)
    private providerOrdersRepository: Repository<ProviderOrder>,

    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Voucher)
    private vouchersRepository: Repository<Voucher>,

    @InjectRepository(VoucherUsage)
    private voucherUsagesRepository: Repository<VoucherUsage>,
  ) {}

  async onModuleInit() {
    const ordersCount = await this.ordersRepository.count();
    const orderItemsCount = await this.orderItemsRepository.count();
    const providerFeesCount = await this.providerFeesRepository.count();
    const providerOrdersCount = await this.providerOrdersRepository.count();
    const vouchersCount = await this.vouchersRepository.count();
    const usagesCount = await this.voucherUsagesRepository.count();

    if (vouchersCount === 0) {
      await this.vouchersRepository.save(INIT_VOUCHERS);
    }

    if (ordersCount === 0) {
      await this.ordersRepository.save(INIT_ORDERS as any);
    }

    if (orderItemsCount === 0) {
      await this.orderItemsRepository.save(INIT_ORDER_ITEMS);
    }

    if (usagesCount === 0) {
      await this.voucherUsagesRepository.save(INIT_VOUCHER_USAGE);
    }

    if (providerFeesCount === 0) {
      await this.providerFeesRepository.save(INIT_PROVIDER_FEES as any);
    }

    if (providerOrdersCount === 0) {
      await this.providerOrdersRepository.save(INIT_PROVIDER_ORDER as any);
    }

    if (
      vouchersCount > 0 &&
      ordersCount > 0 &&
      orderItemsCount > 0 &&
      providerFeesCount > 0 &&
      providerOrdersCount > 0 &&
      usagesCount > 0
    ) {
      this.logger.log('>>> ALREADY INIT SAMPLE DATA...');
    }
  }
}
