import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import { OrderStatus } from 'libs/utils/constants';
import { OrderDto } from 'libs/dtos/order/order-dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ResponseMessage('Fetch orders paginate')
  findAll(@Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    const qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    return this.ordersService.findAll(+current, +pageSize, qs);
  }

  @Get(':id')
  @ResponseMessage('Fetch order by id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('user/paginate')
  @SkipPermission()
  @ResponseMessage('Fetch user orders')
  findByUser(@User() user: IUser, @Query() query: Record<string, any>) {
    const { current, pageSize, ...filters } = query;
    let qs = Object.keys(filters).length
      ? new URLSearchParams(filters as Record<string, string>).toString()
      : '';
    qs += `&userId=${user._id.toString()}`;
    return this.ordersService.findAll(+current, +pageSize, qs);
  }

  @Get('user/:id')
  @SkipPermission()
  @ResponseMessage('Fetch order by user')
  findOneByUser(@Param('id') id: string, @User() user: IUser) {
    return this.ordersService.findOneByUser(id, user);
  }

  @Patch(':id')
  @ResponseMessage('Update order status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @User() user: IUser,
  ) {
    return this.ordersService.updateOrderStatus(id, status, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete order')
  deleteOrder(@Param('id') id: string, @User() user: IUser) {
    return this.ordersService.deleteOrder(id, user);
  }

  @Post('place-order')
  @SkipPermission()
  @ResponseMessage('Place order')
  placeOrder(@Body() dto: OrderDto, @User() user: IUser) {
    return this.ordersService.placeOrder(dto, user);
  }
}
