import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';
import { MockPaymentOutcome } from '../../generated/prisma/client';

export class MockPaymentDto {
  @ApiProperty({
    example: 1,
    description: 'Payment id returned from checkout (PENDING payment)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentId!: number;

  @ApiProperty({
    enum: MockPaymentOutcome,
    example: MockPaymentOutcome.SUCCESS,
    description: 'Mock result for this payment attempt',
  })
  @IsEnum(MockPaymentOutcome)
  outcome!: MockPaymentOutcome;
}
