import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { OrderResponse } from './order.mapper';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Public()
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('carts/:cartId/checkout')
  @ApiOperation({ summary: 'Create an order from cart and prepare for payment' })
  checkout(@Param('cartId', ParseIntPipe) cartId: number): Promise<OrderResponse> {
    return this.ordersService.checkout(cartId);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by id' })
  get(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse> {
    return this.ordersService.get(id);
  }
}
