import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/products.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Category } from '../categories/entities/categories.entity';
import { INIT_CATEGORIES } from './sample/category';
import { INIT_PRODUCTS } from './sample/product';
import { INIT_VARIANTS } from './sample/variant';
import { Review } from '../reviews/entites/reviews.entity';
import { INIT_REVIEWS } from './sample/review';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,

    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,

    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async onModuleInit() {
    const categoriesCount = await this.categoriesRepository.count();
    const productsCount = await this.productsRepository.count();
    const variantsCount = await this.variantsRepository.count();
    const reviewsCount = await this.reviewsRepository.count();

    if (categoriesCount === 0) {
      await this.categoriesRepository.save(INIT_CATEGORIES);
    }

    if (productsCount === 0) {
      await this.productsRepository.save(INIT_PRODUCTS);
    }

    if (variantsCount === 0) {
      await this.variantsRepository.save(INIT_VARIANTS);
    }

    if (reviewsCount === 0) {
      const sortedReviews = INIT_REVIEWS.map((r) => ({
        ...r,
        parentId: r.parentId || null,
      })).sort((a, b) => a.depth - b.depth);

      await this.reviewsRepository.save(sortedReviews);
    }

    if (
      productsCount > 0 &&
      categoriesCount > 0 &&
      variantsCount > 0 &&
      reviewsCount
    ) {
      this.logger.log('>>> ALREADY INIT SAMPLE DATA...');
    }
  }
}
