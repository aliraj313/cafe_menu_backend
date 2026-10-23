import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [ProductsModule, CategoriesModule, SettingsModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
