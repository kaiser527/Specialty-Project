import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ResponseMessage, User } from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import { ProviderFeeStatus, ProviderOrderStatus } from 'libs/utils/constants';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Patch('fee/:id')
  @ResponseMessage('Update Provider fee status')
  updateProviderFeeStatus(
    @Param('id') id: string,
    @Body('status') status: ProviderFeeStatus,
    @User() user: IUser,
  ) {
    return this.providersService.updateProviderFeeStatus(id, status, user);
  }

  @Patch('order/:id')
  @ResponseMessage('Update Provider order status')
  updateProviderOrderStatus(
    @Param('id') id: string,
    @Body('status') status: ProviderOrderStatus,
    @User() user: IUser,
  ) {
    return this.providersService.updateProviderOrderStatus(id, status, user);
  }

  @Patch('order-bulk/:id')
  @ResponseMessage('Bulk Update Provider order status')
  updateProviderOrdersByOrderId(
    @Param('id') orderId: string,
    @Body('status') status: ProviderOrderStatus,
    @User() user: IUser,
  ) {
    return this.providersService.updateProviderOrdersByOrderId(
      orderId,
      status,
      user,
    );
  }

  @Patch('fee-bulk/:id')
  @ResponseMessage('Bulk Update Provider fee status')
  quickUpdateProviderFeeStatus(
    @Param('id') ownerId: string,
    @Body('status') status: ProviderFeeStatus,
    @Body('orderId') orderId: string,
    @User() user: IUser,
  ) {
    return this.providersService.quickUpdateProviderFeeStatus(
      ownerId,
      status,
      user,
      orderId,
    );
  }
}
