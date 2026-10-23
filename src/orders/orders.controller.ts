import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { CheckoutResponse, OrderResponse } from './order.mapper';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('carts/checkout')
  @ApiOperation({
    summary:
      'Checkout active cart: create order if needed + create PENDING payment (paymentUrl later)',
  })
  checkout(@CurrentUser() user: AuthenticatedUser): Promise<CheckoutResponse> {
    return this.ordersService.checkout(user.id);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by id (owner only)' })
  get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    return this.ordersService.get(id, user.id);
  }
}
