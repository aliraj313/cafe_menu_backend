import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';

/**
 * Public Zarinpal browser callback (no JWT). Hidden from OpenAPI / Scalar docs.
 * Full path: /{API_PREFIX}/payments/zarinpal/callback
 */
@ApiExcludeController()
@Public()
@Controller('payments/zarinpal')
export class ZarinpalCallbackController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('callback')
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
