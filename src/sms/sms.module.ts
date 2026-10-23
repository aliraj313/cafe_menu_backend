import { Module } from '@nestjs/common';
import { ConfigsModule } from '../config/configs.module';
import { ConfigsService } from '../config/configs.service';
import { MockSmsService } from './mock-sms.service';
import { SMS_SERVICE, SmsService } from './sms.service';
import { SmsIrService } from './smsir.service';

@Module({
  imports: [ConfigsModule],
  providers: [
    MockSmsService,
    SmsIrService,
    {
      provide: SMS_SERVICE,
      useFactory: (
        configs: ConfigsService,
        mock: MockSmsService,
        smsir: SmsIrService,
      ): SmsService => {
        // configs.SMS.PROVIDER is derived from NODE_ENV (production → smsir, else mock)
        return configs.SMS.PROVIDER === 'smsir' ? smsir : mock;
      },
      inject: [ConfigsService, MockSmsService, SmsIrService],
    },
  ],
  exports: [SMS_SERVICE],
})
export class SmsModule {}
