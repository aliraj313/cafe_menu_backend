import { Injectable, Logger } from '@nestjs/common';
import { SmsMessage, SmsOtpMessage, SmsService } from './sms.service';

/**
 * Development SMS provider. Logs outbound messages instead of delivering them.
 */
@Injectable()
export class MockSmsService implements SmsService {
  private readonly logger = new Logger(MockSmsService.name);

  async send(message: SmsMessage): Promise<void> {
    this.logger.log(
      JSON.stringify({
        provider: 'mock',
        type: 'text',
        to: message.to,
        text: message.text,
        at: new Date().toISOString(),
      }),
    );
  }

  async sendOtp(message: SmsOtpMessage): Promise<void> {
    this.logger.log(
      JSON.stringify({
        provider: 'mock',
        type: 'otp',
        to: message.to,
        code: message.code,
        purpose: message.purpose ?? null,
        at: new Date().toISOString(),
      }),
    );
  }
}
