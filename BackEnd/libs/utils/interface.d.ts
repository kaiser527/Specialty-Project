import { Types } from 'mongoose';
import { ResumeStatus } from 'src/modules/resumes/schemas/resume.schema';
import { AccountType } from 'src/modules/users/schemas/user.schema';
import {
  BulkCreateProductDto,
  CreateProductDto,
  GetMinMaxPriceDto,
} from 'libs/dtos/product/create-product.dto';
import {
  SwitchProductAuthorDTO,
  UpdateProductDto,
} from 'libs/dtos/product/update-product.dto';
import { CreateCategoryDto } from 'libs/dtos/category/create-category.dto';
import { UpdateCategoryDto } from 'libs/dtos/category/update-category.dto';
import { CartDto, MergeCartDto } from 'libs/dtos/cart/cart-dto';
import {
  ProviderFeeStatus,
  ProviderOrderStatus,
  OrderStatus,
} from './constants';
import {
  CreateVnPayPaymentDto,
  VerifyReturnUrlDto,
} from 'libs/dtos/payment/vn-pay-payment.dto';
import { DashboardDto } from 'libs/dtos/order/order-dto';
import {
  CreateReviewDTO,
  DeleteReviewDTO,
  FindAllReviewsDTO,
  UpdateReviewDTO,
} from 'libs/dtos/review/review.dto';
import { QuickUpdateProviderFeeDto } from 'libs/dtos/provider/provider.dto';
import { ChatDto } from 'libs/dtos/ai/chat.dto';
import {
  AiConversationPaginateDto,
  AiMessagePaginateDto,
} from 'libs/dtos/ai/message.dto';
import { CreateVoucherDto } from 'libs/dtos/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'libs/dtos/voucher/update-voucher.dto';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: IRole;
  permissions?: IPermission[];
  accountType: AccountType;
  isActive: boolean;
  age: number;
  address: string;
  gender: string;
  image: string;
}

export interface IRole {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
}

export interface IPermission {
  _id: Types.ObjectId;
  name: string;
  module: string;
  apiPath: string;
  method: string;
}

export interface IAuthorObject extends Pick<IUser, '_id' | 'email'> {}

export interface IToken {
  sub: string;
  iss: string;
  jti: string;
  type: string;
  exp?: number;
}

export interface IdentityService {
  findAll(data: { currentPage: number; limit: number; qs: string }): any;
  findOne(data: { op: string; strategy: 'id' | 'username' | 'token' }): any;
  findAllUsers(data: { ops: string[]; strategy: 'id' | 'email' }): any;
  findAllUsersLoadBalancing({}): any;
}

export interface ProductService {
  getAllFiles({}): any;
  findAllVariant(data: { currentPage: number; limit: number; qs: string }): any;
  findAllProduct(data: { currentPage: number; limit: number; qs: string }): any;
  findAllCategory(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }): any;
  findOneProduct(data: { id: string }): any;
  createProduct(data: CreateProductDto & { user: IUser }): any;
  updateProduct(data: UpdateProductDto & { user: IUser; id: string }): any;
  deleteProduct(data: { id: string; user: IUser }): any;
  bulkCreateProduct(data: {
    products: BulkCreateProductDto[];
    user: IUser;
  }): any;
  findAllVariantForOrderService(data: { variantIds: string[] }): any;
  findOneVariant(data: { id: string; isReview?: boolean }): any;
  createCategory(data: CreateCategoryDto & { user: IUser }): any;
  updateCategory(data: UpdateCategoryDto & { user: IUser; id: string }): any;
  deleteCategory(data: { id: string; user: IUser }): any;
  getMinMaxPriceByVariants(data: GetMinMaxPriceDto): any;
  updateVariantStock(data: { items: CartDto[] }): any;
  restoreVariantStock(data: { items: CartDto[] }): any;
  updateProductCreatedBy(data: { oldEmail: string; newEmail: string }): any;
  findAllReviewsByVariantId(data: FindAllReviewsDTO): any;
  createReview(data: CreateReviewDTO & { user: IUser }): any;
  updateReview(data: UpdateReviewDTO & { user: IUser; id: string }): any;
  deleteReview(data: { id: string; user: IUser }): any;
  findAllProductsByUser(user: IUser): any;
  deleteReviewsByVariantsOrUsers(data: DeleteReviewDTO): any;
  switchProductAuthor(data: { dto: SwitchProductAuthorDTO; user: IUser }): any;
}

export interface OrderService {
  findCartByUser(data: { userId: string }): any;
  upsertUserCart(data: CartDto & { user: IUser }): any;
  mergeCart(data: MergeCartDto & { user: IUser }): any;
  clearCart(data: { user: IUser }): any;
  findAllOrder(data: { currentPage: number; limit: number; qs: string }): any;
  placeOrder(data: OrderDto & { user: IUser }): any;
  updateOrderStatus(data: {
    id: string;
    status: OrderStatus;
    user: IUser;
  }): any;
  findOneOrder(data: { id: string }): any;
  findOneByUser(data: { id: string; user: IUser }): any;
  deleteOrder(data: { id: string; user: IUser }): any;
  findAllProviderFee(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }): any;
  updateProviderFeeStatus(data: {
    id: string;
    status: ProviderFeeStatus;
    user: IUser;
  }): any;
  verifyReturnUrl(data: VerifyReturnUrlDto & { user: IUser }): any;
  createPaymentUrl(data: CreateVnPayPaymentDto): any;
  createStripePayment(data: { orderId: string }): any;
  verifyStripePayment(data: { sessionId: string }): any;
  findAllProviderOrder(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }): any;
  updateProviderOrderStatus(data: {
    id: string;
    status: ProviderOrderStatus;
    user: IUser;
  }): any;
  updateProviderOrdersByOrderId(data: {
    orderId: string;
    status: ProviderOrderStatus;
    user: IUser;
  });
  quickUpdateProviderFeeStatus(data: {
    dto: QuickUpdateProviderFeeDto;
    user: IUser;
  }): any;
  dashboard(data: DashboardDto): any;
  getDashboardDateRange({}): any;
  findAllOrderItemsByVariantIds(data: { variantIds: string[] }): any;
  findAllOrdersByUser(user: IUser): any;
  providerFeeDashboard(data: { dto: DashboardDto; ownerId?: string }): any;
  getProviderFeeDashboardDateRange(data: { ownerId?: string }): any;
  deleteProviderFeesAndOrdersByOwner(data: {
    ownerId: string;
    user: IUser;
  }): any;
  findAllVouchers(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }): any;
  findAllUsages(data: { currentPage: number; limit: number; qs: string }): any;
  createVoucher(data: { dto: CreateVoucherDto; user: IUser }): any;
  updateVoucher(data: { dto: UpdateVoucherDto; user: IUser }): any;
  findVoucherByCodeAndUser(data: { code: string; user: IUser }): any;
  deleteVoucher(data: { id: string }): any;
}

export interface IDashboardRevenue {
  summary: {
    paymentPercent: {
      LOCAL: number;
      VNPAY: number;
      CREDIT_CARD: number;
    };
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  };
  chart: {
    labels: string[];
    revenue: number[];
    orders: number[];
  };
}

export interface ReviewNode {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  variantId: string;
  parentId: string | null;
  depth: number;
  createdAt: Date;
  children: ReviewNode[];
}

export interface GeminiService {
  chat(dto: ChatDto): any;
}

export interface ChatEFService {
  findAllMessage(dto: AiMessagePaginateDto): any;
  findAllConversation(dto: AiConversationPaginateDto): any;
  deleteConversationByUser(data: { userId: string }): any;
}
