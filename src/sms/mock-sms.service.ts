import { Injectable, Logger } from '@nestjs/common';
import { SmsMessage, SmsService } from './sms.service';

/**
 * Development SMS provider. Logs outbound messages instead of delivering them.
 * Replace with a real provider adapter when SMS credentials are configured.
 */
@Injectable()
export class MockSmsService implements SmsService {
  private readonly logger = new Logger(MockSmsService.name);

  async send(message: SmsMessage): Promise<void> {
    this.logger.log(
      JSON.stringify({
        provider: 'mock',
        to: message.to,
        text: message.text,
        at: new Date().toISOString(),
      }),
    );
  }
}
