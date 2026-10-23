import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { CheckoutResponse } from '../orders/order.mapper';
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
    summary:
      'Finalize a PENDING payment from checkout (SUCCESS → order PROCESSING, FAILURE → retry via checkout)',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MockPaymentDto,
  ): Promise<CheckoutResponse> {
    return this.paymentsService.mockPay(dto.paymentId, user.id, dto.outcome);
  }
}
