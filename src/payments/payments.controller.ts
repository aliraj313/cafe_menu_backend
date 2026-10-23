import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentStatusResponse } from '../orders/order.mapper';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('zarinpal/callback')
  @ApiOperation({
    summary:
      'Zarinpal payment callback — verifies payment server-side and redirects to frontend',
  })
  async zarinpalCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl = await this.paymentsService.handleZarinpalCallback(
      authority ?? '',
      status ?? '',
    );
    res.redirect(302, redirectUrl);
  }

  @ApiBearerAuth()
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
