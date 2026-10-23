import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { OrderResponse } from '../orders/order.mapper';
import { MockPaymentDto } from './dto/mock-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Public()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mock payment gateway — simulate SUCCESS or FAILURE for an order',
  })
  mockPay(@Body() dto: MockPaymentDto): Promise<OrderResponse> {
    return this.paymentsService.mockPay(dto.orderId, dto.outcome);
  }
}
