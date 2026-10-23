import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { MockPaymentDto } from './dto/mock-payment.dto';
import { MockPaymentResult, PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mock payment attempt (SUCCESS/FAILURE). Creates a Payment row; order can be retried after failure. Cart is never cleared.',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MockPaymentDto,
  ): Promise<MockPaymentResult> {
    return this.paymentsService.mockPay(dto.orderId, user.id, dto.outcome);
  }
}
