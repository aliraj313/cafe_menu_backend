import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';
import { MockPaymentOutcome } from '../../generated/prisma/client';

export class MockPaymentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({
    enum: MockPaymentOutcome,
    example: MockPaymentOutcome.SUCCESS,
    description: 'Mock payment result: SUCCESS or FAILURE',
  })
  @IsEnum(MockPaymentOutcome)
  outcome!: MockPaymentOutcome;
}
