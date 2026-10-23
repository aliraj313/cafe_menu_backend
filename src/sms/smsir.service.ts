import { Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { SmsMessage, SmsOtpMessage, SmsOtpPurpose, SmsService } from './sms.service';

/**
 * SMS.ir provider — uses Verify API for OTP templates.
 * Login and password-reset use separate template IDs from the SMS.ir panel.
 * @see https://api.sms.ir/v1/send/verify
 */
@Injectable()
export class SmsIrService implements SmsService {
  private readonly logger = new Logger(SmsIrService.name);

  constructor(private readonly configs: ConfigsService) {}

  async send(message: SmsMessage): Promise<void> {
    this.logger.warn(
      JSON.stringify({
        provider: 'smsir',
        type: 'text_unsupported',
        to: message.to,
        note: 'Use sendOtp for verification messages via SMS.ir templates',
      }),
    );
  }

  async sendOtp(message: SmsOtpMessage): Promise<void> {
    const apiKey = this.configs.SMS.SMSIR.API_KEY;
    const templateId = this.resolveTemplateId(message.purpose);

    if (!apiKey || !templateId) {
      throw new BusinessRuleException(
        'SMS_NOT_CONFIGURED',
        `SMS.ir API key or template id for purpose ${message.purpose} is not configured.`,
      );
    }

    const url = `${this.configs.SMS.SMSIR.API_BASE_URL}${this.configs.SMS_APP.VERIFY_PATH}`;
    const mobile = this.normalizeMobile(message.to);
    const body = {
      mobile,
      templateId,
      parameters: [
        {
          name: this.configs.SMS.SMSIR.OTP_PARAM_NAME,
          value: message.code,
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error({ err, mobile }, 'SMS.ir network error');
      throw new BusinessRuleException(
        'SMS_NETWORK_ERROR',
        'Could not reach SMS.ir gateway.',
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new BusinessRuleException(
        'SMS_INVALID_RESPONSE',
        'Invalid response from SMS.ir gateway.',
      );
    }

    const status = payload.status;
    if (!response.ok || status !== 1) {
      this.logger.warn({ payload, mobile, httpStatus: response.status }, 'SMS.ir send failed');
      throw new BusinessRuleException(
        'SMS_SEND_FAILED',
        typeof payload.message === 'string'
          ? payload.message
          : 'Failed to send OTP via SMS.ir.',
        [payload],
      );
    }

    this.logger.log(
      JSON.stringify({
        provider: 'smsir',
        type: 'otp',
        to: mobile,
        purpose: message.purpose,
        templateId,
        messageId: (payload.data as { messageId?: number } | undefined)?.messageId,
      }),
    );
  }

  private resolveTemplateId(purpose: SmsOtpPurpose): number | undefined {
    if (purpose === 'LOGIN') {
      return this.configs.SMS.SMSIR.LOGIN_OTP_TEMPLATE_ID;
    }
    return this.configs.SMS.SMSIR.PASSWORD_RESET_OTP_TEMPLATE_ID;
  }

  /**
   * SMS.ir examples often use numbers without leading zero (9xxxxxxxxx).
   * Accepts 09xxxxxxxxx and normalizes to 9xxxxxxxxx for the API.
   */
  private normalizeMobile(mobile: string): string {
    const trimmed = mobile.trim();
    if (/^09\d{9}$/.test(trimmed)) {
      return trimmed.slice(1);
    }
    if (/^9\d{9}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  }
}
