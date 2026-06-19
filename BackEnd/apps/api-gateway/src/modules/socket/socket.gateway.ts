import { Inject, OnModuleInit, UseFilters, UseGuards } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DashboardDto } from 'libs/dtos/order/order-dto';
import {
  GeminiService,
  IDashboardRevenue,
  IPermission,
  IUser,
  OrderService,
  ProductService,
} from 'libs/utils/interface';
import { Server, Socket } from 'socket.io';
import { grpcCall, handleRpcRedis, normalizeKeys } from '../../utils/helper';
import { FindAllReviewsDTO } from 'libs/dtos/review/review.dto';
import { WsExceptionFilter } from '../../core/ws-exception.filter';
import { WsAuthGuard } from '../auth/guard/ws-auth.guard';
import {
  AllowGuestWs,
  SkipCheckTokenBlacklist,
  WsUser,
} from '../../utils/decorator.customize';
import { ChatDto } from 'libs/dtos/ai/chat.dto';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WsExceptionFilter())
export class SocketGateway implements OnModuleInit {
  private orderService: OrderService;
  private productService: ProductService;
  private geminiService: GeminiService;

  constructor(
    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
    @Inject('ORDER_SERVICE') private clientOrder: ClientGrpc,
    @Inject('MESSAGE_SERVICE') private clientMessage: ClientGrpc,
    @Inject('IDENTITY_SERVICE') private identityClient: ClientProxy,
  ) {}

  hasPermission(user: any, apiPath: string, method: string) {
    return user.role.permissions.some(
      (p: IPermission) => p.apiPath === apiPath && p.method === method,
    );
  }

  onModuleInit() {
    this.orderService =
      this.clientOrder.getService<OrderService>('OrderService');

    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');

    this.geminiService =
      this.clientMessage.getService<GeminiService>('GeminiService');
  }

  @WebSocketServer()
  server: Server;

