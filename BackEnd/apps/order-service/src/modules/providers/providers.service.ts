import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { Order } from '../orders/entities/orders.entity';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { IdentityService, IUser, ProductService } from 'libs/utils/interface';
import { lastValueFrom } from 'rxjs';
import {
  OrderStatus,
  ProviderFeeStatus,
  ProviderOrderStatus,
} from 'libs/utils/constants';
import { getEndDate, getStartDate } from 'libs/utils/helpers';
import { OrderItem } from '../orders/entities/order-items.entity';
import dayjs from 'dayjs';
import { ProviderFee } from './entities/provider-fees.entity';
import { ProviderOrder } from './entities/provider-order.entity';
import { QuickUpdateProviderFeeDto } from 'libs/dtos/provider/provider.dto';
import { generateDateRange } from '../../utils/helpers';
import { DashboardDto } from 'libs/dtos/order/order-dto';

@Injectable()
export class ProvidersService implements OnModuleInit {
  private productService: ProductService;
  private identityService: IdentityService;

  constructor(
    @InjectRepository(ProviderFee)
    private providerFeesRepository: Repository<ProviderFee>,

    @InjectRepository(ProviderOrder)
    private providerOrdersRepository: Repository<ProviderOrder>,

    private dataSource: DataSource,

    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
    @Inject('IDENTITY_SERVICE') private clientIdentity: ClientGrpc,
  ) {}

  onModuleInit() {
    this.identityService =
      this.clientIdentity.getService<IdentityService>('IdentityService');

    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');
  }

  async findAllProviderFeesInit() {
    const result = await this.providerFeesRepository.find();
    return { result };
  }

  async findAllProviderOrdersInit() {
    const result = await this.providerOrdersRepository.find();
    return { result };
  }

