import { ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: MealType })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isAvailable?: boolean;
}
