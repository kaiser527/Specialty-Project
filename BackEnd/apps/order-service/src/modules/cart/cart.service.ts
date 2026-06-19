import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-items.entity';
import { DataSource, In, Repository } from 'typeorm';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { IUser, ProductService } from 'libs/utils/interface';
import { lastValueFrom } from 'rxjs';
import { CartDto, MergeCartDto } from 'libs/dtos/cart/cart-dto';

@Injectable()
export class CartService implements OnModuleInit {
  private productService: ProductService;

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,

    private dataSource: DataSource,

    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');
  }

  findAllCartItemsByVariantIds = async (variantIds: string[]) => {
    return await this.cartItemsRepository.find({
      where: { variantId: In(variantIds) },
    });
  };

  findAllCartByUser = async (user: IUser) => {
    return await this.cartRepository.find({
      where: { userId: user._id.toString() },
    });
  };

  findOneByUserId = async (userId: string) => {
    const cart = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.userId = :userId', { userId })
      .orderBy('items.createdAt', 'ASC')
      .addOrderBy('items.id', 'ASC')
      .getOne();

    if (!cart) return null;

    const variantIds = cart.items.map((item) => item.variantId);

    const response: any = await lastValueFrom(
      this.productService.findAllVariantForOrderService({ variantIds }),
    );

    const variants: any[] = response.result;

    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    cart.items = cart.items.map((item) => ({
      ...item,
      variant: variantMap.get(item.variantId) || null,
    }));

    return cart;
  };

  async upsertUserCart(dto: CartDto, user: IUser) {
    //@ts-ignore
    const { user: _, ...rest } = dto;

    if (!dto.variantId) {
      throw new RpcException('variantId is required');
    }

    const variant: any = await lastValueFrom(
      this.productService.findOneVariant({ id: rest.variantId }),
    );

    if (!variant) throw new RpcException('Variant not found');

    const userId = user._id.toString();

    if (
      user.role?.name === 'PROVIDER' &&
      variant.product?.createdBy === user.email
    ) {
      throw new RpcException('You cannot add your own products to cart');
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(this.cartRepository.target)
        .values({ userId, createdBy: user.email })
        .orIgnore()
        .execute();

      const cart = await manager.findOne(this.cartRepository.target, {
        where: { userId },
      });

      if (!cart) throw new RpcException('Cart creation failed');

      await manager.query(
        `
          INSERT INTO "cartItems" ("cartId", "variantId", "quantity", "createdBy", "updatedBy")
          VALUES ($1, $2, $3, $4, $4)
          ON CONFLICT ("cartId", "variantId")
          DO UPDATE SET
            "quantity" = "cartItems"."quantity" + EXCLUDED."quantity",
            "updatedBy" = EXCLUDED."updatedBy"
        `,
        [cart.id, rest.variantId, rest.quantity, user.email],
      );

      await manager.query(
        `
          DELETE FROM "cartItems"
          WHERE "cartId" = $1 AND "variantId" = $2 AND quantity <= 0
        `,
        [cart.id, rest.variantId],
      );

      const remainingItems = await manager.count(
        this.cartItemsRepository.target,
        { where: { cartId: cart.id } },
      );

      if (remainingItems === 0) {
        await manager.delete(this.cartRepository.target, cart.id);
      }

      return { message: 'Cart updated successfully' };
    });
  }

  async mergeCart(dto: MergeCartDto, user: IUser) {
    //@ts-ignore
    delete dto.user;

    const userId = user._id.toString();

    if (!dto.items || dto.items.length === 0) {
      return { message: 'Nothing to merge' };
    }

    const mergedItems = Object.values(
      dto.items.reduce(
        (acc, item) => {
          if (!item.variantId || item.quantity <= 0) return acc;

          if (!acc[item.variantId]) acc[item.variantId] = { ...item };
          else acc[item.variantId].quantity += item.quantity;

          return acc;
        },
        {} as Record<string, { variantId: string; quantity: number }>,
      ),
    );

    const response: any = await lastValueFrom(
      this.productService.findAllVariantForOrderService({
        variantIds: mergedItems.map((i) => i.variantId),
      }),
    );

    const validVariants = response.result.filter(
      (variant: any) =>
        !(
          user.role?.name === 'PROVIDER' &&
          variant.product?.createdBy === user.email
        ),
    );

    const validVariantMap = new Map(validVariants.map((v: any) => [v.id, v]));

    return await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(this.cartRepository.target)
        .values({ userId, createdBy: user.email })
        .orIgnore()
        .execute();

      const cart = await manager.findOne(this.cartRepository.target, {
        where: { userId },
      });

      for (const item of mergedItems) {
        const { variantId, quantity } = item;

        if (!validVariantMap.has(variantId)) continue;

        await manager.query(
          `
            INSERT INTO "cartItems" ("cartId", "variantId", "quantity", "createdBy", "updatedBy")
            VALUES ($1, $2, $3, $4, $4)
            ON CONFLICT ("cartId", "variantId")
            DO UPDATE SET
              "quantity" = "cartItems"."quantity" + EXCLUDED."quantity",
              "updatedBy" = EXCLUDED."updatedBy"
          `,
          [cart.id, variantId, quantity, user.email],
        );
      }

      return { message: 'Cart merged successfully' };
    });
  }

  async clearCart(user: IUser) {
    const userId = user._id.toString();

    return await this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { userId },
        relations: { items: true },
      });

      if (!cart) {
        throw new RpcException('Cart not found');
      }

      await manager.delete(CartItem, { cartId: cart.id });
      await manager.delete(Cart, cart.id);

      return { message: 'Cart cleared successfully' };
    });
  }
}