  async mapService(items: OrderItem[]) {
    if (!items.length) return;

    const variantIds = items.map((i) => i.variantId);

    const variantRes: any = await lastValueFrom(
      this.productService.findAllVariantForOrderService({
        variantIds,
      }),
    );

    const variants: any[] = variantRes.result || [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const createdByList = [
      ...new Set(variants.map((v) => v.product?.createdBy).filter(Boolean)),
    ];

    if (!createdByList.length) return;

    const usersRes: any = await lastValueFrom(
      this.identityService.findAllUsers({
        ops: createdByList,
        strategy: 'email',
      }),
    );

    const users: any[] = usersRes.result || [];
    const userMap = new Map(users.map((u) => [u.email, u]));

    const validVariantIds = new Set(
      variants
        .filter((v) => {
          const u = userMap.get(v.product?.createdBy);
          return u?.role?.name === 'PROVIDER';
        })
        .map((v) => v.id),
    );

    return { variantMap, validVariantIds, userMap };
  }

  async createProviderFee(order: Order, user: IUser, manager: EntityManager) {
    const items = order.items;

    const { validVariantIds, variantMap, userMap } =
      await this.mapService(items);

    const fees = items
      .filter((item) => validVariantIds.has(item.variantId))
      .map((item) => {
        const variant = variantMap.get(item.variantId);
        if (!variant) return null;

        const owner = userMap.get(variant.product?.createdBy);
        if (!owner) return null;

        const percent = 10;
        const feeAmount = (item.unitPrice * item.quantity * percent) / 100;

        return {
          orderId: order.id,
          orderItemId: item.id,
          ownerId: owner._id,
          percent,
          feeAmount,
          status: ProviderFeeStatus.PENDING,
          createdBy: user.email,
          updatedBy: user.email,
        };
      })
      .filter(Boolean);

    if (!fees.length) return;

    await manager
      .getRepository(ProviderFee)
      .createQueryBuilder()
      .insert()
      .values(fees)
      .orIgnore()
      .execute();
  }

  async createProviderOrder(order: Order, manager: EntityManager, user: IUser) {
    const items = order.items;

    const { validVariantIds, variantMap, userMap } =
      await this.mapService(items);

    const approvals = items
      .filter((item) => validVariantIds.has(item.variantId))
      .map((item) => {
        const variant = variantMap.get(item.variantId);
        if (!variant) return null;

        const owner = userMap.get(variant.product?.createdBy);
        if (!owner) return null;

        return {
          orderId: order.id,
          orderItemId: item.id,
          ownerId: owner._id,
          status: ProviderOrderStatus.PENDING,
          createdBy: user.email,
          updatedBy: user.email,
        };
      })
      .filter(Boolean);

    if (!approvals.length) return;

    await manager
      .getRepository(ProviderOrder)
      .createQueryBuilder()
      .insert()
      .values(approvals)
      .orIgnore()
      .execute();
  }

  async findAllProviderFee(currentPage: number, limit: number, qs: string) {
    const aqp = (await import('api-query-params')).default;
    const { filter } = aqp(qs);

    delete filter.current;
    delete filter.pageSize;

    const qb = this.providerFeesRepository.createQueryBuilder('cf');

    const enumFields = ['status', 'ownerId', 'orderId', 'id'];

    for (const key in filter) {
      const value = filter[key];

      if (key === 'createdAt' || key === 'updatedAt') continue;

      if (enumFields.includes(key)) {
        qb.andWhere(`cf.${key} = :${key}`, { [key]: value });
      } else if (typeof value === 'string') {
        qb.andWhere(`cf.${key} LIKE :${key}`, {
          [key]: `%${value}%`,
        });
      } else {
        qb.andWhere(`cf.${key} = :${key}`, { [key]: value });
      }
    }

    if (filter?.createdAt?.$in) {
      qb.andWhere(`cf.createdAt BETWEEN :startCreatedAt AND :endCreatedAt`, {
        startCreatedAt: getStartDate(filter.createdAt.$in[0]),
        endCreatedAt: getEndDate(filter.createdAt.$in[1]),
      });
    }

    if (filter?.updatedAt?.$in) {
      qb.andWhere(`cf.updatedAt BETWEEN :startUpdatedAt AND :endUpdatedAt`, {
        startUpdatedAt: getStartDate(filter.updatedAt.$in[0]),
        endUpdatedAt: getEndDate(filter.updatedAt.$in[1]),
      });
    }

    const totalResult = await qb
      .clone()
      .select('COUNT(DISTINCT cf.ownerId)', 'count')
      .getRawOne();

    const total = Number(totalResult.count);

    const ownerRows = await qb
      .clone()
      .select('DISTINCT cf.ownerId', 'ownerId')
      .orderBy('cf.ownerId', 'ASC')
      .offset((currentPage - 1) * limit)
      .limit(limit)
      .getRawMany();

    const ownerIds = ownerRows.map((o) => o.ownerId);

    if (!ownerIds.length) {
      return {
        meta: {
          current: currentPage,
          pageSize: limit,
          pages: 0,
          total: 0,
        },
        result: [],
      };
    }

    const data = await qb
      .clone()
      .leftJoinAndSelect('cf.orderItem', 'orderItem')
      .leftJoinAndSelect('cf.order', 'order')
      .andWhere('cf.ownerId IN (:...ownerIds)', { ownerIds })
      .orderBy('cf.ownerId', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
      .addOrderBy('cf.createdAt', 'DESC')
      .getMany();

    const variantIds = Array.from(
      new Set(data.map((item) => item.orderItem?.variantId).filter(Boolean)),
    );

    const variantsRes: any = await lastValueFrom(
      this.productService.findAllVariantForOrderService({
        variantIds,
      }),
    );

    const variants: any = variantsRes?.result || [];
    const variantMap: any = new Map(
      variants.map((v: any) => [String(v.id), v]),
    );

    const usersRes: any = await lastValueFrom(
      this.identityService.findAllUsers({
        ops: ownerIds,
        strategy: 'id',
      }),
    );

    const users: any[] = usersRes.result || [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const grouped = new Map<
      string,
      {
        user: IUser;
        ownerId: string;
        orders: {
          orderId: string;
          items: any[];
        }[];
      }
    >();

    const orderCreatedMap = new Map<string, Date>();

    for (const item of data) {
      const ownerKey = String(item.ownerId);

      orderCreatedMap.set(item.orderId, item.order?.createdAt);

      const user = userMap.get(ownerKey) || null;

      const variantId = item.orderItem?.variantId;
      const variant = variantMap.get(String(variantId));

      const enrichedItem = {
        ...item,
        variant,
      };

      if (!grouped.has(ownerKey)) {
        grouped.set(ownerKey, {
          user,
          ownerId: ownerKey,
          orders: [],
        });
      }

      const ownerGroup = grouped.get(ownerKey)!;

      let orderGroup = ownerGroup.orders.find(
        (o) => o.orderId === item.orderId,
      );

      if (!orderGroup) {
        orderGroup = {
          orderId: item.orderId,
          items: [],
        };

        ownerGroup.orders.push(orderGroup);
      }

      orderGroup.items.push(enrichedItem);
    }

    const result = Array.from(grouped.values());

    for (const owner of result) {
      owner.orders.sort(
        (a, b) =>
          new Date(orderCreatedMap.get(b.orderId) ?? 0).getTime() -
          new Date(orderCreatedMap.get(a.orderId) ?? 0).getTime(),
      );
    }

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }

  async deleteProviderFeeByOrder(
    orderId: string,
    manager: EntityManager,
    user: IUser,
  ) {
    await manager.getRepository(ProviderFee).update(
      { orderId },
      {
        isDeleted: true,
        deletedBy: user.email,
      },
    );
    await manager.getRepository(ProviderFee).delete({ orderId });
  }

  async deleteProviderOrderByOrder(
    orderId: string,
    manager: EntityManager,
    user: IUser,
  ) {
    await manager.getRepository(ProviderOrder).update(
      { orderId },
      {
        isDeleted: true,
        deletedBy: user.email,
      },
    );
    await manager.getRepository(ProviderOrder).softDelete({ orderId });
  }

  async cancelProviderFeeByOrder(
    orderId: string,
    user: IUser,
    manager: EntityManager,
  ) {
    await manager
      .getRepository(ProviderFee)
      .update(
        { orderId, status: ProviderFeeStatus.PAID },
        { status: ProviderFeeStatus.CANCELLED, updatedBy: user.email },
      );
  }

  async updateProviderFeeStatus(
    id: string,
    status: ProviderFeeStatus,
    user: IUser,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const fee = await manager.findOne(ProviderFee, {
        where: { id },
        relations: ['order', 'orderItem'],
      });

      if (!fee) {
        throw new RpcException('Provider fee not found');
      }

      if (
        fee.order.status !== OrderStatus.SUCCESS &&
        status === ProviderFeeStatus.PAID
      ) {
        throw new RpcException('You can not paid unsuccessfull order');
      }

      if (
        [
          OrderStatus.CANCELLED,
          OrderStatus.FAILED,
          OrderStatus.REFUNDED,
        ].includes(fee.order.status) &&
        status === ProviderFeeStatus.PENDING
      ) {
        throw new RpcException(
          `You cannot set pending for ${fee.order.status} order`,
        );
      }

      const variantId = fee.orderItem?.variantId;

      if (!variantId) {
        throw new RpcException('Variant not found for this fee');
      }

      const variant: any = await lastValueFrom(
        this.productService.findOneVariant({ id: variantId }),
      );

      if (!variant) {
        throw new RpcException('Variant not found');
      }

      const isExpired =
        variant.dueDate && dayjs(variant.dueDate).isBefore(dayjs(), 'day');

      if (isExpired) {
        throw new RpcException(
          'You cannot update fee status because the variant is expired',
        );
      }

      await manager.update(
        ProviderFee,
        { id },
        {
          status,
          updatedBy: user.email,
        },
      );

      return { message: 'Update Provider fee status' };
    });
  }

  async findAllProviderOrder(currentPage: number, limit: number, qs: string) {
    const aqp = (await import('api-query-params')).default;
    const { filter } = aqp(qs);

    delete filter.current;
    delete filter.pageSize;

    const qb = this.providerOrdersRepository
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.orderItem', 'orderItem')
      .leftJoin('co.order', 'order');

    const enumFields = ['status', 'orderId', 'ownerId'];

    for (const key in filter) {
      const value = filter[key];

      if (key === 'createdAt' || key === 'updatedAt') continue;

      if (enumFields.includes(key)) {
        qb.andWhere(`co.${key} = :${key}`, { [key]: value });
      } else if (typeof value === 'string') {
        qb.andWhere(`co.${key} LIKE :${key}`, {
          [key]: `%${value}%`,
        });
      } else {
        qb.andWhere(`co.${key} = :${key}`, { [key]: value });
      }
    }

    if (filter?.createdAt?.$in) {
      qb.andWhere(`co.createdAt BETWEEN :startCreatedAt AND :endCreatedAt`, {
        startCreatedAt: getStartDate(filter.createdAt.$in[0]),
        endCreatedAt: getEndDate(filter.createdAt.$in[1]),
      });
    }

    if (filter?.updatedAt?.$in) {
      qb.andWhere(`co.updatedAt BETWEEN :startUpdatedAt AND :endUpdatedAt`, {
        startUpdatedAt: getStartDate(filter.updatedAt.$in[0]),
        endUpdatedAt: getEndDate(filter.updatedAt.$in[1]),
      });
    }

    const totalResult = await qb
      .clone()
      .select('COUNT(DISTINCT co.orderId)', 'count')
      .getRawOne();

    const total = Number(totalResult.count);

    const orderRows = await qb
      .clone()
      .select('co.orderId', 'orderId')
      .addSelect('MAX(order.createdAt)', 'latestCreatedAt')
      .groupBy('co.orderId')
      .orderBy('MAX(order.createdAt)', 'DESC')
      .offset((currentPage - 1) * limit)
      .limit(limit)
      .getRawMany();

    const orderIds = orderRows.map((o) => o.orderId);

    if (!orderIds.length) {
      return {
        meta: {
          current: currentPage,
          pageSize: limit,
          pages: 0,
          total: 0,
        },
        result: [],
      };
    }

    const data = await qb
      .clone()
      .andWhere('co.orderId IN (:...orderIds)', { orderIds })
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('co.createdAt', 'DESC')
      .getMany();

    const grouped = new Map<string, any>();

    for (const item of data) {
      const key = String(item.orderId);

      if (!grouped.has(key)) {
        grouped.set(key, {
          orderId: key,
          items: [],
        });
      }

      grouped.get(key).items.push(item);
    }

    const result = Array.from(grouped.values());

    result.sort(
      (a, b) => orderIds.indexOf(a.orderId) - orderIds.indexOf(b.orderId),
    );

    const variantIds = data
      .flatMap((c) => c.orderItem || [])
      .map((i) => i.variantId)
      .filter(Boolean);

    let variantMap = new Map();

    if (variantIds.length) {
      const response: any = await lastValueFrom(
        this.productService.findAllVariantForOrderService({
          variantIds: [...new Set(variantIds)],
        }),
      );
      const variants = response.result || [];
      variantMap = new Map(variants.map((v: any) => [v.id, v]));
    }

    for (const group of result) {
      group.items = group.items.map((order) => ({
        ...order,
        orderItem: order.orderItem
          ? {
              ...order.orderItem,
              variant: variantMap.get(order.orderItem.variantId) || null,
            }
          : null,
      }));
    }

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }

  async updateProviderOrderStatus(
    id: string,
    newStatus: ProviderOrderStatus,
    user: IUser,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const providerOrderRepo = manager.getRepository(ProviderOrder);
      const orderRepo = manager.getRepository(Order);

      const providerOrder = await providerOrderRepo.findOne({
        where: { id },
      });

      if (!ProviderOrder) {
        throw new RpcException('Provider order not exist');
      }

      providerOrder.status = newStatus;
      providerOrder.updatedBy = user.email;
      await providerOrderRepo.save(providerOrder);

      const order = await orderRepo.findOne({
        where: { id: providerOrder.orderId },
        relations: { items: true },
      });

      if (!order) {
        throw new RpcException('Order not found');
      }

      const rollbackStatusMap: Partial<
        Record<ProviderOrderStatus, OrderStatus>
      > = {
        [ProviderOrderStatus.PENDING]: OrderStatus.PENDING,
        [ProviderOrderStatus.REJECTED]:
          order.type === 'BANKING'
            ? OrderStatus.REFUNDED
            : OrderStatus.CANCELLED,
      };

      if (
        [OrderStatus.PACKAGING, OrderStatus.DELIVERING].includes(order.status)
      ) {
        const nextOrderStatus = rollbackStatusMap[newStatus];

        if (nextOrderStatus) {
          await orderRepo.update(
            { id: order.id },
            {
              status: nextOrderStatus,
              updatedBy: user.email,
            },
          );
        }
      }

      if (
        order.status === OrderStatus.SUCCESS &&
        newStatus !== ProviderOrderStatus.APPROVED
      ) {
        await orderRepo.update(
          { id: order.id },
          {
            status: OrderStatus.REFUNDED,
            updatedBy: user.email,
          },
        );
        const items = order.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        }));
        try {
          await lastValueFrom(
            this.productService.restoreVariantStock({ items }),
          );
        } catch (err) {
          throw new RpcException(err.details || err.message);
        }
        await this.cancelProviderFeeByOrder(order.id, user, manager);
      }

      return { message: 'Update Provider order status success' };
    });
  }

  async updateProviderOrdersByOrderId(
    orderId: string,
    newStatus: ProviderOrderStatus,
    user: IUser,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const providerOrderRepo = manager.getRepository(ProviderOrder);
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: { items: true },
      });

      if (!order) {
        throw new RpcException('Order not found');
      }

      await providerOrderRepo.update(
        { orderId, ownerId: user._id.toString() },
        {
          status: newStatus,
          updatedBy: user.email,
        },
      );

      const rollbackStatusMap: Partial<
        Record<ProviderOrderStatus, OrderStatus>
      > = {
        [ProviderOrderStatus.PENDING]: OrderStatus.PENDING,
        [ProviderOrderStatus.REJECTED]:
          order.type === 'BANKING'
            ? OrderStatus.REFUNDED
            : OrderStatus.CANCELLED,
      };

      if (
        [OrderStatus.PACKAGING, OrderStatus.DELIVERING].includes(order.status)
      ) {
        const nextOrderStatus = rollbackStatusMap[newStatus];

        if (nextOrderStatus) {
          await orderRepo.update(
            { id: order.id },
            {
              status: nextOrderStatus,
              updatedBy: user.email,
            },
          );
        }
      }

      if (
        order.status === OrderStatus.SUCCESS &&
        newStatus !== ProviderOrderStatus.APPROVED
      ) {
        await orderRepo.update(
          { id: orderId },
          {
            status: OrderStatus.REFUNDED,
            updatedBy: user.email,
          },
        );
        const items = order.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        }));
        try {
          await lastValueFrom(
            this.productService.restoreVariantStock({ items }),
          );
        } catch (err) {
          throw new RpcException(err.details || err.message);
        }
        await this.cancelProviderFeeByOrder(order.id, user, manager);
      }

      return { message: 'Bulk update Provider orders success' };
    });
  }

  async quickUpdateProviderFeeStatus(
    dto: QuickUpdateProviderFeeDto,
    user: IUser,
  ) {
    const { ownerId, status, orderId } = dto;
    return await this.dataSource.transaction(async (manager) => {
      const fees = await manager.find(ProviderFee, {
        where: { ownerId, orderId },
        relations: ['order', 'orderItem'],
      });

      if (!fees.length) {
        throw new RpcException('No Provider fees found');
      }

      let validFees = [...fees];
      let skipped: any[] = [];

      if (status === ProviderFeeStatus.PAID) {
        const valid: typeof fees = [];
        const invalid: typeof fees = [];

        fees.forEach((f) => {
          if (f.order?.status === OrderStatus.SUCCESS) valid.push(f);
          else invalid.push(f);
        });

        validFees = valid;
        skipped.push(
          ...invalid.map((f) => ({
            id: f.id,
            reason: 'Order not SUCCESS',
          })),
        );
      }

      if (status === ProviderFeeStatus.PENDING) {
        const valid: typeof fees = [];
        const invalid: typeof fees = [];

        fees.forEach((f) => {
          if (
            ![
              OrderStatus.CANCELLED,
              OrderStatus.FAILED,
              OrderStatus.REFUNDED,
            ].includes(f.order.status)
          )
            valid.push(f);
          else invalid.push(f);
        });

        validFees = valid;
        skipped.push(
          ...invalid.map((f) => ({
            id: f.id,
            reason: `Order is ${f.order.status}`,
          })),
        );
      }

      if (
        [
          ProviderFeeStatus.PAID,
          ProviderFeeStatus.PENDING,
          ProviderFeeStatus.CANCELLED,
        ].includes(status) &&
        validFees.length
      ) {
        const variantIds = Array.from(
          new Set(validFees.map((f) => f.orderItem?.variantId).filter(Boolean)),
        );

        if (variantIds.length) {
          const variantsRes: any = await lastValueFrom(
            this.productService.findAllVariantForOrderService({
              variantIds,
            }),
          );

          const variants = variantsRes?.result || [];
          const now = dayjs();

          const expiredMap = new Map(
            variants
              .filter((v: any) => v.dueDate && dayjs(v.dueDate).isBefore(now))
              .map((v: any) => [v.id, v]),
          );

          const stillValid: typeof validFees = [];
          const expiredFees: typeof validFees = [];

          validFees.forEach((f) => {
            if (expiredMap.has(f.orderItem?.variantId)) {
              expiredFees.push(f);
            } else {
              stillValid.push(f);
            }
          });

          validFees = stillValid;

          skipped.push(
            ...expiredFees.map((f) => ({
              id: f.id,
              reason: 'Variant expired',
            })),
          );
        }
      }

      if (!validFees.length) {
        return {
          message: 'No valid items to update',
          skipped,
        };
      }

      await manager.update(
        ProviderFee,
        { id: In(validFees.map((f) => f.id)) },
        {
          status,
          updatedBy: user.email,
        },
      );

      return {
        message:
          skipped.length > 0
            ? `Bulk update partially completed. Skipped: ${skipped
                .map((s) => `${s.id} (${s.reason})`)
                .join(', ')}`
            : 'Bulk update completed successfully',
      };
    });
  }

  async providerFeeDashboard(dto: DashboardDto, ownerId?: string) {
    const { startDate, endDate, groupBy } = dto;

    const start = dayjs(startDate).utc().startOf('day').toDate();
    const end = dayjs(endDate).utc().endOf('day').toDate();

    const baseQb = this.providerFeesRepository
      .createQueryBuilder('pf')
      .where('pf.status = :status', {
        status: ProviderFeeStatus.PAID,
      })
      .andWhere('pf.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (ownerId) {
      baseQb.andWhere('pf.ownerId = :ownerId', { ownerId });
    }

    const result = await baseQb
      .clone()
      .select('SUM(pf.feeAmount)', 'totalFeeRevenue')
      .addSelect('AVG(pf.feeAmount)', 'avgFeeAmount')
      .getRawOne();

    const groupFormat =
      groupBy === 'month'
        ? `date_trunc('month', pf.createdAt)`
        : `date_trunc('day', pf.createdAt)`;

    const chart = await baseQb
      .clone()
      .select(`${groupFormat}`, 'label')
      .addSelect('SUM(pf.feeAmount)', 'totalFeeRevenue')
      .groupBy(groupFormat)
      .orderBy('label', 'ASC')
      .getRawMany();

    const format = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

    const dataMap = new Map(
      chart.map((item: any) => [
        dayjs(item.label).utc().format(format),
        Number(item.totalFeeRevenue) || 0,
      ]),
    );

    const allDates = generateDateRange(start, end, groupBy);

    const finalData = allDates.map((date) => ({
      label: date,
      totalFeeRevenue: dataMap.get(date) || 0,
    }));

    return {
      summary: {
        totalFeeRevenue: Number(result.totalFeeRevenue) || 0,
        avgFeeAmount: Number(result.avgFeeAmount) || 0,
      },
      chart: {
        labels: finalData.map((i) => i.label),
        revenue: finalData.map((i) => i.totalFeeRevenue),
      },
    };
  }

  async getProviderFeeDashboardDateRange(ownerId?: string) {
    const query = this.providerFeesRepository
      .createQueryBuilder('pf')
      .select('MIN(pf.createdAt)', 'minDate')
      .addSelect('MAX(pf.createdAt)', 'maxDate')
      .where('pf.status = :status', {
        status: ProviderFeeStatus.PAID,
      });

    if (ownerId) {
      query.andWhere('pf.ownerId = :ownerId', { ownerId });
    }

    const result = await query.getRawOne();

    return {
      minDate: result.minDate,
      maxDate: result.maxDate,
    };
  }

  async deleteProviderFeesAndOrdersByOwner(ownerId: string, user: IUser) {
    await this.providerFeesRepository.update(
      { ownerId },
      { isDeleted: true, deletedBy: user.email },
    );
    await this.providerOrdersRepository.update(
      { ownerId },
      { isDeleted: true, deletedBy: user.email },
    );

    await this.providerFeesRepository.softDelete({ ownerId });
    await this.providerOrdersRepository.softDelete({ ownerId });

    return { message: 'Delete successfully' };
  }
}
