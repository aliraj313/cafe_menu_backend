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
        // Production → SMS.ir; any non-production env → mock
        return configs.NODE_ENV === 'production' ? smsir : mock;
      },
      inject: [ConfigsService, MockSmsService, SmsIrService],
    },
  ],
  exports: [SMS_SERVICE],
})
export class SmsModule {}