  async emitDashboardUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const filter = client.data.dashboardFilter;
      if (!filter) continue;
      const data: IDashboardRevenue = await grpcCall(
        this.orderService.dashboard(filter),
      );
      client.emit('dashboard:update', data);
    }
  }

  async emitProviderFeeDashboardUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const filter = client.data.providerDashboardFilter;
      if (!filter) continue;
      const data = await grpcCall(
        this.orderService.providerFeeDashboard(filter),
      );
      client.emit('providerFeeDashboard:update', data);
    }
  }

  async emitProviderFeeDashboardDateRangeUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const filter = client.data.providerDashboardDateRangeFilter;
      if (!filter) continue;
      const data = await grpcCall(
        this.orderService.getProviderFeeDashboardDateRange(filter),
      );
      client.emit('providerFeeDashboardDateRange:update', data);
    }
  }

  async emitUserRoleChartUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const data = await handleRpcRedis(
        this.identityClient,
        'user.getUserRoleChart',
        {},
      );
      client.emit('userRoleChart:update', data);
    }
  }

  async emitOrderUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const orderId = client.data.orderId;
      if (!orderId) continue;
      const data = await grpcCall(
        this.orderService.findOneOrder({ id: orderId }),
      );
      client.emit('findOneOrder:update', data);
    }
  }

  async emitFindAllOrderUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const payload = client.data.findAllOrderPayload;
      if (!payload) continue;
      const data = await grpcCall(this.orderService.findAllOrder(payload));
      client.emit('findAllOrder:update', data);
    }
  }

  async emitFindAllProviderFeeUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const payload = client.data.findAllProviderFeePayload;
      if (!payload) continue;
      const data = await grpcCall(
        this.orderService.findAllProviderFee(payload),
      );
      client.emit('findAllProviderFee:update', data);
    }
  }

  async emitFindAllProviderOrderUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const payload = client.data.findAllProviderOrderPayload;
      if (!payload) continue;
      const data = await grpcCall(
        this.orderService.findAllProviderOrder(payload),
      );
      client.emit('findAllProviderOrder:update', data);
    }
  }

  async emitFindAllOrderUserUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const payload = client.data.findAllOrderUserPayload;
      if (!payload) continue;
      const data = await grpcCall(this.orderService.findAllOrder(payload));
      client.emit('findAllOrderUser:update', data);
    }
  }

  async emitDashboardDateRangeUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const data = await grpcCall(this.orderService.getDashboardDateRange({}));
      client.emit('dashboardDaterange:update', data);
    }
  }

  async emitFindAllReviewsByVariantIdUpdate() {
    const clients = this.server.sockets.sockets;
    for (const client of clients.values()) {
      const payload = client.data.findAllReviewsByVariantIdPayload;
      if (!payload) continue;
      const data = await grpcCall(
        this.productService.findAllReviewsByVariantId(payload),
      );
      client.emit('findAllReviewsByVariantId:update', data);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('dashboard:subscribe')
  async handleSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DashboardDto,
  ) {
    client.data.dashboardFilter = payload;
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/orders/dashboard/revenue',
      'GET',
    );
    if (!isPermitted) {
      client.emit('dashboard:error', {
        message: 'You do not have permission to view the dashboard',
      });
      return;
    }
    const data: IDashboardRevenue = await grpcCall(
      this.orderService.dashboard(payload),
    );
    if (data) {
      client.emit('dashboard:update', data);
    } else {
      client.emit('dashboard:error', {
        message: 'Failed to load dashboard',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SkipCheckTokenBlacklist()
  @SubscribeMessage('providerFeeDashboard:subscribe')
  async handleProviderFeeDashboardSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DashboardDto,
  ) {
    client.data.providerDashboardFilter = {
      dto: payload,
      ownerId: user._id.toString(),
    };
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/providers/dashboard',
      'GET',
    );
    if (!isPermitted) {
      client.emit('providerFeeDashboard:error', {
        message:
          'You do not have permission to view the provider fee dashboard',
      });
      return;
    }
    const data = await grpcCall(
      this.orderService.providerFeeDashboard({
        dto: payload,
        ownerId: user._id.toString(),
      }),
    );
    if (data) {
      client.emit('providerFeeDashboard:update', data);
    } else {
      client.emit('providerFeeDashboard:error', {
        message: 'Failed to load provider fee dashboard',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SkipCheckTokenBlacklist()
  @SubscribeMessage('providerFeeDashboardDateRange:subscribe')
  async handleProviderFeeDashboardDateRangeSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
  ) {
    client.data.providerDashboardDateRangeFilter = {
      ownerId: user._id.toString(),
    };
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/providers/dashboard-daterange',
      'GET',
    );
    if (!isPermitted) {
      client.emit('providerFeeDashboardDateRange:error', {
        message:
          'You do not have permission to view the provider fee dashboard',
      });
      return;
    }
    const data = await grpcCall(
      this.orderService.getProviderFeeDashboardDateRange({
        ownerId: user._id.toString(),
      }),
    );
    if (data) {
      client.emit('providerFeeDashboardDateRange:update', data);
    } else {
      client.emit('providerFeeDashboardDateRange:error', {
        message: 'Failed to load provider fee dashboard date range',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('userRoleChart:subscribe')
  async handleuserRoleChartConnect(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
  ) {
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/users/role-chart',
      'GET',
    );
    if (!isPermitted) {
      client.emit('userRoleChart:error', {
        message:
          'You do not have permission to view the user role distribution pie chart',
      });
      return;
    }
    const data = await handleRpcRedis(
      this.identityClient,
      'user.getUserRoleChart',
      {},
    );
    if (data) {
      client.emit('userRoleChart:update', data);
    } else {
      client.emit('userRoleChart:error', {
        message: 'Failed to load user role distribution pie chart',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findOneOrder:subscribe')
  async handleOrderSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string; area: 'CLIENT' | 'ADMIN' },
  ) {
    client.data.orderId = payload.id;
    const isPermitted = this.hasPermission(user, '/api/v1/orders/:id', 'GET');
    if (!isPermitted && payload.area === 'ADMIN') {
      client.emit('findOneOrder:error', {
        message: 'You do not have permission to view this order',
      });
      return;
    }
    const data =
      payload.area === 'CLIENT'
        ? await grpcCall(
            this.orderService.findOneByUser({ id: payload.id, user }),
          )
        : await grpcCall(this.orderService.findOneOrder({ id: payload.id }));
    if (data) {
      client.emit('findOneOrder:update', data);
    } else {
      client.emit('findOneOrder:error', {
        message: 'Failed to load order',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findAllOrder:subscribe')
  async handleFindAllOrderSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { currentPage: number; limit: number; qs: string },
  ) {
    client.data.findAllOrderPayload = payload;
    const isPermitted = this.hasPermission(user, '/api/v1/orders', 'GET');
    if (!isPermitted) {
      client.emit('findAllOrder:error', {
        message: 'You do not have permission to view orders',
      });
      return;
    }
    const data = await grpcCall(this.orderService.findAllOrder(payload));
    if (data) {
      client.emit('findAllOrder:update', data);
    } else {
      client.emit('findAllOrder:error', {
        message: 'Failed to load orders',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findAllProviderFee:subscribe')
  async handleFindAllProviderFeeSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { currentPage: number; limit: number; qs: string },
  ) {
    client.data.findAllProviderFeePayload = payload;
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/providers/fee',
      'GET',
    );
    if (!isPermitted) {
      client.emit('findAllProviderFee:error', {
        message: 'You do not have permission to view provider fee',
      });
      return;
    }
    if (user.role.name === 'PROVIDER') {
      payload.qs += `&ownerId=${user._id.toString()}`;
    }
    const data = await grpcCall(this.orderService.findAllProviderFee(payload));
    if (data) {
      client.emit('findAllProviderFee:update', data);
    } else {
      client.emit('findAllProviderFee:error', {
        message: 'Failed to load provider fee',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findAllProviderOrder:subscribe')
  async handleFindAllProviderOrderSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { currentPage: number; limit: number; qs: string },
  ) {
    client.data.findAllProviderOrderPayload = payload;
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/providers/order',
      'GET',
    );
    if (!isPermitted) {
      client.emit('findAllProviderOrder:error', {
        message: 'You do not have permission to view provider order',
      });
      return;
    }
    payload.qs += `&ownerId=${user._id.toString()}`;
    const data = await grpcCall(
      this.orderService.findAllProviderOrder(payload),
    );
    if (data) {
      client.emit('findAllProviderOrder:update', data);
    } else {
      client.emit('findAllProviderOrder:error', {
        message: 'Failed to load provider order',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findAllOrderUser:subscribe')
  async handleFindAllOrderUserSubscribe(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { currentPage: number; limit: number; qs: string },
  ) {
    if (!user) {
      client.emit('findAllOrderUser:error', {
        message: 'Missing authentication info',
      });
      return;
    }
    payload.qs += `&userId=${user._id.toString()}`;
    client.data.findAllOrderUserPayload = payload;
    const data = await grpcCall(this.orderService.findAllOrder(payload));
    if (data) {
      client.emit('findAllOrderUser:update', data);
    } else {
      client.emit('findAllOrderUser:error', {
        message: 'Failed to load orders',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('dashboardDaterange:subscribe')
  async handleGetDashboardDateRange(
    @WsUser() user: IUser,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await grpcCall(this.orderService.getDashboardDateRange({}));
    const isPermitted = this.hasPermission(
      user,
      '/api/v1/orders/dashboard/daterange',
      'GET',
    );
    if (!isPermitted) {
      client.emit('dashboardDaterange:error', {
        message: 'You do not have permission to view dashboard date range',
      });
      return;
    }
    if (data) {
      this.server.emit('dashboardDaterange:update', data);
    } else {
      this.server.emit('dashboardDaterange:error', {
        message: 'Failed to load dashboard date range',
      });
    }
  }

  @SubscribeMessage('findAllReviewsByVariantId:subscribe')
  async handleFindAllReviewsByVariantId(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FindAllReviewsDTO,
  ) {
    const data = await grpcCall(
      this.productService.findAllReviewsByVariantId(payload),
    );
    client.data.findAllReviewsByVariantIdPayload = payload;
    if (data) {
      client.emit('findAllReviewsByVariantId:update', data);
    } else {
      client.emit('findAllReviewsByVariantId:error', {
        message: 'Failed to load reviews',
      });
    }
  }

  @AllowGuestWs()
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('ask_ai')
  async handleAskAi(
    @WsUser() user: IUser,
    @MessageBody() data: ChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (user?._id) {
      delete user.permissions;
      const accountTypeMap = {
        LOCAL: 0,
        GOOGLE: 1,
        FACEBOOK: 2,
      };
      data.user = {
        ...user,
        _id: user._id.toString(),
        accountType: accountTypeMap[user.accountType],
        role: {
          ...user.role,
          _id: user.role._id.toString(),
        },
      };
    } else {
      delete data.conversationId;
    }

    const response: any = await grpcCall(this.geminiService.chat(data));

    if (response.error) {
      client.emit('ai_reply', {
        type: 'error',
        message: response.error,
      });

      return;
    }

    let parsedData = [];

    try {
      parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data || '[]')
          : (response.data ?? []);

      parsedData = normalizeKeys(parsedData);
    } catch {
      parsedData = [];
    }

    client.emit('ai_reply', {
      type: 'success',
      data: { ...response, data: parsedData },
    });
  }
}
