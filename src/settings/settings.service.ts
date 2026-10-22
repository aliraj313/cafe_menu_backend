import { Injectable } from '@nestjs/common';
import { Prisma, Settings } from '@prisma/client';
import { BusinessRuleException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { validatePaymentGatewayConfig } from './payment-gateway-config.validator';
import { SettingsResponse, toSettingsResponse } from './settings.mapper';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly configs: ConfigsService,
  ) {}

  async get(): Promise<SettingsResponse> {
    const settings = await this.ensureSingleton();
    return toSettingsResponse(settings);
  }

  async update(dto: UpdateSettingsDto): Promise<SettingsResponse> {
    const current = await this.ensureSingleton();

    const ordersAndPaymentsEnabled =
      dto.ordersAndPaymentsEnabled ?? current.ordersAndPaymentsEnabled;

    const paymentProvider =
      dto.paymentProvider !== undefined ? dto.paymentProvider : current.paymentProvider;

    const rawConfig =
      dto.paymentGatewayConfig !== undefined
        ? dto.paymentGatewayConfig
        : jsonToRecord(current.paymentGatewayConfig);

    const data: Prisma.SettingsUpdateInput = {
      ...(dto.cafeName !== undefined ? { cafeName: dto.cafeName } : {}),
      ...(dto.slogan !== undefined ? { slogan: dto.slogan } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.workingHours !== undefined ? { workingHours: dto.workingHours } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.instagramUrl !== undefined ? { instagramUrl: dto.instagramUrl } : {}),
      ...(dto.telegramUrl !== undefined ? { telegramUrl: dto.telegramUrl } : {}),
      ...(dto.ordersAndPaymentsEnabled !== undefined
        ? { ordersAndPaymentsEnabled: dto.ordersAndPaymentsEnabled }
        : {}),
    };

    if (ordersAndPaymentsEnabled) {
      if (paymentProvider === null || paymentProvider === undefined) {
        throw new BusinessRuleException(
          'PAYMENT_PROVIDER_REQUIRED',
          'paymentProvider is required when orders and payments are enabled.',
        );
      }

      const normalizedConfig = validatePaymentGatewayConfig(
        paymentProvider,
        rawConfig,
        this.configs,
      );

      data.paymentProvider = paymentProvider;
      data.paymentGatewayConfig = normalizedConfig as Prisma.InputJsonValue;
    } else {
      // When disabled, allow clearing gateway fields; keep existing if not sent.
      if (dto.paymentProvider !== undefined) {
        data.paymentProvider = dto.paymentProvider;
      } else if (dto.ordersAndPaymentsEnabled === false) {
        data.paymentProvider = null;
      }

      if (dto.paymentGatewayConfig !== undefined) {
        if (dto.paymentGatewayConfig === null) {
          data.paymentGatewayConfig = Prisma.JsonNull;
        } else if (paymentProvider) {
          data.paymentGatewayConfig = validatePaymentGatewayConfig(
            paymentProvider,
            dto.paymentGatewayConfig,
            this.configs,
          ) as Prisma.InputJsonValue;
        } else {
          data.paymentGatewayConfig = dto.paymentGatewayConfig as Prisma.InputJsonValue;
        }
      } else if (dto.ordersAndPaymentsEnabled === false) {
        data.paymentGatewayConfig = Prisma.JsonNull;
      }
    }

    const updated = await this.settingsRepository.update(
      this.configs.SETTINGS.SINGLETON_ID,
      data,
    );
    return toSettingsResponse(updated);
  }

  private async ensureSingleton(): Promise<Settings> {
    const existing = await this.settingsRepository.findById(this.configs.SETTINGS.SINGLETON_ID);
    if (existing) {
      return existing;
    }
    return this.settingsRepository.create({
      id: this.configs.SETTINGS.SINGLETON_ID,
      cafeName: this.configs.SETTINGS.DEFAULT_CAFE_NAME,
      ordersAndPaymentsEnabled: false,
    });
  }
}

function jsonToRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
