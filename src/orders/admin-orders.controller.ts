import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginatedResult } from '../common/types/paginated-result';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderResponse } from './order.mapper';
import { OrdersService } from './orders.service';

@ApiTags('admin-orders')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List orders for admin panel with optional status filter and pagination',
  })
  findAll(@Query() query: ListOrdersQueryDto): Promise<PaginatedResult<OrderResponse>> {
    return this.ordersService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get any order by id (admin)' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse> {
    return this.ordersService.adminFindOne(id);
  }
}
