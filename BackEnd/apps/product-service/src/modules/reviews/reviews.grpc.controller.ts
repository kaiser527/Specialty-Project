import { Controller } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateReviewDTO,
  DeleteReviewDTO,
  FindAllReviewsDTO,
  UpdateReviewDTO,
} from 'libs/dtos/review/review.dto';
import { IUser } from 'libs/utils/interface';

@Controller()
export class ReviewsGrpcController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @GrpcMethod('ProductService', 'findAllReviewsByVariantId')
  async findAllVariant(data: FindAllReviewsDTO) {
    return await this.reviewsService.findAllReviewsByVariantId(data);
  }

  @GrpcMethod('ProductService', 'findAllRawReviews')
  async findAllRawReviews() {
    return await this.reviewsService.findAllRawReviews();
  }

  @GrpcMethod('ProductService', 'createReview')
  async createReview(data: CreateReviewDTO & { user: IUser }) {
    return await this.reviewsService.createReview(data, data.user);
  }

  @GrpcMethod('ProductService', 'updateReview')
  async updateReview(data: UpdateReviewDTO & { user: IUser; id: string }) {
    return await this.reviewsService.updateReview(data.id, data, data.user);
  }

  @GrpcMethod('ProductService', 'deleteReview')
  async deleteReview(data: { user: IUser; id: string }) {
    return await this.reviewsService.deleteReview(data.id, data.user);
  }

  @GrpcMethod('ProductService', 'deleteReviewsByVariantsOrUsers')
  async deleteReviewsByVariantsOrUsers(data: DeleteReviewDTO) {
    return await this.reviewsService.deleteReviewsByVariantsOrUsers(data);
  }
}
