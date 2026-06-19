import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/products.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { DatabaseService } from './database.service';
import { Category } from '../categories/entities/categories.entity';
import { Review } from '../reviews/entites/reviews.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, Category, Review]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<string>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [],
        synchronize: true,
        autoLoadEntities: true,
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
