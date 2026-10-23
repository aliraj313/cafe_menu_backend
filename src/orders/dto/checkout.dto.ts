import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Optional table number for dine-in orders',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  tableNumber?: number | null;
}
