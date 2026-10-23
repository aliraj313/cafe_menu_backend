import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { OrderResponse } from '../orders/order.mapper';
import { MockPaymentDto } from './dto/mock-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mock payment (requires login) — SUCCESS or FAILURE',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MockPaymentDto,
  ): Promise<OrderResponse> {
    return this.paymentsService.mockPay(dto.orderId, user.id, dto.outcome);
  }
}
