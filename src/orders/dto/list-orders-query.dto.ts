import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../generated/prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter by order status. Omit to list all statuses.',
    example: OrderStatus.PROCESSING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
