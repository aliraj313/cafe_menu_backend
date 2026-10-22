import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponse } from './settings.mapper';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Roles(UserRole.ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get cafe settings (singleton)' })
  get(): Promise<SettingsResponse> {
    return this.settingsService.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update cafe settings' })
  update(@Body() dto: UpdateSettingsDto): Promise<SettingsResponse> {
    return this.settingsService.update(dto);
  }
}
