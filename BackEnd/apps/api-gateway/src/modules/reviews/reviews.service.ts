import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateReviewDTO, UpdateReviewDTO } from 'libs/dtos/review/review.dto';
import { IUser, ProductService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ReviewsService implements OnModuleInit {
  private productService: ProductService;

  constructor(
    private socket: SocketGateway,

    @Inject('PRODUCT_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async createReview(dto: CreateReviewDTO, user: IUser) {
    const result = await grpcCall(
      this.productService.createReview({ ...dto, user }),
    );
    await this.socket.emitFindAllReviewsByVariantIdUpdate();
    return result;
  }

  async updateReview(id: string, dto: UpdateReviewDTO, user: IUser) {
    const result = await grpcCall(
      this.productService.updateReview({ ...dto, user, id }),
    );
    await this.socket.emitFindAllReviewsByVariantIdUpdate();
    return result;
  }

  async deleteReview(id: string, user: IUser) {
    const result = await grpcCall(
      this.productService.deleteReview({ user, id }),
    );
    await this.socket.emitFindAllReviewsByVariantIdUpdate();
    return result;
  }
}
