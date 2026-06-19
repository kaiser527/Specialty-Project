import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import { CreateReviewDTO, UpdateReviewDTO } from 'libs/dtos/review/review.dto';

@Controller('reviews')
export class ReviewsContronller {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @SkipPermission()
  @ResponseMessage('Create review')
  create(@Body() dto: CreateReviewDTO, @User() user: IUser) {
    return this.reviewsService.createReview(dto, user);
  }

  @Patch(':id')
  @SkipPermission()
  @ResponseMessage('Update review')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDTO,
    @User() user: IUser,
  ) {
    return this.reviewsService.updateReview(id, dto, user);
  }

  @Delete(':id')
  @SkipPermission()
  @ResponseMessage('Delete review')
  delete(@Param('id') id: string, @User() user: IUser) {
    return this.reviewsService.deleteReview(id, user);
  }
}
