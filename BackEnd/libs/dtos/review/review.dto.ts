import { OmitType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReviewDTO {
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  rating?: number;

  @IsOptional()
  parentId?: string;

  @IsNotEmpty()
  variantId: string;
}

export class FindAllReviewsDTO {
  @IsNotEmpty()
  currentPage: number;

  @IsNotEmpty()
  limit: number;

  @IsNotEmpty()
  variantId: string;
}

export class UpdateReviewDTO extends OmitType(CreateReviewDTO, [
  'parentId',
  'variantId',
] as const) {}

export class DeleteReviewDTO {
  @IsOptional()
  @IsArray()
  variantIds?: string[];

  @IsOptional()
  @IsArray()
  userIds?: string[];
}
