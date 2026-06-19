import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import {
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import { CartDto, MergeCartDto } from 'libs/dtos/cart/cart-dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @SkipPermission()
  @ResponseMessage('Get cart by user')
  findOneByUserId(@User() user: IUser) {
    return this.cartService.findOneByUserId(user._id.toString());
  }

  @Post()
  @SkipPermission()
  @ResponseMessage('Update cart by user')
  upsertUserCart(@User() user: IUser, @Body() dto: CartDto) {
    return this.cartService.upsertUserCart(dto, user);
  }

  @Post('merge')
  @SkipPermission()
  @ResponseMessage('Merge cart')
  mergeCart(@User() user: IUser, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(dto, user);
  }

  @Delete('clear')
  @SkipPermission()
  @ResponseMessage('Clear cart')
  clearCart(@User() user: IUser) {
    return this.cartService.clearCart(user);
  }
}
