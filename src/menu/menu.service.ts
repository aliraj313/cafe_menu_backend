import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../categories/categories.repository';
import { toProductResponse, ProductResponse } from '../products/product.mapper';
import { ProductsRepository } from '../products/products.repository';
import { SettingsResponse } from '../settings/settings.mapper';
import { SettingsService } from '../settings/settings.service';

export interface MenuCategoryResponse {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuResponse {
  products: ProductResponse[];
  categories: MenuCategoryResponse[];
  settings: SettingsResponse;
}

@Injectable()
export class MenuService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly settingsService: SettingsService,
  ) {}

  async getMenu(): Promise<MenuResponse> {
    const [products, categories, settings] = await Promise.all([
      this.productsRepository.findAllWithCategory(),
      this.categoriesRepository.findAllWithProducts(),
      this.settingsService.get(),
    ]);

    return {
      products: products.map(toProductResponse),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      settings,
    };
  }
}
