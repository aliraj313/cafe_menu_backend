import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { PaymentStatusResponse } from '../orders/order.mapper';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':id/status')
  @ApiOperation({
    summary:
      'Get payment status for the owner (after frontend redirect). Failed payments return status only.',
  })
  getStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentStatusResponse> {
    return this.paymentsService.getStatusForUser(id, user.id);
  }
}
