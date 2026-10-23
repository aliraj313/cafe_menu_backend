import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MenuResponse, MenuService } from './menu.service';

@ApiTags('menu')
@Public()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({
    summary:
      'Public full menu: all products (no pagination), categories that have products, and full settings including theme',
  })
  getMenu(): Promise<MenuResponse> {
    return this.menuService.getMenu();
  }
}
