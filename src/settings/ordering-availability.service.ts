import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { SettingsService } from './settings.service';

/**
 * Shared checks for whether customers may add to cart / checkout / pay.
 */
@Injectable()
export class OrderingAvailabilityService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly configs: ConfigsService,
  ) {}

  /**
   * Throws if the venue is closed or payment (Zarinpal merchant) is not configured.
   */
  async assertOrderingEnabled(): Promise<void> {
    const settings = await this.settingsService.get();

    if (!settings.isOpen) {
      throw new BusinessRuleException(
        'VENUE_CLOSED',
        'The venue is currently closed. Ordering is not available.',
      );
    }

    const merchant =
      settings.zarinpalMerchant?.trim() ||
      this.configs.PAYMENT.ZARINPAL.MERCHANT_ID?.trim() ||
      '';

    if (!merchant) {
      throw new BusinessRuleException(
        'ORDERING_DISABLED',
        'Ordering and payment are disabled because Zarinpal merchant is not configured.',
      );
    }
  }
}
