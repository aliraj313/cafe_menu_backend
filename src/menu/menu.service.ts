import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../categories/categories.repository';
import { ConfigsService } from '../config/configs.service';
import { toProductResponse, ProductResponse } from '../products/product.mapper';
import { ProductsRepository } from '../products/products.repository';
import { SettingsService } from '../settings/settings.service';
import { Prisma } from '../generated/prisma/client';

export interface MenuCategoryResponse {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Public settings for menu — no sensitive merchant id. */
export interface MenuSettingsResponse {
  id: number;
  cafeName: string;
  slogan: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  workingHours: string | null;
  address: string | null;
  instagramUrl: string | null;
  telegramUrl: string | null;
  isOpen: boolean;
  /** True only when venue is open AND Zarinpal merchant is configured. */
  orderingEnabled: boolean;
  theme: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuResponse {
  products: ProductResponse[];
  categories: MenuCategoryResponse[];
  settings: MenuSettingsResponse;
}

@Injectable()
export class MenuService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly settingsService: SettingsService,
    private readonly configs: ConfigsService,
  ) {}

  async getMenu(): Promise<MenuResponse> {
    const [products, categories, settings] = await Promise.all([
      this.productsRepository.findAllWithCategory(),
      this.categoriesRepository.findAllWithProducts(),
      this.settingsService.get(),
    ]);

    const merchantConfigured = Boolean(
      settings.zarinpalMerchant?.trim() ||
        this.configs.PAYMENT.ZARINPAL.MERCHANT_ID?.trim(),
    );

    const menuSettings: MenuSettingsResponse = {
      id: settings.id,
      cafeName: settings.cafeName,
      slogan: settings.slogan,
      logoUrl: settings.logoUrl,
      description: settings.description,
      phone: settings.phone,
      workingHours: settings.workingHours,
      address: settings.address,
      instagramUrl: settings.instagramUrl,
      telegramUrl: settings.telegramUrl,
      isOpen: settings.isOpen,
      orderingEnabled: settings.isOpen && merchantConfigured,
      theme: settings.theme,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    return {
      products: products.map(toProductResponse),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      settings: menuSettings,
    };
  }
}
