import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/categories.entity';
import { CategoriesGrpcController } from './categories.grpc.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesGrpcController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
