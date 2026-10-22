import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '../../generated/prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'لاته' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'لاته کلاسیک با شیر تازه' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Price in Rial as integer string (no decimals)',
    example: '180000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'price must be a non-negative integer string in Rial' })
  price!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/images/latte.jpg'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({ enum: MealType, example: MealType.BREAKFAST })
  @IsEnum(MealType)
  mealType!: MealType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Category id', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;
}
