export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
}

export interface IModelPaginate<T> {
  meta: IMeta;
  result: T[];
}

export interface IMeta {
  current: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface IMetaCursor {
  pageSize: number;
  hasMore: boolean;
  nextCreatedAt: string;
  nextId: string;
}

export interface IModelPaginateCursor<T> {
  meta: IMetaCursor;
  result: T[];
}

export interface ICusorPaginateMessage {
  conversationId: string;
  limit?: number;
  lastCreatedAt?: string;
  lastId?: string;
}

export interface IAccount {
  access_token: string;
  user: Omit<IUser, "password">;
}

export interface IGetAccount extends Omit<IAccount, "access_token"> {}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  age: number;
  gender: string;
  address: string;
  isActive?: boolean;
  role: {
    _id: string;
    name: string;
    isActive: boolean;
  };
  permissions: {
    _id: string;
    name: string;
    apiPath: string;
    method: string;
    module: string;
  }[];
  accountType: string;
  image: string;
  createdBy?: string;
  deleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPermission {
  _id?: string;
  name?: string;
  apiPath?: string;
  method?: string;
  module?: string;
  createdBy?: string;
  deleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRole {
  _id?: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: IPermission[] | string[];
  createdBy?: string;
  deleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IChatMessage {
  id: string;
  data: any[];
  conversationId: string;
  messageRole: "Assistant" | "User";
  actions: IAction[];
  createdAt: string;
  content: string;
  qs?: string;
}

export interface IAction {
  label: string;
  route: string;
}

export interface IConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVariant {
  id?: string;
  productId?: string;
  product?: IProduct;
  price: number;
  discount: number;
  stock: number;
  sku: string;
  images: string[];
  attributes: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  dueDate: string;
  reviews?: ReviewNode[];
}

export interface ICategory {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProduct {
  id?: string;
  name: string;
  description: string;
  brand: string;
  thumbnail: string;
  status: string;
  categoryId?: string;
  category?: ICategory;
  variants?: IVariant[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  user?: Omit<IUser, "permissions">;
}

export interface IBulkCreateProduct {
  name: string;
  description: string;
  brand: string;
  category: string;
  variants: Omit<IVariant, "sku" | "images" | "discount" | "dueDate">[];
}

export interface ICart {
  id?: string;
  userId: string;
  items: ICartItem[];
}

export interface ICartItem {
  id: string;
  cartId?: string;
  quantity: number;
  cart?: ICart;
  variant: IVariant;
}

export interface IOrder {
  id: string;
  userId: string;
  user?: Omit<IUser, "permissions">;
  totalPrice: number;
  shippingFee: number;
  subTotal: number;
  status: string;
  name: string;
  phone: string;
  address: string;
  type: string;
  paymentRef: string;
  createdAt?: string;
  updatedAt?: string;
  items?: IOrderItem[];
  voucherCode?: string;
  discountAmount?: number;
  voucherId?: string;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  variant?: IVariant;
  quantity: number;
  unitPrice: number;
  createdBy: string;
  provider?: {
    status: string;
    email: string;
    image: string;
    name: string;
    role: string;
  };
}

export interface IProviderFeeItem {
  id: string;
  orderId: string;
  orderItemId: string;
  percent: number;
  feeAmount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  variant: IVariant;
}

export interface IProviderFeeOrder {
  orderId: string;
  items: IProviderFeeItem[];
}

export interface IProviderFee {
  user: Omit<IUser, "permissions">;
  orders: IProviderFeeOrder[];
}

export interface IPaymentResponse {
  paymentUrl: string;
  code: string;
  message: string;
}

export interface IProviderOrder {
  id: string;
  orderId: string;
  status: string;
  orderItem: IOrderItem;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProviderOrderGroup {
  orderId: string;
  items: IProviderOrder[];
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

export interface IDashboardDateRange {
  minDate: string;
  maxDate: string;
}

export interface ReviewNode {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  user: Omit<IUser, "permissions">;
  variantId: string;
  parentId: string | null;
  depth: number;
  createdAt: Date;
  children: ReviewNode[];
}

export interface IAiQs {
  brands: string[];
  createdBy: string[];
  updatedBy: string[];
  names: string[];
  categories: string[];
  nameRegex: string;
  priceOperators: { operator: string; value: number }[];
  dueDateOperators: { operator: string; value: string }[];
  createdAtOperators: { operator: string; value: string }[];
  updatedAtOperators: { operator: string; value: string }[];
}

export interface IMinMaxPriceQuery {
  categoryIds: string[];
  search?: string | null;
  brands: string[];
  createdBy?: string[];
  updatedBy?: string[];
  names?: string[];
  categories?: string[];
  nameRegex?: string;
  dueDateOperators?: { operator: string; value: string }[];
  priceOperators?: { operator: string; value: number }[];
  createdAtOperators?: { operator: string; value: string }[];
  updatedAtOperators?: { operator: string; value: string }[];
  isQueryBrand?: boolean;
}

export interface IMinMaxPrice {
  result: [number, number];
  brands: string[];
  categories: { id: string; name: string }[];
}

export interface IProviderFeeDashboard {
  summary: {
    totalFeeRevenue: number;
    avgFeeAmount: number;
  };
  chart: {
    labels: string[];
    revenue: number[];
  };
}

export interface IUserRoleChart {
  labels: string[];
  datasets: { data: number[] }[];
  total: number;
}

export interface IVoucher {
  id: string;
  code: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  expirationDate: string;
}

export interface IVoucherUsage {
  id: string;
  voucherId: string;
  userId: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  order: {
    discountAmount: number;
    voucherCode: string;
  };
}
