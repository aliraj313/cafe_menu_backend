import { Module } from '@nestjs/common';
import { MockSmsService } from './mock-sms.service';
import { SMS_SERVICE } from './sms.service';

@Module({
  providers: [
    {
      provide: SMS_SERVICE,
      useClass: MockSmsService,
    },
  ],
  exports: [SMS_SERVICE],
})
export class SmsModule {}
