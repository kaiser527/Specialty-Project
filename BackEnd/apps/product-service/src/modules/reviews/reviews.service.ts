import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entites/reviews.entity';
import { In, Repository } from 'typeorm';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { IdentityService, IUser, ReviewNode } from 'libs/utils/interface';
import {
  CreateReviewDTO,
  DeleteReviewDTO,
  FindAllReviewsDTO,
  UpdateReviewDTO,
} from 'libs/dtos/review/review.dto';
import { buildReviewTreeSafe } from '../../utils/helpers';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReviewsService implements OnModuleInit {
  private identityService: IdentityService;

  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,

    @Inject('IDENTITY_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.identityService =
      this.client.getService<IdentityService>('IdentityService');
  }

  async findAllRawReviews() {
    const result = await this.reviewsRepository.find();
    return { result };
  }

  async createReview(dto: CreateReviewDTO, user: IUser) {
    //@ts-ignore
    const { user: _, parentId, ...rest } = dto;

    const userId = user._id.toString();

    let depth = 0;

    if (parentId) {
      const parent = await this.reviewsRepository.findOne({
        where: { id: parentId },
      });

      if (!parent) {
        throw new RpcException('Parent review not found');
      }

      depth = parent.depth + 1;
    }

    if (rest.rating && (rest.rating < 1 || rest.rating > 5)) {
      throw new RpcException('Rating must be between 1 and 5');
    }

    const review = this.reviewsRepository.create({
      ...rest,
      userId,
      parentId: parentId ?? null,
      depth,
      createdBy: user.email,
    });

    if (review.depth !== 0 && rest.rating !== undefined) {
      throw new RpcException('Cannot set rating for replies');
    }

    await this.reviewsRepository.save(review);

    return { message: 'Create review successfully' };
  }

  async updateReview(id: string, dto: UpdateReviewDTO, user: IUser) {
    //@ts-ignore
    const { user: _, id: __, ...rest } = dto;

    const review = await this.reviewsRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new RpcException('Review not exist');
    }

    if (review.userId !== user._id.toString()) {
      throw new RpcException('You are not allowed to edit this review');
    }

    if (review.depth !== 0) {
      delete rest.rating;
    }

    if (rest.rating && (rest.rating < 1 || rest.rating > 5)) {
      throw new RpcException('Rating must be between 1 and 5');
    }

    const result = await this.reviewsRepository.update(id, {
      ...rest,
      updatedBy: user.email,
    });

    if (result.affected === 0) {
      throw new RpcException('Update failed');
    }

    return { message: 'Update review successfully' };
  }

  async deleteReview(id: string, user: IUser) {
    const review = await this.reviewsRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new RpcException('Review not exist');
    }

    const isOwner = review.userId === user._id.toString();
    const isPrivileged = ['ADMIN', 'STAFF'].includes(user.role.name);

    if (!isOwner && !isPrivileged) {
      throw new RpcException('You are not allowed to delete this review');
    }

    const result = await this.reviewsRepository.delete(id);

    if (result.affected === 0) {
      throw new RpcException('Delete failed');
    }

    return { message: 'Delete review successfully' };
  }

  async getAllDescendants(rootIds: string[]): Promise<Review[]> {
    let allIds = [...rootIds];
    let collected: Review[] = [];

    while (allIds.length > 0) {
      const children = await this.reviewsRepository.find({
        where: { parentId: In(allIds) },
      });

      if (children.length === 0) break;

      collected.push(...children);
      allIds = children.map((c) => c.id);
    }

    return collected;
  }

  async findAllReviewsByVariantId(dto: FindAllReviewsDTO) {
    const { variantId, currentPage, limit } = dto;
    const skip = (currentPage - 1) * limit;

    const [rootReviews, total] = await this.reviewsRepository.findAndCount({
      where: { variantId, depth: 0 },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    if (rootReviews.length === 0) {
      return {
        reviews: [],
        meta: {
          total,
          currentPage,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const rootIds = rootReviews.map((r) => r.id);

    const descendants = await this.getAllDescendants(rootIds);

    const allRelatedReviews = [...rootReviews, ...descendants];

    const reviewTree = buildReviewTreeSafe(allRelatedReviews);

    const collectUserIds = (nodes: ReviewNode[], set = new Set<string>()) => {
      for (const node of nodes) {
        if (node.userId) set.add(node.userId);
        if (node.children?.length) {
          collectUserIds(node.children, set);
        }
      }
      return Array.from(set);
    };

    const userIds = collectUserIds(reviewTree);
    const usersRes: any = await lastValueFrom(
      this.identityService.findAllUsers({
        ops: userIds,
        strategy: 'id',
      }),
    );

    const userMap = new Map(
      (usersRes?.result || []).map((u: any) => [u._id, u]),
    );

    const attachUser = (nodes: ReviewNode[]): any[] =>
      nodes.map((node) => ({
        ...node,
        user: userMap.get(node.userId) || null,
        children: attachUser(node.children || []),
      }));

    return {
      reviews: attachUser(reviewTree),
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }

  async deleteReviewsByVariantsOrUsers(dto: DeleteReviewDTO) {
    const { variantIds, userIds } = dto;

    if (!variantIds?.length && !userIds?.length) {
      throw new RpcException('variantIds or userIds must be provided');
    }

    if (variantIds?.length && userIds?.length) {
      throw new RpcException(
        'Cannot delete by both variantIds and userIds at the same time',
      );
    }

    const where: any = {};

    if (variantIds?.length) {
      where.variantId = In(variantIds);
    }

    if (userIds?.length) {
      where.userId = In(userIds);
    }

    await this.reviewsRepository.delete(where);

    return { message: 'Delete reviews successfully' };
  }
}
