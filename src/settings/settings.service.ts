import { Injectable } from '@nestjs/common';
import { Prisma, Settings } from '../generated/prisma/client';
import { ConfigsService } from '../config/configs.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
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
    await this.ensureSingleton();

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
      ...(dto.zarinpalMerchant !== undefined ? { zarinpalMerchant: dto.zarinpalMerchant } : {}),
    };

    const updated = await this.settingsRepository.update(
      this.configs.SETTINGS.SINGLETON_ID,
      data,
    );
    return toSettingsResponse(updated);
  }

  async updateTheme(theme: unknown): Promise<SettingsResponse> {
    await this.ensureSingleton();

    const themeValue =
      theme === null || theme === undefined
        ? Prisma.JsonNull
        : (theme as Prisma.InputJsonValue);

    const updated = await this.settingsRepository.update(this.configs.SETTINGS.SINGLETON_ID, {
      theme: themeValue,
    });
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
    });
  }
}
