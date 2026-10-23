import { Injectable, Logger } from '@nestjs/common';
import { ConfigsService, isProduction } from '../../config/configs.service';
import { BusinessRuleException } from '../../common/exceptions/app.exception';
import {
  ZarinpalRequestPayload,
  ZarinpalRequestResult,
  ZarinpalVerifyPayload,
  ZarinpalVerifyResult,
} from './zarinpal.types';

@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);

  constructor(private readonly configs: ConfigsService) {}

  isSandbox(): boolean {
    return !isProduction();
  }

  getBaseUrl(): string {
    if (this.configs.PAYMENT.ZARINPAL.API_BASE_URL) {
      return this.configs.PAYMENT.ZARINPAL.API_BASE_URL.replace(/\/$/, '');
    }
    return this.isSandbox()
      ? this.configs.PAYMENT_APP.ZARINPAL.SANDBOX_BASE_URL
      : this.configs.PAYMENT_APP.ZARINPAL.PRODUCTION_BASE_URL;
  }

  buildStartPayUrl(authority: string): string {
    return `${this.getBaseUrl()}${this.configs.PAYMENT_APP.ZARINPAL.START_PAY_PATH}${authority}`;
  }

  async requestPayment(payload: ZarinpalRequestPayload): Promise<ZarinpalRequestResult> {
    const url = `${this.getBaseUrl()}${this.configs.PAYMENT_APP.ZARINPAL.REQUEST_PATH}`;
    const body = await this.postJson(url, payload);

    const data = body.data as Record<string, unknown> | undefined;
    const errors = body.errors;
    const code = data?.code;

    if (typeof code !== 'number' || code !== 100 || typeof data?.authority !== 'string') {
      this.logger.warn({ body }, 'Zarinpal payment request failed');
      throw new BusinessRuleException(
        'ZARINPAL_REQUEST_FAILED',
        'Failed to create Zarinpal payment request.',
        [errors ?? body],
      );
    }

    return {
      authority: data.authority,
      fee: typeof data.fee === 'number' ? data.fee : 0,
      feeType: typeof data.fee_type === 'string' ? data.fee_type : '',
    };
  }

  async verifyPayment(payload: ZarinpalVerifyPayload): Promise<ZarinpalVerifyResult> {
    const url = `${this.getBaseUrl()}${this.configs.PAYMENT_APP.ZARINPAL.VERIFY_PATH}`;
    const body = await this.postJson(url, payload);

    const data = (body.data ?? {}) as Record<string, unknown>;
    const code = typeof data.code === 'number' ? data.code : -1;

    return {
      code,
      message: typeof data.message === 'string' ? data.message : '',
      refId: data.ref_id !== undefined && data.ref_id !== null ? String(data.ref_id) : null,
      cardPan: typeof data.card_pan === 'string' ? data.card_pan : null,
      cardHash: typeof data.card_hash === 'string' ? data.card_hash : null,
      fee: typeof data.fee === 'number' ? data.fee : null,
      feeType: typeof data.fee_type === 'string' ? data.fee_type : null,
    };
  }

  isSuccessCode(code: number): boolean {
    return (this.configs.PAYMENT_APP.ZARINPAL.SUCCESS_CODES as readonly number[]).includes(code);
  }

  private async postJson(
    url: string,
    payload: object,
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.error({ err, url }, 'Zarinpal HTTP request failed');
      throw new BusinessRuleException(
        'ZARINPAL_NETWORK_ERROR',
        'Could not reach Zarinpal payment gateway.',
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new BusinessRuleException(
        'ZARINPAL_INVALID_RESPONSE',
        'Invalid response from Zarinpal payment gateway.',
      );
    }

    return body;
  }
}
