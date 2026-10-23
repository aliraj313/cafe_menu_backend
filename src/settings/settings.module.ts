import { Module } from '@nestjs/common';
import { OrderingAvailabilityService } from './ordering-availability.service';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, OrderingAvailabilityService],
  exports: [SettingsService, SettingsRepository, OrderingAvailabilityService],
})
export class SettingsModule {}
