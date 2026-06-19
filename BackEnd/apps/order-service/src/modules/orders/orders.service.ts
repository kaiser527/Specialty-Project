import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/orders.entity';
import { OrderItem } from './entities/order-items.entity';
import { In, Like, Not, Repository } from 'typeorm';
import { buildWhere } from 'libs/utils/helpers';
import { IdentityService, IUser, ProductService } from 'libs/utils/interface';
import {
  DashboardDto,
  OrderDto,
  OrderItemDto,
} from 'libs/dtos/order/order-dto';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CartItem } from '../cart/entities/cart-items.entity';
import { Cart } from '../cart/entities/cart.entity';
import { generateDateRange } from '../../utils/helpers';
import dayjs from '../../utils/dayjs.config';
import { CartService } from '../cart/cart.service';
import { ProvidersService } from '../providers/providers.service';
import { OrderStatus, ProviderOrderStatus } from 'libs/utils/constants';
import { ProviderOrder } from '../providers/entities/provider-order.entity';
import { Voucher } from '../vouchers/entities/vouchers.entities';
import { VoucherUsage } from '../vouchers/entities/voucher-usages.entities';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class OrdersService implements OnModuleInit {
  private productService: ProductService;
  private identityService: IdentityService;

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    private providersService: ProvidersService,
    private cartService: CartService,
    private vouchersService: VouchersService,

    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
    @Inject('IDENTITY_SERVICE') private clientIdentity: ClientGrpc,
  ) {}

  onModuleInit() {
    this.identityService =
      this.clientIdentity.getService<IdentityService>('IdentityService');

    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');
  }

  findAllOrderItem = async () => {
    const result = await this.orderItemsRepository.find();
    return { result };
  };

  findAllOrderItemsByVariantIds = async (variantIds: string[]) => {
    const cartItems =
      await this.cartService.findAllCartItemsByVariantIds(variantIds);

    const orderItems = await this.orderItemsRepository.find({
      where: { variantId: In(variantIds) },
    });

    return { cartItems, orderItems };
  };

  findAllOrdersByUser = async (user: IUser) => {
    const carts = await this.cartService.findAllCartByUser(user);

    const orders = await this.ordersRepository.find({
      where: { userId: user._id.toString() },
    });

    return { carts, orders };
  };

  findAll = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, sort } = aqp(qs);

    const specialOrderMap: Record<string, 'ASC' | 'DESC'> = {};

    delete filter.current;
    delete filter.pageSize;

    const newFilter: any = {};

    console.log(filter);

    const enumFields = ['status', 'type', 'userId', 'paymentRef', 'id'];

    for (const key in filter) {
      const value = filter[key];

      if (value === 'max') {
        specialOrderMap[key] = 'DESC';
        delete filter[key];
        continue;
      }

      if (value === 'min') {
        specialOrderMap[key] = 'ASC';
        delete filter[key];
        continue;
      }

      if (
        [
          'createdAt',
          'updatedAt',
          'totalPrice',
          'shippingFee',
          'subTotal',
        ].includes(key)
      )
        continue;

      if (value && typeof value === 'object' && '$in' in value) {
        newFilter[key] = In(value.$in);
        continue;
      }

      if (enumFields.includes(key)) {
        newFilter[key] = value;
      } else if (typeof value === 'string') {
        newFilter[key] = Like(`%${value}%`);
      } else {
        newFilter[key] = value;
      }
    }

    if (filter?.totalPrice) {
      newFilter.totalPrice = buildWhere('totalPrice', filter.totalPrice, {
        transform: (col) => `"${col.replace('.', '"."')}"`,
        paramPrefix: 'totalPrice',
      });
    }

    if (filter?.shippingFee) {
      newFilter.shippingFee = buildWhere('shippingFee', filter.shippingFee, {
        transform: (col) => `"${col.replace('.', '"."')}"`,
        paramPrefix: 'shippingFee',
      });
    }

    if (filter?.subTotal) {
      newFilter.subTotal = buildWhere('subTotal', filter.subTotal, {
        transform: (col) => `"${col.replace('.', '"."')}"`,
        paramPrefix: 'subTotal',
      });
    }

    if (filter?.createdAt) {
      newFilter.createdAt = buildWhere('createdAt', filter.createdAt, {
        transform: (col) => `DATE("${col.replace('.', '"."')}")`,
        paramPrefix: 'createdAt',
      });
    }

    if (filter?.updatedAt) {
      newFilter.updatedAt = buildWhere('updatedAt', filter.updatedAt, {
        transform: (col) => `DATE("${col.replace('.', '"."')}")`,
        paramPrefix: 'updatedAt',
      });
    }

    const order: any = {};
    if (sort) {
      for (const key in sort) {
        order[key] = sort[key] === 1 ? 'DESC' : 'ASC';
      }
    }

    for (const key in specialOrderMap) {
      order[key] = specialOrderMap[key];
    }

    if (Object.keys(specialOrderMap).length) {
      limit = 1;
    }

    const [result, total] = await this.ordersRepository.findAndCount({
      where: newFilter,
      take: limit,
      skip: (currentPage - 1) * limit,
      order: Object.keys(order).length ? order : { createdAt: 'DESC' },
    });

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  };

  findOne = async (id: string) => {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.providerOrder', 'providerOrder')
      .where('order.id = :id', { id })
      .orderBy('item.createdAt', 'ASC')
      .getOne();

    if (!order) {
      throw new RpcException('Order not found');
    }

    const variantIds = order.items
      .map((item) => item.variantId)
      .filter(Boolean);

    const uniqueVariantIds = [...new Set(variantIds)];

    let variantsMap = new Map();

    if (uniqueVariantIds.length) {
      const response: any = await lastValueFrom(
        this.productService.findAllVariantForOrderService({
          variantIds: uniqueVariantIds,
        }),
      );
      const variants = response.result;
      variantsMap = new Map(variants.map((v: any) => [v.id, v]));
    }

    const ownerIds = order.items
      .map((item) => item.providerOrder?.ownerId)
      .filter(Boolean);

    const uniqueOwnerIds = [...new Set(ownerIds)];

    let providerMap = new Map();

    if (uniqueOwnerIds.length) {
      const res: any = await lastValueFrom(
        this.identityService.findAllUsers({
          ops: uniqueOwnerIds,
          strategy: 'id',
        }),
      );

      const providers = res.result || [];
      providerMap = new Map(providers.map((u: any) => [u._id, u]));
    }

    order.items = order.items.map((item) => {
      const providerOrder = item.providerOrder;
      const owner = providerMap.get(providerOrder?.ownerId);

      return {
        ...item,
        variant: variantsMap.get(item.variantId) || null,
        provider: providerOrder
          ? {
              name: owner?.name,
              email: owner?.email,
              image: owner?.image,
              role: owner?.role?.name,
              status: providerOrder.status,
            }
          : null,
      };
    });

    let user = null;
    const response: any = await lastValueFrom(
      this.identityService.findOne({
        op: order.userId,
        strategy: 'id',
      }),
    );

    if (response) {
      user = response;
    }

    return { ...order, user };
  };

  findOneByUser = async (id: string, user: IUser) => {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.id = :id', { id })
      .andWhere('order.userId = :userId', { userId: user._id.toString() })
      .orderBy('item.createdAt', 'ASC')
      .getOne();

    if (!order) {
      throw new RpcException('Order not found');
    }

    const variantIds = order.items
      .map((item) => item.variantId)
      .filter(Boolean);

    const uniqueVariantIds = [...new Set(variantIds)];

    let variantsMap = new Map();

    if (uniqueVariantIds.length) {
      const response: any = await lastValueFrom(
        this.productService.findAllVariantForOrderService({
          variantIds: uniqueVariantIds,
        }),
      );
      const variants = response.result;
      variantsMap = new Map(variants.map((v: any) => [v.id, v]));
    }

    order.items = order.items.map((item) => ({
      ...item,
      variant: variantsMap.get(item.variantId) || null,
    }));

    return order;
  };

  placeOrder = async (dto: OrderDto, user: IUser) => {
    //@ts-ignore
    const { items, user: _, ...rest } = dto;

    const userId = user._id.toString();

    const mergedItems = Object.values(
      items.reduce((acc, item) => {
        if (!acc[item.variantId]) acc[item.variantId] = { ...item };
        else acc[item.variantId].quantity += item.quantity;
        return acc;
      }, {}),
    );

    if (!mergedItems.length) {
      throw new RpcException('Order items cannot be empty');
    }

    if (user.role?.name === 'PROVIDER') {
      const variantIds = mergedItems.map(
        (item: OrderItemDto) => item.variantId,
      );

      const response: any = await lastValueFrom(
        this.productService.findAllVariantForOrderService({
          variantIds,
        }),
      );

      const variants: any[] = response?.result;

      const hasOwnProduct = variants.some(
        (variant) => variant.product?.createdBy === user.email,
      );

      if (hasOwnProduct) {
        throw new RpcException('You cannot purchase your own products');
      }
    }

    return await this.ordersRepository.manager.transaction(async (manager) => {
      const order = await manager.save(this.ordersRepository.target, {
        ...rest,
        userId,
        createdBy: user.email,
        status: OrderStatus.PENDING,
      });

      if (dto.voucherCode) {
        await this.vouchersService.applyVoucher(
          manager,
          dto.voucherCode,
          order,
          userId,
        );
      }

      const savedItems = await manager.save(
        this.orderItemsRepository.target,
        mergedItems.map((item: OrderItemDto) => ({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          createdBy: user.email,
        })),
      );

      order.items = savedItems;

      await this.providersService.createProviderOrder(order, manager, user);

      const cart = await manager.findOne(Cart, {
        where: { userId },
      });

      if (cart) {
        await manager.delete(CartItem, { cartId: cart.id });
        await manager.delete(Cart, { id: cart.id });
      }

      return { orderId: order.id };
    });
  };

  updateOrderStatus = async (id: string, status: OrderStatus, user: IUser) => {
    return await this.ordersRepository.manager.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: { items: true },
      });

      if (!order) {
        throw new RpcException('Order not exist');
      }

      const oldStatus = order.status;

      if (order.type === 'BANKING' && status === OrderStatus.CANCELLED) {
        throw new RpcException('You cannot cancel order with BANKING type');
      }

      if (order.type === 'COD' && status === OrderStatus.REFUNDED) {
        throw new RpcException('You cannot refund order with COD type');
      }

      if (
        oldStatus === OrderStatus.FAILED &&
        status === OrderStatus.REFUNDED &&
        order.type === 'BANKING'
      ) {
        throw new RpcException(
          'You cannot refund order with BANKING type and FAILED status',
        );
      }

      if (
        !['ADMIN', 'STAFF'].includes(user.role.name) &&
        order.userId !== user._id.toString()
      ) {
        throw new RpcException('You cannot update status for other user order');
      }

      if (
        !['ADMIN', 'STAFF'].includes(user.role.name) &&
        [
          OrderStatus.SUCCESS,
          OrderStatus.PACKAGING,
          OrderStatus.DELIVERING,
        ].includes(status)
      ) {
        throw new RpcException(
          'You cannot set SUCCESS, PACKAGING or DELIVERING status for your order',
        );
      }

      const statusMap: Partial<Record<OrderStatus, ProviderOrderStatus[]>> = {
        [OrderStatus.SUCCESS]: [ProviderOrderStatus.APPROVED],

        [OrderStatus.PACKAGING]: [
          ProviderOrderStatus.PACKAGING,
          ProviderOrderStatus.DELIVERING,
          ProviderOrderStatus.APPROVED,
        ],

        [OrderStatus.DELIVERING]: [
          ProviderOrderStatus.PACKAGING,
          ProviderOrderStatus.DELIVERING,
          ProviderOrderStatus.APPROVED,
        ],
      };

      const expectedStatuses = statusMap[status];

      if (expectedStatuses) {
        const hasInvalidStatus = await manager.exists(ProviderOrder, {
          where: {
            orderId: id,
            status: Not(In(expectedStatuses)),
          },
        });
        if (hasInvalidStatus) {
          throw new RpcException(
            `All provider orders must be one of: ${expectedStatuses.join(', ')}`,
          );
        }
      }

      const items = order.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      }));

      if (oldStatus !== status) {
        if (
          oldStatus !== OrderStatus.SUCCESS &&
          status === OrderStatus.SUCCESS
        ) {
          try {
            await lastValueFrom(
              this.productService.updateVariantStock({ items }),
            );
          } catch (err) {
            throw new RpcException(err.details || err.message);
          }
          await this.providersService.createProviderFee(order, user, manager);
        }
        if (
          oldStatus === OrderStatus.SUCCESS &&
          status !== OrderStatus.SUCCESS
        ) {
          try {
            await lastValueFrom(
              this.productService.restoreVariantStock({ items }),
            );
          } catch (err) {
            throw new RpcException(err.details || err.message);
          }
          await this.providersService.cancelProviderFeeByOrder(
            id,
            user,
            manager,
          );
        }
      }

      await manager.update(Order, id, {
        status,
        updatedBy: user.email,
      });

      return { message: 'Update order status successfully' };
    });
  };

  deleteOrder = async (id: string, user: IUser) => {
    return await this.ordersRepository.manager.transaction(async (manager) => {
      await this.providersService.deleteProviderFeeByOrder(id, manager, user);
      await this.providersService.deleteProviderOrderByOrder(id, manager, user);

      const itemsUpdate = await manager.update(
        OrderItem,
        { orderId: id },
        {
          isDeleted: true,
          deletedBy: user.email,
        },
      );

      const ordersUpdate = await manager.update(Order, id, {
        isDeleted: true,
        deletedBy: user.email,
      });

      if (itemsUpdate.affected === 0 || ordersUpdate.affected === 0) {
        throw new RpcException('Order not exist');
      }

      await manager.softDelete(OrderItem, { orderId: id });
      await manager.softDelete(Order, { id });

      return { message: 'Delete order successfully' };
    });
  };

  async dashboard(dto: DashboardDto) {
    const { startDate, endDate, groupBy } = dto;

    const start = dayjs(startDate).utc().startOf('day').toDate();
    const end = dayjs(endDate).utc().endOf('day').toDate();

    const baseQb = this.ordersRepository
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.SUCCESS })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start, end });

    const result = await baseQb
      .clone()
      .select('SUM(o.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .addSelect('AVG(o.totalPrice)', 'avgOrderValue')
      .getRawOne();

    const paymentStats = await baseQb
      .clone()
      .select('o.paymentRef', 'paymentRef')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.paymentRef')
      .getRawMany();

    const totalOrders = Number(result.totalOrders) || 0;

    const paymentPercent = {
      LOCAL: 0,
      VNPAY: 0,
      CREDIT_CARD: 0,
    };

    paymentStats.forEach((p: any) => {
      const key = p.paymentRef;
      const count = Number(p.count) || 0;

      paymentPercent[key] = totalOrders
        ? Number(((count / totalOrders) * 100).toFixed(2))
        : 0;
    });

    const groupFormat =
      groupBy === 'month'
        ? `date_trunc('month', o.createdAt)`
        : `date_trunc('day', o.createdAt)`;

    const chart = await baseQb
      .clone()
      .select(`${groupFormat}`, 'label')
      .addSelect('SUM(o.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .groupBy(groupFormat)
      .orderBy('label', 'ASC')
      .getRawMany();

    const format = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

    const dataMap = new Map(
      chart.map((item: any) => [
        dayjs(item.label).utc().format(format),
        {
          revenue: Number(item.totalRevenue) || 0,
          orders: Number(item.totalOrders) || 0,
        },
      ]),
    );

    const allDates = generateDateRange(start, end, groupBy);

    const finalData = allDates.map((date) => {
      const found = dataMap.get(date);

      return {
        label: date,
        totalRevenue: found?.revenue || 0,
        totalOrders: found?.orders || 0,
      };
    });

    return {
      summary: {
        totalRevenue: Number(result.totalRevenue) || 0,
        totalOrders: Number(result.totalOrders) || 0,
        avgOrderValue: Number(result.avgOrderValue) || 0,
        paymentPercent,
      },
      chart: {
        labels: finalData.map((i) => i.label),
        revenue: finalData.map((i) => i.totalRevenue),
        orders: finalData.map((i) => i.totalOrders),
      },
    };
  }

  async getDashboardDateRange() {
    const result = await this.ordersRepository
      .createQueryBuilder('o')
      .select('MIN(o.createdAt)', 'minDate')
      .addSelect('MAX(o.createdAt)', 'maxDate')
      .where('o.status = :status', { status: OrderStatus.SUCCESS })
      .getRawOne();

    return {
      minDate: result.minDate,
      maxDate: result.maxDate,
    };
  }

  async findOneOrder(id: string) {
    return await this.ordersRepository.findOne({
      where: { id },
    });
  }

  async updateOrderStatusFailed(id: string) {
    await this.ordersRepository.update(id, { status: OrderStatus.FAILED });
  }
}
