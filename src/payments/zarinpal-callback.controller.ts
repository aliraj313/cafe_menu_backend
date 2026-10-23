import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';

/**
 * Public Zarinpal browser callback (no JWT).
 * Full path: /{API_PREFIX}/payments/zarinpal/callback
 */
@ApiTags('payments')
@Public()
@Controller('payments/zarinpal')
export class ZarinpalCallbackController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('callback')
  @ApiOperation({
    summary: 'Zarinpal callback — server-side verify then redirect to frontend',
  })
  async callback(
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
}
