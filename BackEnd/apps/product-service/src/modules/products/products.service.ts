import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { applyBuildWhereQB } from 'libs/utils/helpers';
import {
  BulkCreateProductDto,
  CreateProductDto,
  GetMinMaxPriceDto,
} from 'libs/dtos/product/create-product.dto';
import {
  SwitchProductAuthorDTO,
  UpdateProductDto,
} from 'libs/dtos/product/update-product.dto';
import { CategoriesService } from '../categories/categories.service';
import { applyVariantFilters, generateSku } from '../../utils/helpers';
import { IdentityService, IUser, OrderService } from 'libs/utils/interface';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ProductStatus } from 'libs/utils/constants';
import { CartDto } from 'libs/dtos/cart/cart-dto';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,

    private categoriesService: CategoriesService,
    private reviewsService: ReviewsService,

    private dataSource: DataSource,

    @Inject('IDENTITY_SERVICE') private clientIdentity: ClientGrpc,
    @Inject('ORDER_SERVICE') private clientOrder: ClientGrpc,
  ) {}

  private identityService: IdentityService;
  private orderService: OrderService;

  onModuleInit() {
    this.identityService =
      this.clientIdentity.getService<IdentityService>('IdentityService');

    this.orderService =
      this.clientOrder.getService<OrderService>('OrderService');
  }

  findAllVariantInit = async () => {
    const result = await this.variantsRepository.find();
    return { result };
  };

  getAllFiles = async () => {
    const variants = await this.variantsRepository.find({
      select: { images: true },
    });
    const products = await this.productsRepository.find({
      select: { thumbnail: true },
    });

    const variantImages = variants.flatMap((p) => p.images ?? []);
    const productThumbnails = products.map((p) => p.thumbnail).filter(Boolean);

    return [...variantImages, ...productThumbnails];
  };

  findAll = async (
    currentPage: number,
    limit: number,
    qs: string,
    repo: 'variant' | 'product' = 'variant',
  ) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, sort } = aqp(qs);

    const specialOrderMap: Record<string, 'ASC' | 'DESC'> = {};

    delete filter.current;
    delete filter.pageSize;

    const search = filter?.search;
    delete filter.search;

    const skuFilter = filter?.sku;
    delete filter.sku;

    console.log(filter);

    const repository =
      repo === 'variant' ? this.variantsRepository : this.productsRepository;
    const alias = repo;
    const qb = repository.createQueryBuilder(alias);

    if (repo === 'variant') {
      qb.leftJoinAndSelect(`${alias}.product`, 'product');
      qb.leftJoinAndSelect('product.category', 'category');
      qb.addSelect(
        `${alias}.price * (1 - COALESCE(${alias}.discount,0)/100)`,
        'discountedPrice',
      );
      qb.leftJoin(`${alias}.reviews`, 'reviews');
      qb.addSelect(`COALESCE(AVG(reviews.rating),0)`, 'avgRating');
      qb.addSelect(`COUNT(reviews.id)`, 'reviewsCount');
      qb.groupBy(`${alias}.id`);
      qb.addGroupBy(`product.id`);
      qb.addGroupBy(`category.id`);
      qb.andWhere(`product.status=:status`, {
        status: ProductStatus.APPROVED,
      });
    }

    if (repo === 'product') {
      qb.leftJoinAndSelect(`${alias}.category`, 'category');

      if (skuFilter) {
        qb.leftJoinAndSelect(`${alias}.variants`, 'variants');
        qb.andWhere(`variants.sku=:sku`, {
          sku: skuFilter,
        });
      }
    }

    for (const key in filter) {
      const value = filter[key];

      if (value === 'max') {
        specialOrderMap[key] = 'DESC';
        continue;
      }

      if (value === 'min') {
        specialOrderMap[key] = 'ASC';
        continue;
      }

      if (key === 'price' && repo === 'variant') {
        applyBuildWhereQB(qb, 'price', value, {
          transform: () =>
            `(${alias}.price * (1 - COALESCE(${alias}.discount,0)/100))`,
          paramPrefix: 'price',
        });
        continue;
      }

      if (key === 'stock' && repo === 'variant') {
        applyBuildWhereQB(qb, `${alias}.stock`, value, {
          paramPrefix: 'stock',
        });
        continue;
      }

      if (key === 'discount' && repo === 'variant') {
        applyBuildWhereQB(qb, `${alias}.discount`, value, {
          paramPrefix: 'discount',
        });
        continue;
      }

      if (key === 'dueDate' && repo === 'variant') {
        applyBuildWhereQB(qb, `${alias}.dueDate`, value, {
          transform: (col) => `DATE(${col})`,
          paramPrefix: 'dueDate',
        });
        continue;
      }

      if (key === 'createdAt') {
        applyBuildWhereQB(qb, `${alias}.createdAt`, value, {
          transform: (col) => `DATE(${col})`,
          paramPrefix: 'createdAt',
        });
        continue;
      }

      if (key === 'updatedAt') {
        applyBuildWhereQB(qb, `${alias}.updatedAt`, value, {
          transform: (col) => `DATE(${col})`,
          paramPrefix: 'updatedAt',
        });
        continue;
      }

      if (key === 'product.name' && repo === 'variant') {
        const raw = value;

        if (raw?.$in) {
          qb.andWhere(`product.name IN (:...names)`, { names: raw.$in });
        } else {
          const searchStr =
            raw instanceof RegExp ? raw.toString() : String(raw);

          if (/^\/.*\/i$/.test(searchStr)) {
            qb.andWhere(`product.name LIKE :keyword`, {
              keyword: `%${searchStr.match(/^\/(.*)\/i$/)[1]}%`,
            });
          } else {
            qb.andWhere(`product.name = :name`, { name: raw });
          }
        }
        continue;
      }

      if (key === 'product.createdBy' && repo === 'variant') {
        if (value?.$in) {
          qb.andWhere(`product.createdBy IN (:...createdByIds)`, {
            createdByIds: value.$in,
          });
        } else {
          qb.andWhere(`product.createdBy = :createdBy`, {
            createdBy: value,
          });
        }
        continue;
      }

      if (key === 'product.updatedBy' && repo === 'variant') {
        if (value?.$in) {
          qb.andWhere(`product.updatedBy IN (:...updatedByIds)`, {
            updatedByIds: value.$in,
          });
        } else {
          qb.andWhere(`product.updatedBy = :updatedBy`, {
            updatedBy: value,
          });
        }
        continue;
      }

      if (key === 'product.brand' && repo === 'variant') {
        if (value?.$in) {
          qb.andWhere(`product.brand IN (:...brands)`, {
            brands: value.$in,
          });
        } else {
          qb.andWhere(`product.brand LIKE :brand`, {
            brand: `%${value}%`,
          });
        }
        continue;
      }

      if (key === 'category' && repo === 'variant') {
        const categories = value?.$in
          ? await this.categoriesService.findByNames(value.$in)
          : await this.categoriesService.findByNameRegex(value);

        const ids = categories.map((c) => c.id);
        if (!ids.length) {
          qb.andWhere(`1=0`);
        } else {
          qb.andWhere(`product.categoryId IN (:...ids)`, { ids });
        }
        continue;
      }

      if (key === 'product.categoryId' && repo === 'variant') {
        if (value?.$in) {
          qb.andWhere(`product.categoryId IN (:...categoryIds)`, {
            categoryIds: value.$in,
          });
        } else {
          qb.andWhere(`product.categoryId = :categoryId`, {
            categoryId: value,
          });
        }
        continue;
      }

      if (key === 'category' && repo === 'product') {
        qb.andWhere(`category.name LIKE :name`, {
          name: `%${value}%`,
        });
      }

      if (key === 'name' && repo === 'product') {
        qb.andWhere(`${alias}.name LIKE :name`, {
          name: `%${value}%`,
        });
      }

      if (key === 'brand' && repo === 'product') {
        qb.andWhere(`${alias}.brand LIKE :brand`, {
          brand: `%${value}%`,
        });
      }

      if (key === 'status' && repo === 'product') {
        qb.andWhere(`${alias}.status = :status`, {
          status: value,
        });
      }

      if (key === 'createdBy' && repo === 'product') {
        qb.andWhere(`${alias}.createdBy LIKE :createdBy`, {
          createdBy: `%${value}%`,
        });
      }
    }

    if (repo === 'variant' && search) {
      const keyword = `%${search}%`;

      qb.andWhere(
        `(LOWER(JSON_UNQUOTE(JSON_EXTRACT(${alias}.attributes,'$'))) LIKE LOWER(:keyword) OR ${alias}.sku LIKE :keyword OR product.name LIKE :keyword)`,
        { keyword },
      );
    }

    const addSort = (key: string, dir: any) => {
      if (key === 'price' && repo === 'variant') {
        qb.addOrderBy('discountedPrice', dir);
        return;
      }

      if (key === 'rating' && repo === 'variant') {
        qb.addOrderBy('avgRating', dir);
        return;
      }

      if (key === 'reviews' && repo === 'variant') {
        qb.addOrderBy('reviewsCount', dir);
        qb.addOrderBy('avgRating', 'DESC');
        return;
      }

      if (key === 'category' && repo === 'product') {
        qb.addOrderBy('category.name', dir);
        return;
      }

      qb.addOrderBy(key.includes('.') ? key : `${alias}.${key}`, dir);
    };

    if (sort) {
      for (const key in sort) {
        addSort(key, sort[key] === 1 ? 'DESC' : 'ASC');
      }
    }

    for (const key in specialOrderMap) {
      addSort(key, specialOrderMap[key]);
    }

    if (!sort && !Object.keys(specialOrderMap).length) {
      qb.orderBy(`${alias}.createdAt`, 'DESC');
    }

    if (Object.keys(specialOrderMap).length) {
      limit = 1;
    }

    qb.take(limit);
    qb.skip((currentPage - 1) * limit);

    const [result, total] = await Promise.all([
      qb.getMany(),
      qb.clone().getCount(),
    ]);

    if (repo === 'product') {
      result.forEach((r: any) => {
        delete r.category?.description;
      });
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
  };

  create = async (dto: CreateProductDto, user: IUser) => {
    const { variants = [], ...rest } = dto;

    const isExist = await this.productsRepository.findOne({
      where: { name: dto.name },
    });

    if (isExist) {
      throw new RpcException('Product is already exist');
    }

    const category = await this.categoriesService.findOne(rest.categoryId);
    if (!category) {
      throw new RpcException('Category is not exist');
    }

    if (user.role.name === 'PROVIDER' && dto.status !== ProductStatus.PENDING) {
      throw new RpcException('You must set status to pending');
    }

    const createdProduct = await this.productsRepository.save({
      ...rest,
      createdBy: user.email,
    });

    let createdVariants = [];

    if (variants && variants?.length > 0) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 3);
      createdVariants = await this.variantsRepository.save(
        variants.map((v) => ({
          ...v,
          images: v.images ?? [],
          dueDate: user.role.name === 'PROVIDER' ? dueDate : v.dueDate,
          productId: createdProduct.id,
          createdBy: user.email,
          sku: generateSku(
            category.name,
            createdProduct.name,
            v.attributes || {},
          ),
        })),
      );
    }

    delete category.description;

    return { ...{ ...createdProduct, category }, variants: createdVariants };
  };

  update = async (id: string, dto: UpdateProductDto, user: IUser) => {
    //@ts-ignore
    const { variants = [], user: _, id: __, ...rest } = dto;

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['variants'],
    });

    if (!product) {
      throw new RpcException('Product is not exist');
    }

    if (user.role.name === 'PROVIDER' && product.createdBy !== user.email) {
      throw new RpcException('You are not allowed to update this product');
    }

    if (
      user.role.name === 'PROVIDER' &&
      product.status === ProductStatus.PENDING &&
      dto.status !== product.status
    ) {
      throw new RpcException('You cannot update order status');
    }

    if (
      user.role.name === 'PROVIDER' &&
      (product.status === ProductStatus.APPROVED ||
        product.status === ProductStatus.REJECTED)
    ) {
      throw new RpcException('Product cannot be updated');
    }

    const category = await this.categoriesService.findOne(rest.categoryId);
    if (!category) {
      throw new RpcException('Category is not exist');
    }

    await this.productsRepository.update(id, {
      ...rest,
      updatedBy: user.email,
    });

    const existingVariants = product.variants || [];
    const existingMap = new Map(existingVariants.map((v) => [v.id, v]));

    const dtoMap = new Map(variants.filter((v) => v.id).map((v) => [v.id, v]));

    const updatedVariants = variants
      .filter((v) => v.id && existingMap.has(v.id))
      .map((v) => ({
        ...existingMap.get(v.id),
        ...v,
        images: v.images ?? [],
        dueDate:
          user.role.name === 'PROVIDER'
            ? existingMap.get(v.id).dueDate
            : v.dueDate,
        updatedBy: user.email,
        sku: generateSku(category.name, product.name, v.attributes || {}),
      }));

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 3);

    const toCreate = variants
      .filter((v) => !v.id || !existingMap.has(v.id))
      .map((v) => ({
        ...v,
        images: v.images ?? [],
        dueDate: user.role.name === 'PROVIDER' ? dueDate : v.dueDate,
        productId: id,
        createdBy: user.email,
        sku: generateSku(category.name, product.name, v.attributes || {}),
      }));

    const toDeleteIds = existingVariants
      .filter((v) => !dtoMap.has(v.id))
      .map((v) => v.id);

    if (updatedVariants.length) {
      try {
        await this.variantsRepository.save(updatedVariants);
      } catch (error) {
        throw new RpcException(error.message);
      }
    }

    if (toCreate.length) {
      try {
        await this.variantsRepository.save(toCreate);
      } catch (error) {
        throw new RpcException(error.message);
      }
    }

    if (toDeleteIds.length) {
      const res: any = await lastValueFrom(
        this.orderService.findAllOrderItemsByVariantIds({
          variantIds: toDeleteIds,
        }),
      );

      const cartItems = res?.cartItems ?? [];
      const orderItems = res?.orderItems ?? [];

      if (cartItems.length > 0 || orderItems.length > 0) {
        throw new RpcException(
          'Cannot delete variant(s) because it is used in cart or orders',
        );
      }

      await this.reviewsService.deleteReviewsByVariantsOrUsers({
        variantIds: toDeleteIds,
      });

      await this.variantsRepository.update(toDeleteIds, {
        isDeleted: true,
        deletedBy: user.email,
      });

      await this.variantsRepository.softDelete(toDeleteIds);
    }

    const updatedProduct = await this.productsRepository.findOne({
      where: { id },
      relations: ['variants', 'category'],
    });

    delete updatedProduct.category.description;

    return updatedProduct;
  };

  delete = async (id: string, user: IUser) => {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['variants'],
    });

    if (!product) {
      throw new RpcException('Product is not exist');
    }

    if (user.role.name === 'PROVIDER' && product.createdBy !== user.email) {
      throw new RpcException('You are not allowed to delete this product');
    }

    if (
      user.role.name === 'PROVIDER' &&
      (product.status === ProductStatus.APPROVED ||
        product.status === ProductStatus.REJECTED)
    ) {
      throw new RpcException('Product cannot be deleted');
    }

    if (product.variants?.length) {
      const variantIds = product.variants.map((v) => v.id);

      const res: any = await lastValueFrom(
        this.orderService.findAllOrderItemsByVariantIds({ variantIds }),
      );

      const cartItems = res?.cartItems ?? [];
      const orderItems = res?.orderItems ?? [];

      if (cartItems.length > 0 || orderItems.length > 0) {
        throw new RpcException(
          'Cannot delete variant(s) because it is used in cart or orders',
        );
      }

      await this.reviewsService.deleteReviewsByVariantsOrUsers({ variantIds });

      await this.variantsRepository.update(variantIds, {
        deletedBy: user.email,
        isDeleted: true,
      });

      await this.variantsRepository.softDelete(variantIds);
    }

    await this.productsRepository.update(id, {
      deletedBy: user.email,
      isDeleted: true,
    });

    await this.productsRepository.softDelete(id);

    return { message: 'Delete success' };
  };

  findOne = async (id: string) => {
    const result = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true, variants: true },
    });
    if (result?.createdBy) {
      const data = await lastValueFrom(
        this.identityService.findOne({
          op: result.createdBy,
          strategy: 'username',
        }),
      );
      //@ts-ignore
      result.user = data;
    } else {
      throw new RpcException('Product not found');
    }

    return result;
  };

  bulkCreate = async (dtos: BulkCreateProductDto[], user: IUser) => {
    if (!dtos.length) return [];

    return await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(ProductVariant);

      const names = dtos.map((d) => d.name);

      const existingProducts = await productRepo.find({
        where: { name: In(names) },
        select: ['name'],
      });

      if (existingProducts.length) {
        throw new RpcException(
          `Products already exist: ${existingProducts
            .map((p) => p.name)
            .join(', ')}`,
        );
      }

      const categoryNames = [...new Set(dtos.map((d) => d.category))];

      const categories =
        await this.categoriesService.findByNames(categoryNames);

      const categoryMap = new Map(categories.map((c) => [c.name, c]));

      const productEntities = dtos.map((dto) => {
        const category = categoryMap.get(dto.category);

        if (!category) {
          throw new RpcException(`Category not found: ${dto.category}`);
        }

        return productRepo.create({
          name: dto.name,
          brand: dto.brand,
          description: dto.description,
          status: ProductStatus.PENDING,
          thumbnail: 'empty.jpg',
          categoryId: category.id,
          createdBy: user.email,
        });
      });

      const createdProducts = await productRepo.save(productEntities);

      const productMap = new Map(createdProducts.map((p) => [p.name, p]));

      const variantEntities: ProductVariant[] = [];

      dtos.forEach((dto) => {
        const product = productMap.get(dto.name);
        const category = categoryMap.get(dto.category);

        if (!dto.variants?.length) return;

        dto.variants.forEach((v) => {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 3);

          variantEntities.push(
            variantRepo.create({
              ...v,
              dueDate,
              images: [],
              discount: 0,
              productId: product.id,
              createdBy: user.email,
              sku: generateSku(category.name, product.name, v.attributes || {}),
            }),
          );
        });
      });

      try {
        await variantRepo.save(variantEntities);
      } catch (error) {
        throw new RpcException(error.message);
      }

      return { message: 'Import success' };
    });
  };

  findOneVariant = async (id: string, isReview?: boolean) => {
    const variant = await this.variantsRepository.findOne({
      where: { id },
      relations: isReview ? { product: { category: true } } : { product: true },
    });

    if (!variant) {
      throw new RpcException('Variant not found');
    }

    if (isReview) {
      delete variant.product.category.description;
    }

    return variant;
  };

  finAllVariant = async (variantIds: string[]) => {
    const result = await this.variantsRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });

    return { result };
  };

  getMinMaxPriceByVariants = async (dto: GetMinMaxPriceDto) => {
    const priceQb = this.variantsRepository
      .createQueryBuilder('variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .select('MIN(variant.price * (1 - variant.discount / 100))', 'min')
      .addSelect('MAX(variant.price * (1 - variant.discount / 100))', 'max');

    applyVariantFilters(priceQb, dto);

    const brandQb = this.variantsRepository
      .createQueryBuilder('variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .select('DISTINCT product.brand', 'brand');

    applyVariantFilters(brandQb, dto);

    const categoryQb = this.variantsRepository
      .createQueryBuilder('variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .distinct(true)
      .select('category.id', 'id')
      .addSelect('category.name', 'name');

    applyVariantFilters(categoryQb, dto);

    const priceResult = await priceQb.getRawOne();
    const brandRows = await brandQb.getRawMany();
    const categoryRows = await categoryQb.getRawMany();

    const brandList = brandRows.map((row) => row.brand).filter(Boolean);
    const categories = categoryRows
      .filter((row) => row.id)
      .map((row) => ({
        id: row.id,
        name: row.name,
      }));

    return {
      result: [Number(priceResult?.min) || 0, Number(priceResult?.max) || 0],
      brands: brandList,
      categories,
    };
  };

  async updateVariantStock(items: CartDto[]) {
    return await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const result = await manager
          .createQueryBuilder()
          .update('product_variants')
          .set({ stock: () => `stock - :qty` })
          .where('id = :id', { id: item.variantId })
          .andWhere('stock >= :qty', { qty: item.quantity })
          .setParameters({ qty: item.quantity })
          .execute();

        if (result.affected === 0) {
          throw new RpcException(
            `Insufficient stock for variant ${item.variantId}`,
          );
        }
      }
      console.log('update');
      return { message: 'Update variant stock success' };
    });
  }

  async restoreVariantStock(items: CartDto[]) {
    return this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const result = await manager
          .createQueryBuilder()
          .update('product_variants')
          .set({ stock: () => `stock + :qty` })
          .where('id = :id', { id: item.variantId })
          .setParameters({ qty: item.quantity })
          .execute();

        if (result.affected === 0) {
          throw new RpcException(
            `Restore failed for variant ${item.variantId}`,
          );
        }
      }
      console.log('restore');
      return { message: 'Update variant stock success' };
    });
  }

  async updateProductCreatedBy(oldEmail: string, newEmail: string) {
    await this.productsRepository.update(
      { createdBy: oldEmail },
      { createdBy: newEmail, updatedBy: newEmail },
    );
    await this.variantsRepository.update(
      { createdBy: oldEmail },
      { createdBy: newEmail, updatedBy: newEmail },
    );
    return { message: 'Update product author' };
  }

  async findAllProductsByUser(user: IUser) {
    const products = await this.productsRepository.find({
      where: { createdBy: user.email },
    });
    return { products };
  }

  async switchProductAuthorById(dto: SwitchProductAuthorDTO, user: IUser) {
    const { productId, newAuthorEmail } = dto;

    const userRes: any = await lastValueFrom(
      this.identityService.findOne({
        op: newAuthorEmail,
        strategy: 'username',
      }),
    );

    if (!userRes?._id) {
      throw new RpcException('New author not found');
    }

    if (userRes.role.name === 'USER') {
      throw new RpcException('New author must be provider or admin');
    }

    await this.productsRepository.update(
      { id: productId },
      { createdBy: newAuthorEmail, updatedBy: user.email },
    );

    await this.variantsRepository.update(
      { productId },
      { createdBy: newAuthorEmail, updatedBy: user.email },
    );

    return { message: 'Switch product author successfully' };
  }
}
